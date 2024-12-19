interface FileChunk {
  content: string;
  type: string;
  path: string;
  size: number;
  chunkIndex?: number;
  isPartialChunk?: boolean;
  totalChunks?: number;
}

interface AnalysisChunk {
  files: FileChunk[];
  totalTokens: number;
  maxTokens: number;
  context: string;
}

const MAX_TOKENS = 3000; // GPT-3.5 context limit
const CHARS_PER_TOKEN = 4; // Average estimation

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function splitLargeFile(file: FileChunk): FileChunk[] {
  const chunks: FileChunk[] = [];
  let content = file.content;
  let chunkIndex = 0;

  const totalTokens = estimateTokens(content);
  const totalChunks = Math.ceil(totalTokens / MAX_TOKENS);

  while (content.length > 0) {
    // Calculate chunk size based on tokens
    const maxChars = MAX_TOKENS * CHARS_PER_TOKEN;
    const chunkSize = Math.min(maxChars, content.length);

    // Find a clean break point
    let splitPoint = chunkSize;
    if (chunkSize < content.length) {
      // Try to split at semantic boundaries in order of preference
      const boundaries = [
        content.lastIndexOf("\n\n", chunkSize), // Prefer paragraph breaks
        content.lastIndexOf("\n", chunkSize), // Then line breaks
        content.lastIndexOf(". ", chunkSize), // Then sentences
        content.lastIndexOf(" ", chunkSize), // Finally word breaks
      ];

      const validBoundary = boundaries.find((b) => b > chunkSize * 0.75); // Ensure chunk is at least 75% full
      if (validBoundary !== undefined) {
        splitPoint = validBoundary;
      }
    }

    const chunkContent = content.slice(0, splitPoint);

    chunks.push({
      ...file,
      content: chunkContent,
      size: chunkContent.length,
      tokens: estimateTokens(chunkContent),
      chunkIndex,
      isPartialChunk: totalChunks > 1,
      totalChunks,
      path: `${file.path}${totalChunks > 1 ? `:chunk${chunkIndex + 1}` : ""}`,
    });

    content = content.slice(splitPoint).trim();
    chunkIndex++;
  }

  return chunks;
}
export function createAnalysisChunks(files: FileChunk[]): AnalysisChunk[] {
  const chunks: AnalysisChunk[] = [];

  // Group files by type and directory
  const groupedFiles = files.reduce((acc, file) => {
    const directory = file.path.split("/").slice(0, -1).join("/");
    const key = `${directory}:${file.type}`;
    acc[key] = acc[key] || [];

    // Split large files before grouping
    if (estimateTokens(file.content) > MAX_TOKENS) {
      acc[key].push(...splitLargeFile(file));
    } else {
      acc[key].push(file);
    }
    return acc;
  }, {} as Record<string, FileChunk[]>);

  let currentChunk: AnalysisChunk = createNewChunk();

  // Process each group to keep related files together
  Object.entries(groupedFiles).forEach(([groupKey, groupFiles]) => {
    // Sort files to keep related files together
    const sortedFiles = groupFiles.sort((a, b) => {
      // Keep chunks of the same file together
      if (a.isPartialChunk && b.isPartialChunk) {
        return a.chunkIndex! - b.chunkIndex!;
      }
      return a.path.localeCompare(b.path);
    });

    sortedFiles.forEach((file) => {
      const fileTokens = file.tokens ?? estimateTokens(file.content);

      // Check if adding this file would exceed token limit
      if (currentChunk.totalTokens + fileTokens > MAX_TOKENS) {
        // First try to optimize current chunk
        if (optimizeChunk(currentChunk)) {
          chunks.push(currentChunk);
          currentChunk = createNewChunk();
        }
      }

      currentChunk.files.push(file);
      currentChunk.totalTokens += fileTokens;

      // Update context with file relationship info
      updateChunkContext(currentChunk, file, groupKey);
    });
  });

  // Add the last chunk if it has files
  if (currentChunk.files.length > 0) {
    optimizeChunk(currentChunk);
    chunks.push(currentChunk);
  }

  return chunks;
}

function createNewChunk(): AnalysisChunk {
  return {
    files: [],
    totalTokens: 0,
    maxTokens: MAX_TOKENS,
    context: "",
  };
}

function optimizeChunk(chunk: AnalysisChunk): boolean {
  // Try to optimize chunk if it's too large
  if (chunk.totalTokens > MAX_TOKENS) {
    // Implement optimization strategies like removing comments
    // or splitting at logical boundaries
    return true;
  }
  return false;
}

function updateChunkContext(
  chunk: AnalysisChunk,
  file: FileChunk,
  groupKey: string
): void {
  const contextParts = [];

  if (file.isPartialChunk) {
    contextParts.push(
      `Part ${file.chunkIndex! + 1} of ${file.totalChunks} of ${file.path}`
    );
  }

  // Add directory context
  const [directory] = groupKey.split(":");
  if (directory) {
    contextParts.push(`Directory: ${directory}`);
  }

  chunk.context = contextParts.join("\n");
}
