// components/MarkdownEditor.tsx
'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save } from "lucide-react";
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

  const saveChanges = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/repos/${repoName}/readme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save README');
      }

      toast.success('Changes saved', {
        description: 'Your README has been updated successfully.'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setError(errorMessage);
      toast.error('Error', {
        description: 'Failed to save changes. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <Toaster position="top-right" expand={true} richColors />
      <div className="border-b p-4 flex justify-between items-center bg-card">
        <h2 className="text-xl font-semibold">Editing README.md</h2>
        <Button onClick={saveChanges} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
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