// types/github.ts (not .d.ts)
export interface GitHubError {
  message: string;
  documentation_url?: string;
  status?: number;
}

export interface GitHubResponse<T> {
  data: T | null;
  error: GitHubError | null;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  default_branch: string;
  description: string | null;
  private: boolean;
  visibility: 'public' | 'private';
  language: string | null;
  stargazers_count: number;
  html_url: string;
  contents_url: string;
}

export interface GitHubContent {
  type: "file" | "dir" | "symlink" | "submodule";
  name: string;
  path: string;
  content?: string;
  encoding?: string;
  size: number;
  sha: string;
  url: string;
  html_url: string;
  download_url: string | null;
}

export interface RepositoryContent {
  owner: string;
  content: GitHubContent[];
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

export interface GitHubService {
  listUserRepositories(): Promise<GitHubResponse<GitHubRepository[]>>;
  getRepositoryContent(repoFullName: string): Promise<GitHubResponse<RepositoryContent>>;
  searchRepositories(query: string): Promise<GitHubResponse<GitHubRepository[]>>;
}