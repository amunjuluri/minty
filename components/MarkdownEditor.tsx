import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, Download } from "lucide-react";
import { toast, Toaster } from 'sonner';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  repoName: string;
}

export function MarkdownEditor({
  initialValue,
  onChange,
  repoName,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange(newValue);
  }, [onChange]);

  const downloadReadme = useCallback(() => {
    try {
      // Create blob from content
      const blob = new Blob([content], { type: 'text/markdown' });
      // Create URL for blob
      const url = URL.createObjectURL(blob);
      // Create temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'README.md';
      // Append to document, click, and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Revoke URL to free up memory
      URL.revokeObjectURL(url);
      
      toast.success('Download started', {
        description: 'Your README.md file is being downloaded.'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      toast.error('Error', {
        description: errorMessage
      });
    }
  }, [content]);

  
  return (
    <div className="h-full flex flex-col bg-background">
      <Toaster position="top-right" expand={true} richColors />
      <div className="border-b p-4 flex justify-between items-center bg-card">
        <h2 className="text-xl font-semibold">Editing README.md</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={downloadReadme}
            className="bg-background hover:bg-secondary"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 grid grid-cols-2 gap-4 p-4 h-full overflow-hidden">
        <div className="relative h-full">
          <textarea
            value={content}
            onChange={handleChange}
            className="w-full h-full p-4 font-mono text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-background"
            placeholder="Enter your markdown here..."
          />
        </div>

        <div className="border rounded-md p-4 overflow-y-auto prose prose-sm max-w-none dark:prose-invert bg-card">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}