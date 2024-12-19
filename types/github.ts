// types/github.ts (not .d.ts)
// export interface GitHubError {
//   message: string;
//   documentation_url?: string;
//   status?: number;
// }

// export interface GitHubResponse<T> {
//   data: T | null;
//   error: GitHubError | null;
// }

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
  visibility: "public" | "private";
  language: string | null;
  stargazers_count: number;
  html_url: string;
  contents_url: string;
  updated_at: string; 
}

// export interface GitHubContent {
//   type: "file" | "dir" | "symlink" | "submodule";
//   name: string;
//   path: string;
//   content?: string;
//   encoding?: string;
//   size: number;
//   sha: string;
//   url: string;
//   html_url: string;
//   download_url: string | null;
// }

export interface RepositoryContent {
  owner: string;
  content: GitHubContent[];
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

// export interface GitHubService {
//   listUserRepositories(): Promise<GitHubResponse<GitHubRepository[]>>;
//   getRepositoryContent(repoFullName: string): Promise<GitHubResponse<RepositoryContent>>;
//   searchRepositories(query: string): Promise<GitHubResponse<GitHubRepository[]>>;
// }
// types/github.ts

export interface GitHubError {
  message: string;
  status?: number;
}

export interface GitHubResponse<T> {
  data: T | null;
  error: GitHubError | null;
}

export interface GitHubContent {
  type: "file" | "dir";
  name: string;
  path: string;
  sha: string;
  size?: number;
  content?: string;
  download_url?: string;
}

export interface ProcessedContent {
  path: string;
  content: string | null;
  type: "file" | "dir";
}

export interface GitHubService {
  listUserRepositories(): Promise<GitHubResponse<GitHubRepository[]>>;
  getRepositoryContent(
    fullRepoName: string,
    path?: string
  ): Promise<GitHubResponse<GitHubContent[]>>;
  getFileContent(
    fullRepoName: string,
    filePath: string
  ): Promise<GitHubResponse<{ content: string }>>;
  getAllRepositoryContents(
    fullRepoName: string
  ): Promise<GitHubResponse<ProcessedContent[]>>;
}
// types/github.ts

export interface ProcessedContent {
  path: string;
  type: "file" | "dir";
  content: string | null; // Updated to allow null values
  language?: string;
  size?: number;
}

export interface AnalysisResult {
  architecture: string;
  dependencies: string;
  functionality: string;
  codeQuality: string;
  improvements: string;
}

export interface AnalysisChunk {
  files: ProcessedContent[];
  context: {
    totalFiles: number;
    chunkIndex: number;
    totalChunks: number;
  };
}

// Add type safety for API responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface AnalysisResult {
  fileName: string;
  suggestions: {
    type: "improvement" | "warning" | "error";
    message: string;
    line?: number;
    code?: string;
  }[];
  metrics: {
    complexity: number;
    maintainability: number;
    testCoverage?: number;
  };
}

export interface ProcessedContent {
  path: string;
  type: "file" | "directory";
  content?: string;
  size?: number;
  language?: string;
  children?: ProcessedContent[];
}
