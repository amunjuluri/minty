// lib/chunking/generatereadme.ts
import { groq, createGroq } from '@ai-sdk/groq';
// import { openai } from '@ai-sdk/openai'; // Uncomment for production
import { generateText } from 'ai';
import type { AnalysisResult } from '@/types/github';

// Initialize Groq provider
const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY,
  headers: {
    'x-custom-header': 'minty-docs-generator'
  }
});

// Initialize providers
// Production OpenAI provider (commented out)2
// const openaiProvider = openai('gpt-4o-mini');

// Development Groq provider
const model = groqProvider('gemma2-9b-it');

export async function generateReadme(
  analysisResults: AnalysisResult[]
): Promise<string> {
  try {
    // Combine all analyses with proper type checking
    const combinedAnalysis = analysisResults.reduce((acc, curr) => ({
      architecture: `${acc.architecture}\n${curr.architecture || ''}`,
      dependencies: `${acc.dependencies}\n${curr.dependencies || ''}`,
      functionality: `${acc.functionality}\n${curr.functionality || ''}`,
      codeQuality: `${acc.codeQuality}\n${curr.codeQuality || ''}`,
      improvements: `${acc.improvements}\n${curr.improvements || ''}`
    }), {
      architecture: '',
      dependencies: '',
      functionality: '',
      codeQuality: '',
      improvements: ''
    });

    // Generate README using AI
    const { text } = await generateText({
      // Production configuration (commented out)
      // model: openaiProvider, // Uses gpt-4o-mini model
      
      // Development configuration
      model, // Uses Groq's gemma2-9b-it model
      messages: [
        {
          role: 'system' as const,
          content: `You are a technical documentation expert specialized in creating comprehensive README.md files. 
          Focus on clarity, completeness, and professional formatting.`
        },
        {
          role: 'user' as const,
          content: `Generate a detailed README.md based on this analysis:

          Architecture Overview:
          ${combinedAnalysis.architecture.trim()}

          Dependencies:
          ${combinedAnalysis.dependencies.trim()}

          Key Functionality:
          ${combinedAnalysis.functionality.trim()}

          Code Quality Analysis:
          ${combinedAnalysis.codeQuality.trim()}

          Suggested Improvements:
          ${combinedAnalysis.improvements.trim()}

          Include these sections:
          1. Project Overview
          2. Technical Architecture
          3. Installation Guide
          4. Usage Instructions
          5. API Documentation
          6. Dependencies List
          7. Contributing Guidelines
          8. Future Roadmap
          9. License Information`
        }
      ],
      temperature: 0.3,
      maxTokens: 2000,
    });

    return text;
  } catch (error) {
    console.error('[README Generator] Error:', error);
    
    // Provide a fallback README with error details
    return `# README Generation Error

## Error Details
${error instanceof Error ? error.message : 'An unknown error occurred'}

## Manual Steps
1. Please review the analysis results manually
2. Contact the development team if this error persists
3. Check the application logs for more details

---
Generated with ❤️ by minty`;
  }
}