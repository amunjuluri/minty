import axios from "axios";

interface GitHubRepo {
  name: string;
  owner: {
    login: string;
  };
  default_branch: string;
  contents_url: string;
  description: string;
  html_url: string;
}

interface GitHubContent {
  type: string;
  name: string;
  path: string;
  content?: string;
  encoding?: string;
}

interface RepositoryContent {
  owner: string;
  content: GitHubContent[];
}

export class GitHubService {
  private baseUrl = "https://api.github.com";
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github.v3+json",
    };
  }

  async getRepositoryContent(repoFullName: string): Promise<RepositoryContent> {
    try {
      // Expect repoFullName to be in format "owner/repo"
      const [owner, repo] = repoFullName.split("/");
      console.log("owner and repo", owner, repo);
      if (!owner || !repo) {
        throw new Error('Repository name must be in format "owner/repo"');
      }
      console.log("getrepsoitorycontent", owner, repo);
      // !Directly fetch contents using owner and repo name
      // change required here

      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/contents/Car_Rental/src/App.jsx`,
        { headers: this.getHeaders() }
      );
      console.log("aaaaaaaaaaaaaaaaaaaaaaaaaa", response.data);

      const contents = response.data.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type,
      }));

      return {
        owner,
        content: contents,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Repository not found: ${repoFullName}`);
      }
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new Error(
          "GitHub API rate limit exceeded or insufficient permissions"
        );
      }
      console.error("Error fetching repository content:", error);
      throw new Error("Failed to fetch repository content");
    }
  }

  // If you still need the search functionality, keep it as a separate method
  async searchRepositories(query: string): Promise<GitHubRepo[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/search/repositories?q=${encodeURIComponent(query)}`,
        { headers: this.getHeaders() }
      );

      return response.data.items;
    } catch (error) {
      console.error("Error searching repositories:", error);
      throw new Error("Failed to search repositories");
    }
  }
}
