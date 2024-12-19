// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { analyzeRepository } from "@/lib/chunking/analyzeRepository";
import type { ProcessedContent } from "@/types/github";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files } = body;
    console.log("you are in the freaking analyze route");
    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Invalid input: files array is required" },
        { status: 400 }
      );
    }
    console.log("stage 1 :you reached analyze route");
    const results = await analyzeRepository(files as ProcessedContent[]);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Repository analysis failed:", error);
    return NextResponse.json(
      {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
