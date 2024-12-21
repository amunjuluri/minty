interface RepoAnalysis {
    complexity: 'minimal' | 'standard' | 'complex';
    hasArchitecture: boolean;
    hasTests: boolean;
    hasAPI: boolean;
    hasDocs: boolean;
    hasDeployment: boolean;
    techStack: string[];
    mainFeatures: string[];
  }