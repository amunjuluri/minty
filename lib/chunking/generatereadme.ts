// lib/chunking/generatereadme.ts
import { openai } from "@ai-sdk/openai";
import { groq, createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import type { AnalysisResult } from "@/types/github";

// // Initialize Groq provider
// const groqProvider = createGroq({
//   apiKey: process.env.GROQ_API_KEY,
//   headers: {
//     'x-custom-header': 'minty-docs-generator'
//   }
// });

const openaiProvider = openai("gpt-4o-mini");

// const model = groqProvider('gemma2-9b-it');

export async function generateReadme(
  analysisResults: AnalysisResult[]
): Promise<string> {
  try {
    console.log("in generate readme ", analysisResults);
    // Extract meaningful content from analysis results
    const analysisContent = analysisResults
      .map((result) => {
        // Remove headers and clean up content
        return Object.values(result)
          .map(
            (value) => value
            // .replace(/^# Repository Analysis/gm, "")
            // .replace(/^## Analysis of README\.md/gm, "")
            // .replace(/^# Analysis of README\.md/gm, "")
            // .replace(/\*\*Analysis of README\.md\*\*/g, "")
            // .trim()
          )
          .join("\n");
      })
      .join("\n")
      .trim();

    const { text } = await generateText({
      model: openaiProvider,
      // model,
      messages: [
        {
          role: "system" as const,
          content: `You are a technical documentation expert. Create a clean README.md file.
          Important rules:
          - Start directly with the project title
          - Do NOT include any headers containing "Analysis", "Repository Analysis", or "Analysis of README"
          - Use clear section headings starting with ##
          - Format content professionally
          - Focus on the actual project documentation
          - Return only plain markdown without any JSON wrapping
          - Do not repeat section titles
          - Do not include raw analysis data`,
        },
        {
          role: "user" as const,
          content: `Using this project analysis, create a professional README.md:

${analysisContent}

Include these sections:
- Project Overview
- Features
- Installation
- Usage
- Contributing
- License

Important:
- Start with the project name as title
- Do not include any analysis headers
- Keep it clean and professional
- Use proper markdown formatting`,
        },
      ],
      temperature: 0.3,
      maxTokens: 2000,
    });
    // console.log("here is the text before cleaning", text);

    // Cleanup the response
    // Add these cleanup patterns
    // return text;
    const cleanedText = text
      // Remove JSON formatting
      .replace(/^\s*\{|\}\s*$/g, "")
      .replace(/"architecture"\s*:\s*"|"\s*,\s*".*?"\s*:\s*".*?"/g, "")
      // Remove trailing JSON artifacts
      .replace(/"\s*,\s*".*?"\s*:\s*".*?"\s*}/g, "")
      // Remove any remaining JSON quotes and commas
      .replace(/",\s*"/g, "\n")
      .replace(/^"|"$/g, "")
      // Clean up headers
      .replace(/^# Repository Analysis/gm, "")
      .replace(/^## Analysis/gm, "")
      .replace(/\*\*Analysis.*?\*\*/g, "")
      // Format newlines
      .replace(/\\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Only add footer if we have content
    if (cleanedText) {
      return `${cleanedText}`;
    }

    throw new Error("No content generated");
  } catch (error) {
    console.error("[README Generator] Error:", error);
    return `# README

An error occurred while generating the README. Please try again.

Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
