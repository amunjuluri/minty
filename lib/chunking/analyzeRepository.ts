// lib/chunking/analyzeRepository.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createFileChunks } from "./fileChunker";
import { createAnalysisChunks } from "./analysisChunker";
import { generateChunkPrompt } from "./promptGenerator";
import { generateReadme } from "./generatereadme";
import type { ProcessedContent, AnalysisResult, AnalysisChunk } from "../../types/github";

// Initialize OpenAI provider
const openaiProvider = openai('gpt-4o-mini');

interface StreamAnalysisOptions {
  onChunkStart?: (chunkIndex: number, totalChunks: number) => void;
  onChunkComplete?: (chunkIndex: number, result: AnalysisResult) => void;
  onProgress?: (progress: number) => void;
}

async function* processAnalysisStream(
  chunk: AnalysisChunk,
  index: number,
  total: number
) {
  const prompt = generateChunkPrompt(chunk, index, total);

  try {
    const { textStream } = await streamText({
      model: openaiProvider,
      messages: [
        {
          role: 'system',
          content: 'You are a code analysis assistant specialized in providing detailed, structured feedback.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    let accumulatedText = '';

    for await (const text of textStream) {
      accumulatedText += text;
      yield {
        text,
        accumulated: accumulatedText,
        done: false,
      };
    }
  } catch (error) {
    console.error('Streaming analysis failed:', error);
    throw error;
  }
}

export async function analyzeRepositoryWithStreaming(
  files: ProcessedContent[],
  options: StreamAnalysisOptions = {}
) {
  const { onChunkStart, onChunkComplete, onProgress } = options;

  try {
    // Create a Map to track analyzed files and prevent duplicates
    const analyzedFiles = new Map<string, boolean>();
    
    const fileChunks = createFileChunks(files);
    // Filter out duplicate files before creating analysis chunks
    const uniqueFileChunks = fileChunks.filter(chunk => {
      const key = chunk.path;
      if (analyzedFiles.has(key)) {
        return false;
      }
      analyzedFiles.set(key, true);
      return true;
    });
    
    const analysisChunks = createAnalysisChunks(uniqueFileChunks);
    const totalChunks = analysisChunks.length;

    // Store analysis results for README generation
    const analysisResults: AnalysisResult[] = [];
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process chunks and collect results
    (async () => {
      try {
        // Header for the analysis
        await writer.write(encoder.encode('# Repository Analysis\n\n'));

        // Process each chunk
        for (let i = 0; i < analysisChunks.length; i++) {
          const chunk = analysisChunks[i];
          onChunkStart?.(i, totalChunks);

          // Add chunk information to the stream
          await writer.write(
            encoder.encode(`\n## Analyzing Files (Chunk ${i + 1}/${totalChunks})\n`)
          );
          
          // List files being analyzed in this chunk
          const filesList = chunk.files
            .map(f => `- ${f.path}`)
            .join('\n');
          await writer.write(encoder.encode(`\nAnalyzing:\n${filesList}\n\n`));

          try {
            let chunkResult = '';
            for await (const { text, accumulated } of processAnalysisStream(chunk, i, totalChunks)) {
              await writer.write(encoder.encode(text));
              chunkResult = accumulated;
            }

            // Store chunk result for README
            const result: AnalysisResult = {
              architecture: chunkResult,
              dependencies: '',
              functionality: '',
              codeQuality: '',
              improvements: '',
            };
            analysisResults.push(result);
            onChunkComplete?.(i, result);

            const progress = ((i + 1) / totalChunks) * 100;
            onProgress?.(progress);

          } catch (error) {
            console.error(`Error processing chunk ${i}:`, error);
            await writer.write(
              encoder.encode(`\nError analyzing chunk ${i + 1}/${totalChunks}: ${error.message}\n`)
            );
          }
        }

        // Generate and append README
        await writer.write(encoder.encode('\n\n# Generated README\n\n'));
        const readme = await generateReadme(analysisResults);
        await writer.write(encoder.encode(readme));

        await writer.close();
      } catch (error) {
        console.error('Fatal error in analysis stream:', error);
        await writer.abort(error);
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Repository analysis failed:', error);
    throw new Error(
      'Failed to analyze repository: ' +
      (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}