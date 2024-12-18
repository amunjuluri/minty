import type { GitHubRepository, GitHubResponse, GitHubService } from '@/types/github';

export function createGitHubService(accessToken: string): GitHubService {
  return {
    listRepositories: async (): Promise<GitHubResponse<GitHubRepository[]>> => {
      try {
        const response = await fetch('https://api.github.com/user/repos', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }

        const data = await response.json() as GitHubRepository[];
        return { data, error: null };
      } catch (error) {
        return { 
          data: null,
          error: { 
            message: error instanceof Error ? error.message : 'An unknown error occurred'
          }
        };
      }
    },
  };
}