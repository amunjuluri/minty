// types/github.ts

// Base content type that both FileChunk and ProcessedContent extend
interface BaseContent {
  path: string;
  size?: number;
  content?: string;
  language?: string;
}

// ProcessedContent represents the initial file data
export interface ProcessedContent extends BaseContent {
  type: "file" | "directory";
  children?: ProcessedContent[];
}

// FileChunk represents a processed chunk of file content
export interface FileChunk extends BaseContent {
  type: string;
  tokens?: number;
  chunkIndex?: number;
  isPartialChunk?: boolean;
  totalChunks?: number;
}

// Type guards for type checking
export function isProcessedContent(
  content: BaseContent
): content is ProcessedContent {
  return (
    (content as ProcessedContent).type === "file" ||
    (content as ProcessedContent).type === "directory"
  );
}

export function isFileChunk(content: BaseContent): content is FileChunk {
  return !!(content as FileChunk).chunkIndex !== undefined;
}
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
  visibility: "public" | "private";
  language: string | null;
  stargazers_count: number;
  html_url: string;
  contents_url: string;
  updated_at: string;
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

export interface ProcessedContent {
  path: string;
  type: "file" | "directory";
  content?: string;
  size?: number;
  language?: string;
  children?: ProcessedContent[];
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

// Update interfaces to match expected types
export interface StreamOptions {
  onChunkStart?: (chunkIndex: number, totalChunks: number) => void;
  onChunkComplete?: (chunkIndex: number, result: AnalysisResult) => void;
  onProgress?: (progress: number) => void;
}

export interface StreamResult {
  text: string;
  accumulated: string;
  done: boolean;
}

export interface AnalysisMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Update ProcessedContent type if not already defined in github.ts
export interface ProcessedContent {
  path: string;
  type: "file" | "directory";
  content?: string;
  size?: number;
}

// Update AnalysisResult interface
export interface ExtendedAnalysisResult extends AnalysisResult {
  architecture: string;
  dependencies: string;
  functionality: string;
  codeQuality: string;
  improvements: string;
}

// Define enhanced chunk type
export interface EnhancedAnalysisChunk extends AnalysisChunk {
  totalSize: number;
  maxTokens: number;
  files: ProcessedContent[];
}

export interface AnalysisChunk {
  files: ProcessedContent[];
  context: {
    totalFiles: number;
    chunkIndex: number;
    totalChunks: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
