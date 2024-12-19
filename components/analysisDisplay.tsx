import { FC } from "react";
import { AnalysisResult } from "@/types/github";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalysisDisplayProps {
  results: AnalysisResult[];
}

export const AnalysisDisplay: FC<AnalysisDisplayProps> = ({ results }) => {
  if (!results.length) {
    return (
      <Alert>
        <AlertTitle>No Analysis Results</AlertTitle>
        <AlertDescription>
          No analysis results are available for this repository.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Analysis Results</h2>
      {results.map((result, index) => (
        <Card key={`${result.fileName}-${index}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{result.fileName}</span>
              <Badge
                variant={
                  result.metrics.maintainability > 80
                    ? "success"
                    : result.metrics.maintainability > 60
                    ? "warning"
                    : "destructive"
                }
              >
                Maintainability: {result.metrics.maintainability}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.suggestions.map((suggestion, sIndex) => (
                <Alert
                  key={sIndex}
                  variant={
                    suggestion.type === "error"
                      ? "destructive"
                      : suggestion.type === "warning"
                      ? "warning"
                      : "default"
                  }
                >
                  <AlertTitle className="capitalize">
                    {suggestion.type}
                  </AlertTitle>
                  <AlertDescription>
                    {suggestion.message}
                    {suggestion.line && (
                      <span className="block text-sm mt-1">
                        Line: {suggestion.line}
                      </span>
                    )}
                    {suggestion.code && (
                      <pre className="mt-2 p-2 bg-slate-100 rounded-md">
                        <code>{suggestion.code}</code>
                      </pre>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
