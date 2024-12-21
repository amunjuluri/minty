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
    // Extract meaningful content from analysis results
    const analysisContent = analysisResults
      .map((result) => {
        // Remove headers and clean up content
        return Object.values(result)
          .map((value) =>
            (value || "")
              .replace(/^# Repository Analysis/gm, "")
              .replace(/^## Analysis of README\.md/gm, "")
              .replace(/^# Analysis of README\.md/gm, "")
              .replace(/\*\*Analysis of README\.md\*\*/g, "")
              .trim()
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
          content: `You are an expert technical documentation writer specializing in creating clear, professional README files.
        Your task is to generate a README.md that adapts to the repository's complexity and content.

        Key Requirements:
        1. Analyze the repository content first to determine:
          - Overall complexity level (minimal/standard/complex)
          - Presence of architecture/infrastructure
          - Testing frameworks
          - API documentation needs
          - Deployment requirements
          - Tech stack
          - Main features and capabilities

        2. Then generate a README that:
          - Matches the complexity level of the project
          - Includes only relevant sections
          - Uses appropriate detail level
          - Adds diagrams where beneficial (Mermaid syntax for architecture/flow)
          
        3. Content Guidelines:
          - Start with project name as a main heading
          - Use clear ## section headings
          - Include badges for build status, version, etc. if applicable
          - Add table of contents for complex projects
          - Use code blocks with language hints
          - Include screenshots/diagrams placeholder sections if relevant

        4. Structure variations:
          Minimal Project:
          - Brief description
          - Quick start
          - Basic usage
          - License

          Standard Project:
          - Overview
          - Features
          - Installation
          - Usage examples
          - API reference (if applicable)
          - Contributing
          - License

          Complex Project:
          - Detailed overview
          - Architecture diagrams
          - Comprehensive setup
          - Configuration
          - API documentation
          - Development guide
          - Testing guide
          - Deployment
          - Troubleshooting
          - Contributing guidelines
          - License

        5. Important Rules:
          - Never include analysis or repository analysis headers
          - Focus on actual documentation, not meta-analysis
          - Maintain professional formatting
          - Avoid repetition
          - Skip irrelevant sections
          - Scale detail level to project complexity
          - Use Mermaid diagrams for architecture (when applicable)
          - Return only plain markdown content
          - No meta-analysis headers
          - Clean professional formatting`,
        },
        {
          role: "user" as const,
          content: `Using this project analysis, create a professional README.md that matches the project's complexity level:

            ${analysisContent}

            - Match documentation depth to project complexity
            - Include only relevant sections
            - Use clean markdown without any wrapping syntax
            - Start with the project name
            - Add useful diagrams where appropriate`,
        },
      ],
      temperature: 0.3,
      maxTokens: 3000,
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
