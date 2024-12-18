import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  GitHubService,
  GitHubResponse,
  GitHubRepository,
  RepositoryContent,
  GitHubError,
  GitHubSearchResponse,
  GitHubContent 
} from '@/types/github';

export class GitHubServiceImpl implements GitHubService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly accessToken: string) {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
  }

  private handleError(error: unknown): GitHubError {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return { message: 'Resource not found', status: 404 };
      }
      if (error.response?.status === 403) {
        return { 
          message: 'GitHub API rate limit exceeded or insufficient permissions',
          status: 403
        };
      }
      return {
        message: error.response?.data?.message || 'GitHub API error',
        status: error.response?.status
      };
    }
    return { message: error instanceof Error ? error.message : 'An unknown error occurred' };
  }

  async listUserRepositories(): Promise<GitHubResponse<GitHubRepository[]>> {
    try {
      const { data } = await this.axiosInstance.get<GitHubRepository[]>(
        '/user/repos',
        {
          params: {
            affiliation: 'owner',
            sort: 'updated',
            per_page: 100
          }
        }
      );
      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async getRepositoryContent(repoFullName: string): Promise<GitHubResponse<RepositoryContent>> {
    try {
      const [owner, repo] = repoFullName.split('/');
      
      if (!owner || !repo) {
        return {
          data: null,
          error: { message: 'Repository name must be in format "owner/repo"' }
        };
      }

      const { data } = await this.axiosInstance.get<GitHubContent[]>(
        `/repos/${owner}/${repo}/contents`
      );

      return {
        data: {
          owner,
          content: data
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async searchRepositories(query: string): Promise<GitHubResponse<GitHubRepository[]>> {
    try {
      const { data } = await this.axiosInstance.get<GitHubSearchResponse>(
        '/search/repositories',
        {
          params: {
            q: query,
            per_page: 100,
            sort: 'stars',
            order: 'desc'
          }
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