import { callAIService } from "./analyzeRepository";
export async function generateReadme(
  analysisResults: AnalysisResult[]
): Promise<string> {
  // Combine all analyses
  const combinedAnalysis = {
    architecture: analysisResults.map((r) => r.architecture).join("\n"),
    dependencies: analysisResults.map((r) => r.dependencies).join("\n"),
    functionality: analysisResults.map((r) => r.functionality).join("\n"),
    codeQuality: analysisResults.map((r) => r.codeQuality).join("\n"),
    improvements: analysisResults.map((r) => r.improvements).join("\n"),
  };

  // Generate final README prompt
  const readmePrompt = `Based on the following comprehensive analysis, generate a detailed README.md:

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
7. Future improvements`;

  // Generate README using AI
  return await callAIService(readmePrompt);
}
