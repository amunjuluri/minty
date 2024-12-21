import { FileChunk, AnalysisChunk, ProcessedContent } from "@/types/github";
function determineFileType(path: string, content: string): FileChunk["type"] {
  if (path.endsWith(".md") || path.endsWith(".txt")) return "documentation";
  if (path.endsWith(".json") || path.endsWith(".yaml") || path.endsWith(".env"))
    return "config";
  if (path.endsWith(".jpg") || path.endsWith(".png") || path.endsWith(".svg"))
    return "asset";
  return "code";
}

function determineLanguage(path: string): string | undefined {
  const extensions: Record<string, string> = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript React",
    ".js": "JavaScript",
    ".jsx": "JavaScript React",
    ".py": "Python",
    ".java": "Java",
    ".css": "CSS",
    ".scss": "SCSS",
    ".html": "HTML",
  };

  const ext = path.slice(path.lastIndexOf("."));
  return extensions[ext];
}

function createFileChunks(files: ProcessedContent[]): FileChunk[] {
  return files
    .filter((f) => f.content !== null)
    .map((file) => ({
      type: determineFileType(file.path, file.content!),
      content: file.content!,
      path: file.path,
      size: file.content!.length,
      language: determineLanguage(file.path),
    }));
}
