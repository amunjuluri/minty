interface FileChunk {
  content: string;
  type: string;
  path: string;
  size: number;
  tokens?: number; // Added tokens as optional
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

const MAX_TOKENS = 3000;
const CHARS_PER_TOKEN = 1;

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
    const maxChars = MAX_TOKENS * CHARS_PER_TOKEN;
    const chunkSize = Math.min(maxChars, content.length);

    let splitPoint = chunkSize;
    if (chunkSize < content.length) {
      const boundaries = [
        content.lastIndexOf("\n\n", chunkSize),
        content.lastIndexOf("\n", chunkSize),
        content.lastIndexOf(". ", chunkSize),
        content.lastIndexOf(" ", chunkSize),
      ];

      const validBoundary = boundaries.find((b) => b > chunkSize * 0.75);
      if (validBoundary !== undefined) {
        splitPoint = validBoundary;
      }
    }

    const chunkContent = content.slice(0, splitPoint);
    const calculatedTokens = estimateTokens(chunkContent);

    chunks.push({
      ...file,
      content: chunkContent,
      size: chunkContent.length,
      tokens: calculatedTokens, // Added token calculation
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
  const groupedFiles = files.reduce<Record<string, FileChunk[]>>(
    (acc, file) => {
      const directory = file.path.split("/").slice(0, -1).join("/");
      const key = `${directory}:${file.type}`;
      acc[key] = acc[key] || [];

      if (estimateTokens(file.content) > MAX_TOKENS) {
        acc[key].push(...splitLargeFile(file));
      } else {
        const fileWithTokens = {
          ...file,
          tokens: estimateTokens(file.content),
        };
        acc[key].push(fileWithTokens);
      }
      return acc;
    },
    {}
  );

  let currentChunk: AnalysisChunk = createNewChunk();

  Object.entries(groupedFiles).forEach(([groupKey, groupFiles]) => {
    const sortedFiles = groupFiles.sort((a, b) => {
      if (
        a.isPartialChunk &&
        b.isPartialChunk &&
        a.chunkIndex !== undefined &&
        b.chunkIndex !== undefined
      ) {
        return a.chunkIndex - b.chunkIndex;
      }
      return a.path.localeCompare(b.path);
    });

    sortedFiles.forEach((file) => {
      const fileTokens = file.tokens ?? estimateTokens(file.content);

      if (currentChunk.totalTokens + fileTokens > MAX_TOKENS) {
        if (optimizeChunk(currentChunk)) {
          chunks.push(currentChunk);
          currentChunk = createNewChunk();
        }
      }

      currentChunk.files.push(file);
      currentChunk.totalTokens += fileTokens;
      updateChunkContext(currentChunk, file, groupKey);
    });
  });

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
  if (chunk.totalTokens > MAX_TOKENS) {
    return true;
  }
  return false;
}

function updateChunkContext(
  chunk: AnalysisChunk,
  file: FileChunk,
  groupKey: string
): void {
  const contextParts: string[] = [];

  if (
    file.isPartialChunk &&
    file.chunkIndex !== undefined &&
    file.totalChunks !== undefined
  ) {
    contextParts.push(
      `Part ${file.chunkIndex + 1} of ${file.totalChunks} of ${file.path}`
    );
  }

  const [directory] = groupKey.split(":");
  if (directory) {
    contextParts.push(`Directory: ${directory}`);
  }

  chunk.context = contextParts.join("\n");
}
