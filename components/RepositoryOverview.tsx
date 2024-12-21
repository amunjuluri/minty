"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ProcessedContent } from "@/types/github";
import type { Session } from "next-auth";

interface RepositoryOverviewProps {
  repoName: string;
  baseUrl: string;
  files: ProcessedContent[];
  session: Session;
}

const formatAnalysisContent = (content: string): string => {
  try {
    // Try to parse as JSON if it starts with a curly brace
    if (content.trim().startsWith("{")) {
      const parsedContent = JSON.parse(content);
      let formattedContent = "";

      // Format each section
      Object.entries(parsedContent).forEach(([key, value]) => {
        if (typeof value === "string") {
          // Clean up the content
          const cleanedValue = value
            .replace(/\\n/g, "\n") // Replace escaped newlines
            .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
            .replace(/\*\*(.*?)\*\*/g, "$1") // Remove double asterisks
            .replace(/\n- \*\*/g, "\n- ") // Clean up list items with asterisks
            .replace(/\n\n#/g, "\n#") // Fix spacing before headers
            .replace(/\\"/g, '"') // Replace escaped quotes
            .trim();

          // Add the cleaned content
          formattedContent += cleanedValue + "\n\n";
        }
      });

      // Final cleanup
      return formattedContent
        .replace(/^\[|\]$/g, "") // Remove wrapping brackets if present
        .replace(/","/g, "\n") // Replace JSON string delimiters with newlines
        .replace(/\\n/g, "\n") // Replace any remaining escaped newlines
        .replace(/^"|"$/g, "") // Remove wrapping quotes
        .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
        .trim();
    }

    // If not JSON or parsing fails, return original content
    return content
      .replace(/^\[|\]$/g, "")
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/^"|"$/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch (e) {
    console.error("Error formatting content:", e);
    // If JSON parsing fails, try to clean the string directly
    return content
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/^"|"$/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
};

export function RepositoryOverview({
  repoName,
  baseUrl,
  files,
  session,
}: RepositoryOverviewProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState("");

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress("");

    try {
      console.log("here are the files value in  repositoryoverview", files);
      const response = await fetch(`${baseUrl}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        // Format the content before displaying
        const formattedContent = formatAnalysisContent(accumulatedContent);
        setAnalysisProgress(formattedContent);

        if (
          chunk.includes("# Generated README") ||
          chunk.includes('"# Generated README"')
        ) {
          let readmeContent = formattedContent;
          const readmeStart = readmeContent.indexOf("# Generated README");
          if (readmeStart !== -1) {
            readmeContent = readmeContent.slice(readmeStart);
          }
          setMarkdown(readmeContent);
        }
      }

      const finalContent = formatAnalysisContent(accumulatedContent);
      setMarkdown(finalContent);
      setShowEditor(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setShowEditor(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const MarkdownDisplay = ({ content }: { content: string }) => (
    <div className="prose prose-slate max-w-none dark:prose-invert px-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-2xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-xl font-medium mt-4 mb-2 text-gray-800 dark:text-gray-200"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              className="text-base leading-7 mb-4 text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc list-inside mb-4 ml-4 text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="text-base mb-2" {...props} />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code
                className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200"
                {...props}
              />
            ) : (
              <code
                className="block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-4 text-sm font-mono overflow-auto"
                {...props}
              />
            ),
          pre: ({ node, ...props }) => (
            <pre
              className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-4 overflow-auto"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  if (showEditor && markdown) {
    return (
      <div className="h-screen max-h-screen overflow-hidden">
        <MarkdownEditor
          initialValue={markdown}
          onChange={setMarkdown}
          repoName={repoName}
        />
      </div>
    );
  }

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-bold">
          Repository: {repoName}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Repository Details</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {files.length} files found in repository
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-4">
            {!isAnalyzing && !analysisProgress && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Would you like to generate a README analysis for this
                repository? This will analyze your code and create a detailed
                documentation.
              </p>
            )}

            {analysisProgress && !showEditor && (
              <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-medium">Analysis Progress</h4>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-b-lg">
                  <MarkdownDisplay content={analysisProgress} />
                </div>
              </div>
            )}

            <Button
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Repository...
                </>
              ) : (
                "Generate README Analysis"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
