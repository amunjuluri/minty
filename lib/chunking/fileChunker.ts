// import { FileChunk } from "./types";
import type { ProcessedContent } from "@/types/github";

function determineFileType(path: string, content: string): FileChunk["type"] {
  // Documentation files
  if (
    path.endsWith(".md") ||
    path.endsWith(".txt") ||
    path.endsWith(".rst") ||
    path.endsWith(".adoc") ||
    path.endsWith(".wiki") ||
    path.endsWith(".org")
  )
    return "documentation";

  // Configuration files
  if (
    path.endsWith(".json") ||
    path.endsWith(".yaml") ||
    path.endsWith(".yml") ||
    path.endsWith(".env") ||
    path.endsWith(".toml") ||
    path.endsWith(".ini") ||
    path.endsWith(".xml") ||
    path.endsWith(".conf")
  )
    return "config";

  return "code";
}

function determineLanguage(path: string): string | undefined {
  const extensions: Record<string, string> = {
    // JavaScript ecosystem
    ".ts": "TypeScript",
    ".tsx": "TypeScript React",
    ".js": "JavaScript",
    ".jsx": "JavaScript React",
    ".mjs": "JavaScript Module",
    ".cjs": "CommonJS",
    ".vue": "Vue",
    ".svelte": "Svelte",

    // Styling
    ".css": "CSS",
    ".scss": "SCSS",
    ".sass": "Sass",
    ".less": "Less",
    ".styl": "Stylus",

    // Markup
    ".html": "HTML",
    ".htm": "HTML",
    ".xml": "XML",
    ".svg": "SVG",

    // Backend languages
    ".py": "Python",
    ".java": "Java",
    ".rb": "Ruby",
    ".php": "PHP",
    ".go": "Go",
    ".rs": "Rust",
    ".cs": "C#",
    ".cpp": "C++",
    ".c": "C",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".scala": "Scala",
    ".ex": "Elixir",
    ".exs": "Elixir Script",

    // Shell scripting
    ".sh": "Shell",
    ".bash": "Bash",
    ".zsh": "Zsh",
    ".fish": "Fish",
    ".ps1": "PowerShell",

    // Templates
    ".ejs": "EJS",
    ".hbs": "Handlebars",
    ".pug": "Pug",
    ".jade": "Jade",

    // Data formats
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
    ".csv": "CSV",
    // ".xml": "XML",

    // Documentation
    ".md": "Markdown",
    ".rst": "reStructuredText",
    ".adoc": "AsciiDoc",
    ".tex": "LaTeX",
  };

  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  return extensions[ext];
}

function shouldIgnoreFile(path: string): boolean {
  const lowerPath = path.toLowerCase();

  // Files to ignore
  const ignoreFiles = [
    // Media files - Images
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".ico",
    ".webp",
    ".avif",
    ".bmp",
    ".tiff",
    ".psd",

    // Media files - Audio
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
    ".wma",
    ".flac",
    ".midi",
    ".mid",
    ".aiff",

    // Media files - Video
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".mkv",
    ".webm",
    ".m4v",
    ".mpg",
    ".mpeg",
    ".3gp",

    // Media files - Fonts
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
    ".eot",

    // Media files - 3D/Design
    ".obj",
    ".fbx",
    ".blend",
    ".dae",
    ".3ds",
    ".stl",
    ".ai",
    ".sketch",

    // Package manager files
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "composer.lock",
    "gemfile.lock",
    "cargo.lock",
    "poetry.lock",
    "pipfile.lock",

    // Build artifacts and compiled files
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".class",
    ".o",
    ".obj",
    ".pyc",
    ".pyo",
    ".pyd",
    ".jar",
    ".war",
    ".ear",
    ".min.js",
    ".min.css",

    // IDE and editor files
    ".idea",
    ".vscode",
    ".vs",
    ".sublime-workspace",
    ".sublime-project",
    ".project",
    ".settings",

    // Version control
    ".git",
    ".svn",
    ".hg",
    ".gitignore",
    ".gitattributes",

    // Temporary and cache files
    ".tmp",
    ".temp",
    ".cache",
    ".log",
    ".swp",
    ".DS_Store",
    "thumbs.db",

    // Build and dependency directories
    "node_modules",
    "vendor",
    "dist",
    "build",
    "__pycache__",
    ".pytest_cache",
    ".next",
    ".nuxt",

    // Test coverage and reports
    "coverage",
    ".nyc_output",
    ".coverage",
    "junit.xml",

    // Environment and local config
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env.production.local",

    // Debug files
    ".map",
    ".pdb",
  ];

  // Check if the path contains or ends with any of the ignore patterns
  return ignoreFiles.some((pattern) => {
    if (pattern.startsWith(".")) {
      // For file extensions and hidden files, check if path ends with the pattern
      return lowerPath.endsWith(pattern);
    } else {
      // For directories and specific files, check if path includes the pattern
      return lowerPath.includes(pattern);
    }
  });
}

export function createFileChunks(files: ProcessedContent[]): FileChunk[] {
  console.log("stage 3: you reached createfilechunks");
  return files
    .filter((f) => f.content !== null)
    .filter((f) => !shouldIgnoreFile(f.path))
    .map((file) => ({
      type: determineFileType(file.path, file.content!),
      content: file.content!,
      path: file.path,
      size: file.content!.length,
      language: determineLanguage(file.path),
    }));
}
