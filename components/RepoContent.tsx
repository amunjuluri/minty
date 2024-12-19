import { FC, useState } from "react";
import { ProcessedContent } from "@/types/github";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepoContentProps {
  content: ProcessedContent[];
}

export const RepoContent: FC<RepoContentProps> = ({ content }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const togglePath = (path: string) => {
    const newExpandedPaths = new Set(expandedPaths);
    if (expandedPaths.has(path)) {
      newExpandedPaths.delete(path);
    } else {
      newExpandedPaths.add(path);
    }
    setExpandedPaths(newExpandedPaths);
  };

  const renderContent = (items: ProcessedContent[], level = 0) => {
    return items.map((item) => {
      const isExpanded = expandedPaths.has(item.path);
      const hasChildren = item.type === "directory" && item.children?.length;

      return (
        <div key={item.path} className="w-full">
          <button
            onClick={() => hasChildren && togglePath(item.path)}
            className={cn(
              "w-full flex items-center px-2 py-1 hover:bg-slate-100 rounded-md",
              "text-left text-sm",
              { "cursor-pointer": hasChildren }
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
          >
            <span className="mr-2">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : (
                <File className="h-4 w-4" />
              )}
            </span>
            <span className="flex items-center gap-2">
              {item.type === "directory" ? (
                <Folder className="h-4 w-4 text-blue-500" />
              ) : (
                <File className="h-4 w-4 text-gray-500" />
              )}
              {item.path.split("/").pop()}
            </span>
            {item.size && (
              <span className="ml-2 text-xs text-gray-500">
                ({Math.round(item.size / 1024)}kb)
              </span>
            )}
          </button>
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderContent(item.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Repository Contents</h2>
      <div className="border rounded-lg p-4 bg-white">
        {renderContent(content)}
      </div>
    </div>
  );
};
