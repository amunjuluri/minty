// lib/chunking/generatereadme.ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { AnalysisResult } from '@/types/github';

// Initialize OpenAI provider
const openaiProvider = openai('gpt-4o-mini');

export async function generateReadme(
  analysisResults: AnalysisResult[]
): Promise<string> {
  try {
    // Combine all analyses
    const combinedAnalysis = {
      architecture: analysisResults.map((r) => r.architecture).join("\n"),
      dependencies: analysisResults.map((r) => r.dependencies).join("\n"),
      functionality: analysisResults.map((r) => r.functionality).join("\n"),
      codeQuality: analysisResults.map((r) => r.codeQuality).join("\n"),
      improvements: analysisResults.map((r) => r.improvements).join("\n"),
    };

    // Generate README using AI SDK
    const { text } = await generateText({
      model: openaiProvider,
      messages: [
        {
          role: 'system',
          content: 'You are a technical documentation expert. Create a professional README.md based on the provided code analysis.',
        },
        {
          role: 'user',
          content: `Based on the following comprehensive analysis, generate a detailed README.md:

Architecture Overview:
${combinedAnalysis.architecture}

Dependencies:
${combinedAnalysis.dependencies}

Key Functionality:
${combinedAnalysis.functionality}

Code Quality:
${combinedAnalysis.codeQuality}

Potential Improvements:
${combinedAnalysis.improvements}

Please create a professional README.md that includes:
1. Project overview
2. Architecture
3. Installation
4. Usage
5. Dependencies
6. Contributing guidelines
7. Future improvements`,
        },
      ],
      temperature: 0.3,
      maxTokens: 2000, // Adjust based on your needs
    });

    return text;
  } catch (error) {
    console.error('Error generating README:', error);
    return `# README Generation Error\n\nFailed to generate README: ${
      error instanceof Error ? error.message : 'Unknown error'
    }`;
  }
}