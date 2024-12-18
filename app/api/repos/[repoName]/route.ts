// app/api/repos/[repoName]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createGitHubService } from "@/lib/github";

interface RouteParams {
  params: Promise<{ repoName: string }>;
}

export async function GET(
  request: NextRequest,
  props: RouteParams
) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const username = request.nextUrl.searchParams.get("username");

    if (!token) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: "No username provided" },
        { status: 401 }
      );
    }

    const resolvedParams = await props.params;
    const repoName = resolvedParams.repoName;
    
    const githubService = createGitHubService(token);
    const repoFullName = `${username}/${repoName}`;
    
    const response = await githubService.getRepositoryContent(repoFullName);

    if (response.error) {
      return NextResponse.json(
        { error: response.error.message },
        { status: response.error.status || 500 }
      );
    }

    if (!response.data) {
      return NextResponse.json(
        { error: "No content found" },
        { status: 404 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error in GitHub API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository content" },
      { status: 500 }
    );
  }
}