// types/docs.ts
export interface DocumentationStatus {
    currentChunk: number;
    totalChunks: number;
    status: 'processing' | 'completed' | 'error';
  }
  
  export interface DocumentationResponse {
    content: string;
    status: DocumentationStatus;
  }