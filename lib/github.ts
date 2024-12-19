// lib/github.ts
import axios, { AxiosError, AxiosInstance } from "axios";
import type {
  GitHubService,
  GitHubResponse,
  GitHubRepository,
  RepositoryContent,
  GitHubError,
  GitHubSearchResponse,
  GitHubContent,
  ProcessedContent,
} from "@/types/github";

const MAX_CONCURRENT_REQUESTS = 3;
const RATE_LIMIT_DELAY = 1000; // 1 second delay between batches

export class GitHubServiceImpl implements GitHubService {
  private readonly baseUrl = "https://api.github.com";
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly accessToken: string) {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // Add response interceptor for rate limiting
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (
          error.response?.status === 403 &&
          error.response.headers["x-ratelimit-remaining"] === "0"
        ) {
          const resetTime =
            parseInt(error.response.headers["x-ratelimit-reset"] || "0") * 1000;
          const currentTime = Date.now();
          const sleepTime = Math.max(0, resetTime - currentTime);

          if (sleepTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, sleepTime));
            return this.axiosInstance.request(error.config!);
          }
        }
        throw error;
      }
    );
  }

  private handleError(error: unknown): GitHubError {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return { message: "Resource not found", status: 404 };
      }
      if (error.response?.status === 403) {
        return {
          message: "GitHub API rate limit exceeded or insufficient permissions",
          status: 403,
        };
      }
      return {
        message: error.response?.data?.message || "GitHub API error",
        status: error.response?.status,
      };
    }
    return {
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }

  private async getFileContent(
    owner: string,
    repo: string,
    filePath: string
  ): Promise<string | null> {
    try {
      const { data } = await this.axiosInstance.get<GitHubContent>(
        `/repos/${owner}/${repo}/contents/${filePath}`
      );

      if ("content" in data) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return null;
    } catch (error) {
      console.error(`Error fetching file content for ${filePath}:`, error);
      return null;
    }
  }

  private async processDirectory(
    owner: string,
    repo: string,
    path = "",
    accumulated: ProcessedContent[] = []
  ): Promise<ProcessedContent[]> {
    try {
      const { data: contents } = await this.axiosInstance.get<GitHubContent[]>(
        `/repos/${owner}/${repo}/contents/${path}`
      );

      const directories: GitHubContent[] = [];
      const files: GitHubContent[] = [];

      contents.forEach((item) => {
        if (item.type === "dir") {
          directories.push(item);
        } else if (item.type === "file") {
          files.push(item);
        }
      });

      // Process files in chunks to avoid rate limiting
      const chunks = Array.from({
        length: Math.ceil(files.length / MAX_CONCURRENT_REQUESTS),
      }).map((_, index) =>
        files.slice(
          index * MAX_CONCURRENT_REQUESTS,
          (index + 1) * MAX_CONCURRENT_REQUESTS
        )
      );

      for (const chunk of chunks) {
        const fileContents = await Promise.all(
          chunk.map(async (file): Promise<ProcessedContent> => {
            const content = await this.getFileContent(owner, repo, file.path);
            return {
              path: file.path,
              content,
              type: "file",
            };
          })
        );
        accumulated.push(...fileContents);

        // Add delay between chunks to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }

      // Process directories recursively
      for (const dir of directories) {
        accumulated.push({
          path: dir.path,
          content: null,
          type: "dir",
        });
        await this.processDirectory(owner, repo, dir.path, accumulated);
      }

      return accumulated;
    } catch (error) {
      throw error;
    }
  }

  async listUserRepositories(): Promise<GitHubResponse<GitHubRepository[]>> {
    try {
      const { data } = await this.axiosInstance.get<GitHubRepository[]>(
        "/user/repos",
        {
          params: {
            affiliation: "owner",
            sort: "updated",
            per_page: 100,
          },
        }
      );
      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async getRepositoryContent(
    repoFullName: string
  ): Promise<GitHubResponse<RepositoryContent>> {
    try {
      const [owner, repo] = repoFullName.split("/");

      if (!owner || !repo) {
        return {
          data: null,
          error: { message: 'Repository name must be in format "owner/repo"' },
        };
      }

      const { data } = await this.axiosInstance.get<GitHubContent[]>(
        `/repos/${owner}/${repo}/contents`
      );

      return {
        data: {
          owner,
          content: data,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async getAllRepositoryContents(
    repoFullName: string
  ): Promise<GitHubResponse<ProcessedContent[]>> {
    try {
      const [owner, repo] = repoFullName.split("/");

      if (!owner || !repo) {
        return {
          data: null,
          error: { message: 'Repository name must be in format "owner/repo"' },
        };
      }

      const contents = await this.processDirectory(owner, repo);
      return { data: contents, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async searchRepositories(
    query: string
  ): Promise<GitHubResponse<GitHubRepository[]>> {
    try {
      const { data } = await this.axiosInstance.get<GitHubSearchResponse>(
        "/search/repositories",
        {
          params: {
            q: query,
            per_page: 100,
            sort: "stars",
            order: "desc",
          },
        }
      );
      return { data: data.items, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }
}

export function createGitHubService(accessToken: string): GitHubService {
  return new GitHubServiceImpl(accessToken);
}
