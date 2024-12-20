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

const IGNORED_FILES = new Set([
  // Media files - Images
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".avif",
  ".bmp",
  ".tiff",
  ".psd",
  // Media files - Audio
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".wma",
  ".flac",
  ".midi",
  ".mid",
  ".aiff",
  // Media files - Video
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".mkv",
  ".webm",
  ".m4v",
  ".mpg",
  ".mpeg",
  ".3gp",
  // Media files - Fonts
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
  ".eot",
  // Media files - 3D/Design
  ".obj",
  ".fbx",
  ".blend",
  ".dae",
  ".3ds",
  ".stl",
  ".ai",
  ".sketch",
  // Package manager files
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "gemfile.lock",
  "cargo.lock",
  "poetry.lock",
  "pipfile.lock",
  // Build artifacts and compiled files
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".class",
  ".o",
  ".obj",
  ".pyc",
  ".pyo",
  ".pyd",
  ".jar",
  ".war",
  ".ear",
  ".min.js",
  ".min.css",
  // IDE and editor files
  ".idea",
  ".vscode",
  ".vs",
  ".sublime-workspace",
  ".sublime-project",
  ".project",
  ".settings",
  // Version control
  ".git",
  ".svn",
  ".hg",
  ".gitignore",
  ".gitattributes",
  // Temporary and cache files
  ".tmp",
  ".temp",
  ".cache",
  ".log",
  ".swp",
  ".DS_Store",
  "thumbs.db",
  // Build and dependency directories
  "node_modules",
  "vendor",
  "dist",
  "build",
  "__pycache__",
  ".pytest_cache",
  ".next",
  ".nuxt",
  // Test coverage and reports
  "coverage",
  ".nyc_output",
  ".coverage",
  "junit.xml",
  // Environment and local config
  ".env.local",
  ".env.development.local",
  ".env.test.local",
  ".env.production.local",
  // Debug files
  ".map",
  ".pdb",
]);

export class GitHubServiceImpl implements GitHubService {
  private readonly baseUrl = "https://api.github.com";
  private readonly axiosInstance: AxiosInstance;
  private readonly ignoredPatterns: RegExp[];

  constructor(private readonly accessToken: string) {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // Initialize ignored patterns
    this.ignoredPatterns = this.initializeIgnorePatterns();

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
          const sleepTime = Math.max(0, resetTime - Date.now());
          if (sleepTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, sleepTime));
            return this.axiosInstance.request(error.config!);
          }
        }
        throw error;
      }
    );
  }

  private initializeIgnorePatterns(): RegExp[] {
    const patterns: RegExp[] = [];

    // Group extensions
    const extensions = Array.from(IGNORED_FILES)
      .filter((file) => file.startsWith("."))
      .map((ext) => ext.replace(".", "\\."));

    if (extensions.length > 0) {
      patterns.push(new RegExp(`(${extensions.join("|")})$`, "i"));
    }

    // Group exact matches (filenames and directories)
    const exactMatches = Array.from(IGNORED_FILES)
      .filter((file) => !file.startsWith("."))
      .map((file) => `^${file}$|/${file}(/|$)`);

    if (exactMatches.length > 0) {
      patterns.push(new RegExp(exactMatches.join("|"), "i"));
    }

    return patterns;
  }

  private shouldProcessFile(path: string): boolean {
    // Early return for empty path
    if (!path) return true;
    return !this.ignoredPatterns.some((pattern) => pattern.test(path));
  }

  private async processDirectory(
    owner: string,
    repo: string,
    path = "",
    accumulated: ProcessedContent[] = []
  ): Promise<ProcessedContent[]> {
    try {
      // First check if the current directory path should be processed
      if (path && !this.shouldProcessFile(path)) {
        return accumulated;
      }

      const { data: contents } = await this.axiosInstance.get<GitHubContent[]>(
        `/repos/${owner}/${repo}/contents/${path}`
      );

      // Pre-filter and categorize contents in a single pass
      const { directories, files } = contents.reduce<{
        directories: GitHubContent[];
        files: GitHubContent[];
      }>(
        (acc, item) => {
          // Only process items that pass the filter
          if (this.shouldProcessFile(item.path)) {
            if (item.type === "dir") {
              acc.directories.push(item);
            } else {
              acc.files.push(item);
            }
          }
          return acc;
        },
        { directories: [], files: [] }
      );

      // Add valid directories to accumulated list
      directories.forEach((dir) => {
        accumulated.push({
          path: dir.path,
          content: null,
          type: "dir" as const,
        });
      });

      // Process files in chunks with pre-filtered list
      const chunks = Array.from({
        length: Math.ceil(files.length / MAX_CONCURRENT_REQUESTS),
      }).map((_, i) =>
        files.slice(
          i * MAX_CONCURRENT_REQUESTS,
          (i + 1) * MAX_CONCURRENT_REQUESTS
        )
      );

      for (const chunk of chunks) {
        const fileContents = await Promise.all(
          chunk.map(async (file) => ({
            path: file.path,
            content: await this.getFileContent(owner, repo, file.path),
            type: "file" as const,
          }))
        );

        accumulated.push(...fileContents.filter((f) => f.content !== null));
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }

      // Process directories recursively
      for (const dir of directories) {
        await this.processDirectory(owner, repo, dir.path, accumulated);
      }

      return accumulated;
    } catch (error) {
      throw error;
    }
  }

  private async getFileContent(
    owner: string,
    repo: string,
    filePath: string
  ): Promise<string | null> {
    try {
      // Double-check if we should process this file
      if (!this.shouldProcessFile(filePath)) {
        return null;
      }

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

      // Filter out ignored files from the initial content listing
      // console.log("data value in the getRepositoryContent", data.length());
      const filteredData = data.filter((item) =>
        this.shouldProcessFile(item.path)
      );

      // console.log(
      //   "filteredData value in the getRepositoryContent",
      //   filteredData
      // );
      return {
        data: {
          owner,
          content: filteredData,
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

  // Rest of the methods remain the same...
}
export function createGitHubService(accessToken: string): GitHubService {
  return new GitHubServiceImpl(accessToken);
}
