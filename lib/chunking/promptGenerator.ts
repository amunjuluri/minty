import {
  ProcessedContent,
  AnalysisChunk,
  EnhancedAnalysisChunk,
} from "@/types/github";

export function generateChunkPrompt(
  chunk: EnhancedAnalysisChunk,
  chunkIndex: number,
  totalChunks: number
): string {
  const fileTypes = new Set(chunk.files.map((f) => f.type));

  return `Analyzing repository chunk ${chunkIndex + 1}/${totalChunks}
File types in this chunk: ${Array.from(fileTypes).join(", ")}

Please analyze these files and provide insights about:
1. Architecture and patterns used
2. Dependencies and their purposes
3. Key functionality
4. Code quality and best practices
5. Potential improvements

Files in this chunk:
${chunk.files
  .map(
    (f) => `
Path: ${f.path}
Type: ${f.type}
Language: ${f.language || "N/A"}
Content:
\`\`\`${f.language || ""}
${f.content}
\`\`\`
`
  )
  .join("\n")}

Please provide a detailed analysis focusing on how these files contribute to the overall project.`;
}
