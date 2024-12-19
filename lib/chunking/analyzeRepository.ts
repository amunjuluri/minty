// lib/chunking/analyzeRepository.ts
import { createFileChunks } from "./fileChunker";
import { createAnalysisChunks } from "./analysisChunker";
import { generateChunkPrompt } from "./promptGenerator";
import { generateReadme } from "./generatereadme";
import OpenAI from "openai";
import type {
  ProcessedContent,
  AnalysisResult,
  AnalysisChunk,
} from "../../types/github";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIServiceResponse {
  text?: string;
  error?: string;
}

export async function callAIService(
  prompt: string
): Promise<AIServiceResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a code analysis assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more focused analysis
      max_tokens: 1000, // Reasonable limit for analysis response
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    return { text: responseText };
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    throw new Error(
      `AI service request failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
function parseAnalysisResponse(response: AIServiceResponse): AnalysisResult {
  // Implement parsing logic based on your AI service's response format
  return {
    architecture: response.text || "Not analyzed",
    dependencies: response.text || "Not analyzed",
    functionality: response.text || "Not analyzed",
    codeQuality: response.text || "Not analyzed",
    improvements: response.text || "Not analyzed",
  };
}

async function analyzeChunk(
  chunk: AnalysisChunk,
  index: number,
  total: number
): Promise<AnalysisResult> {
  // console.log("stage 5:reached analyzeChunk");
  // console.log("chunk:", chunk);
  // console.log("index:", index);
  // console.log("total:", total);
  const prompt = generateChunkPrompt(chunk, index, total);
  const response = await callAIService(prompt);
  return parseAnalysisResponse(response);
}

export async function analyzeRepository(
  files: ProcessedContent[]
): Promise<AnalysisResult[]> {
  try {
    console.log("Starting repository analysis...");
    const fileChunks = createFileChunks(files);
    const analysisChunks = createAnalysisChunks(fileChunks);
    console.log("stage 4:reached analyzeRepository");
    const results = await Promise.all(
      analysisChunks.map((chunk, index) =>
        analyzeChunk(chunk, index, analysisChunks.length)
      )
    );
    console.log("hey first check the results", results);
    const readme = await generateReadme(results);
    console.log("Analysis complete. README generated.", readme);

    return results;
  } catch (error) {
    console.error("Repository analysis failed:", error);
    throw new Error(
      "Failed to analyze repository: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}
