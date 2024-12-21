import { groq, createGroq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createFileChunks } from "./fileChunker";
import { createAnalysisChunks } from "./analysisChunker";
import { generateChunkPrompt } from "./promptGenerator";
import { generateReadme } from "./generatereadme";
import type {
  ProcessedContent,
  AnalysisResult,
  AnalysisChunk,
  FileChunk,
  ExtendedAnalysisResult,
  EnhancedAnalysisChunk,
  StreamResult,
  AnalysisMessage,
  StreamOptions,
} from "../../types/github";

const AI_CONFIG = {
  groq: createGroq({
    apiKey: process.env.GROQ_API_KEY,
    headers: { "x-custom-header": "minty-analyzer" },
  }),
  openai: openai("gpt-4o-mini"),
  systemPrompt: `You are a documentation expert. Provide clear, direct descriptions of code without analysis markers or metadata.
    - Focus on features, functionality, and user-facing aspects
    - Avoid using analysis headers or technical assessment language
    - Write in clear markdown format
    - Do not wrap content in JSON
    - Do not include "Analysis" headers or markers`,
};

async function* processAnalysisStream(
  chunk: EnhancedAnalysisChunk,
  index: number,
  total: number
): AsyncGenerator<StreamResult> {
  const prompt = generateChunkPrompt(chunk, index, total);

  try {
    const messages: AnalysisMessage[] = [
      { role: "system", content: AI_CONFIG.systemPrompt },
      { role: "user", content: prompt },
    ];

    const { textStream } = await streamText({
      model: AI_CONFIG.openai,
      messages,
      temperature: 0.2,
    });

    let accumulatedText = "";
    for await (const text of textStream) {
      const cleanedText = text
        .replace(/^\s*\{.*?"architecture"\s*:\s*"/g, "")
        .replace(/"\s*}\s*$/g, "")
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"');

      accumulatedText += cleanedText;
      yield {
        text: cleanedText,
        accumulated: accumulatedText,
        done: false,
      };
    }
  } catch (error) {
    console.error("[Analysis Stream] Error:", error);
    throw error;
  }
}

async function prepareAnalysisChunks(
  files: ProcessedContent[]
): Promise<EnhancedAnalysisChunk[]> {
  const analyzedFiles = new Map<string, boolean>();
  const fileChunks = createFileChunks(files);

  const uniqueFileChunks = fileChunks.filter((chunk) => {
    const key = chunk.path;
    if (analyzedFiles.has(key)) return false;
    analyzedFiles.set(key, true);
    return true;
  });

  const analysisChunks = createAnalysisChunks(uniqueFileChunks);
  return analysisChunks.map((chunk, index) => ({
    ...chunk,
    totalSize: chunk.files.reduce((sum, file) => sum + (file.size || 0), 0),
    maxTokens: chunk.maxTokens || 3000,
    files: chunk.files as ProcessedContent[],
    context: {
      totalFiles: files.length,
      chunkIndex: index,
      totalChunks: analysisChunks.length,
    },
  }));
}

export async function analyzeRepositoryWithStreaming(
  files: ProcessedContent[],
  options: StreamOptions = {}
): Promise<Response> {
  const { onChunkStart, onChunkComplete, onProgress } = options;
  // console.log("analyze repository fiels value", files);
  try {
    const analysisChunks = await prepareAnalysisChunks(files);
    const totalChunks = analysisChunks.length;
    const analysisResults: ExtendedAnalysisResult[] = [];

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        for (let i = 0; i < analysisChunks.length; i++) {
          const chunk = analysisChunks[i];
          onChunkStart?.(i, totalChunks);

          try {
            let chunkResult = "";
            for await (const { accumulated } of processAnalysisStream(
              chunk,
              i,
              totalChunks
            )) {
              chunkResult = accumulated;
            }

            const result: ExtendedAnalysisResult = {
              // Properties from ExtendedAnalysisResult
              architecture: chunkResult
                .trim()
                .replace(/^# Repository Analysis/gm, "")
                .replace(/^## Analysis/gm, "")
                .replace(/\*\*Analysis.*?\*\*/g, ""),
              dependencies: "",
              functionality: "",
              codeQuality: "",
              improvements: "",

              // Required properties from AnalysisResult
              fileName: chunk.files[0]?.path || "unknown", // Add appropriate filename
              suggestions: [], // Add appropriate suggestions array
              metrics: {
                complexity: 0, // Add appropriate metric values
                maintainability: 0,
              },
            };
            analysisResults.push(result);
            onChunkComplete?.(i, result as AnalysisResult);
            onProgress?.(((i + 1) / totalChunks) * 100);
          } catch (error) {
            console.error(`Error processing chunk ${i}:`, error);
          }
        }

        const readme = await generateReadme(analysisResults);
        await writer.write(encoder.encode(readme));
        await writer.close();
      } catch (error) {
        console.error("[Analysis Stream] Fatal error:", error);
        await writer.abort(
          error instanceof Error ? error : new Error("Unknown error occurred")
        );
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Repository Analysis] Failed:", error);
    throw new Error(
      "Failed to analyze repository: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}
