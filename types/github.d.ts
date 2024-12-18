export interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    visibility: 'public' | 'private';
    language: string | null;
    stargazers_count: number;
    node_id: string;
    private: boolean;
    html_url: string;
    // Add other fields as needed
  }
  
  export interface GitHubError {
    message: string;
  }
  
  export interface GitHubResponse<T> {
    data: T | null;
    error: GitHubError | null;
  }
  
  export interface GitHubService {
    listRepositories(): Promise<GitHubResponse<GitHubRepository[]>>;
  }