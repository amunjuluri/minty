// components/AnalysisDisplay.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AnalysisDisplayProps {
  repoName: string;
  baseUrl: string;
  files: any[];
}

export function AnalysisDisplay({ repoName, baseUrl, files }: AnalysisDisplayProps) {
  const [analysisText, setAnalysisText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function streamAnalysis() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${baseUrl}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files }),
        });

        if (!response.ok) {
          throw new Error('Analysis request failed');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to initialize stream reader');
        }

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          setAnalysisText((prev) => prev + text);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    streamAnalysis();
  }, [baseUrl, files]);

  return (
    <Card className="p-6 mt-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Repository Analysis</h2>
          {loading && (
            <div className="flex items-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analyzing...
            </div>
          )}
        </div>

        {error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-md">
            Error: {error}
          </div>
        ) : (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-md">
              {analysisText || 'Waiting for analysis to begin...'}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}