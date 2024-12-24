import { NextRequest } from "next/server";
import { analyzeRepositoryWithStreaming } from "@/lib/chunking/analyzeRepository";
import type { ProcessedContent } from "@/types/github";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files } = body;

    if (!files?.fullContent?.length) {
      return new Response(
        JSON.stringify({
          error: "Invalid input: files.fullContent array is required",
          receivedStructure: files,
        }),
        { status: 400 }
      );
    }

    // Create transform stream for proper streaming
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start analysis in background
    (async () => {
      try {
        const response = await analyzeRepositoryWithStreaming(
          files.fullContent as ProcessedContent[],
          {
            onProgress: (progress) => {
              console.log(`Analysis progress: ${progress}%`);
            },
          }
        );

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Failed to initialize stream reader");

        // Stream chunks immediately instead of accumulating
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (error) {
        console.error("Streaming error:", error);
      } finally {
        await writer.close();
      }
    })().catch(console.error);

    // Return the readable stream immediately
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });

  } catch (error) {
    console.error("Repository analysis failed:", error);
    return new Response(
      JSON.stringify({
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}