// lib/chunking/analyzeRepository.ts
import { groq, createGroq } from '@ai-sdk/groq';
// import { openai } from '@ai-sdk/openai'; // Uncomment for production
import { streamText } from 'ai';
import { createFileChunks } from "./fileChunker";
import { createAnalysisChunks } from "./analysisChunker";
import { generateChunkPrompt } from "./promptGenerator";
import { generateReadme } from "./generatereadme";
import type { ProcessedContent, AnalysisResult, AnalysisChunk } from "../../types/github";

// Initialize Groq provider
const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY,
  headers: {
    'x-custom-header': 'minty-analyzer'
  }
});

// Initialize providers
// Production OpenAI provider (commented out)
// const openaiProvider = openai('gpt-4o-mini');

// Development Groq provider
const model = groqProvider('gemma2-9b-it');

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
      // Production configuration (commented out)
      // model: openaiProvider,
      
      // Development configuration
      model, // Uses Groq's gemma2-9b-it model
      messages: [
        {
          role: 'system',
          content: `You are a documentation expert. Provide clear, direct descriptions of code without analysis markers or metadata.
          - Focus on features, functionality, and user-facing aspects
          - Avoid using analysis headers or technical assessment language
          - Write in clear markdown format
          - Do not wrap content in JSON
          - Do not include "Analysis" headers or markers`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    let accumulatedText = '';
    for await (const text of textStream) {
      // Clean any potential JSON or unwanted formatting
      const cleanedText = text
        .replace(/^\s*\{.*?"architecture"\s*:\s*"/g, '')
        .replace(/"\s*}\s*$/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"');

      accumulatedText += cleanedText;
      yield {
        text: cleanedText,
        accumulated: accumulatedText,
        done: false,
      };
    }
  } catch (error) {
    console.error('[Analysis Stream] Error:', error);
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
      if (analyzedFiles.has(key)) return false;
      analyzedFiles.set(key, true);
      return true;
    });
    
    const analysisChunks = createAnalysisChunks(uniqueFileChunks);
    const totalChunks = analysisChunks.length;
    const analysisResults: AnalysisResult[] = [];
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        // Process chunks silently (don't write analysis to stream)
        for (let i = 0; i < analysisChunks.length; i++) {
          const chunk = analysisChunks[i];
          onChunkStart?.(i, totalChunks);

          try {
            let chunkResult = '';
            for await (const { accumulated } of processAnalysisStream(chunk, i, totalChunks)) {
              chunkResult = accumulated;
            }

            const result: AnalysisResult = {
              architecture: chunkResult.trim()
                .replace(/^# Repository Analysis/gm, '')
                .replace(/^## Analysis/gm, '')
                .replace(/\*\*Analysis.*?\*\*/g, ''),
              dependencies: '',
              functionality: '',
              codeQuality: '',
              improvements: ''
            };
            analysisResults.push(result);
            onChunkComplete?.(i, result);

            const progress = ((i + 1) / totalChunks) * 100;
            onProgress?.(progress);

          } catch (error) {
            console.error(`Error processing chunk ${i}:`, error);
          }
        }

        // Generate README and write only that to the stream
        const readme = await generateReadme(analysisResults);
        await writer.write(encoder.encode(readme));
        await writer.close();
      } catch (error) {
        console.error('[Analysis Stream] Fatal error:', error);
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
    console.error('[Repository Analysis] Failed:', error);
    throw new Error(
      'Failed to analyze repository: ' +
      (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}