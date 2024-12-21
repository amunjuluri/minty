import { NextRequest } from "next/server";
import { analyzeRepositoryWithStreaming } from "@/lib/chunking/analyzeRepository";
import type { ProcessedContent } from "@/types/github";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files } = body;
    console.log("is there anything in fielsf", files);
    console.log("man here are your so called usefull files", files.fullContent);
    // Validate the input structure
    if (!files || !files.fullContent || !Array.isArray(files.fullContent)) {
      return new Response(
        JSON.stringify({
          error: "Invalid input: files.fullContent array is required",
          receivedStructure: files,
        }),
        { status: 400 }
      );
    }

    // Process the content through the streaming analyzer
    const response = await analyzeRepositoryWithStreaming(
      files.fullContent as ProcessedContent[],
      {
        onProgress: (progress) => {
          console.log(`Analysis progress: ${progress}%`);
        },
      }
    );

    // Convert streaming response to JSON response
    const reader = response.body?.getReader();
    let analysisText = "";

    if (!reader) {
      throw new Error("Failed to initialize stream reader");
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode and accumulate the chunk
      analysisText += new TextDecoder().decode(value);
    }

    // Return JSON response that matches the expected format
    return new Response(
      // JSON.stringify([
      //   {
      analysisText,
      // dependencies: "",
      // functionality: "",
      // codeQuality: "",
      // improvements: "",
      // },
      // ]

      {
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  } catch (error) {
    console.error("Repository analysis failed:", error);
    return new Response(
      JSON.stringify({
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500 }
    );
  }
}
