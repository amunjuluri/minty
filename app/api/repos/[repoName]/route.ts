import { NextRequest, NextResponse } from "next/server";
import { createGitHubService } from "@/lib/github";

interface RouteParams {
  params: Promise<{ repoName: string }>;
}

export async function GET(request: NextRequest, props: RouteParams) {
  try {
    // Get token and username from query parameters
    const token = request.nextUrl.searchParams.get("token");
    const username = request.nextUrl.searchParams.get("username");

    // Validate required parameters
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

    // Get repoName from route parameter
    const resolvedParams = await props.params;
    const repoName = resolvedParams.repoName;
    const repoFullName = `${username}/${repoName}`;

    // Create GitHub service
    const githubService = createGitHubService(token);

    // First, check if the repository exists and is accessible
    const repoCheck = await githubService.getRepositoryContent(repoFullName);
    if (repoCheck.error) {
      return NextResponse.json(
        { error: repoCheck.error.message },
        { status: repoCheck.error.status || 404 }
      );
    }

    // Get all repository contents
    const contentsResult = await githubService.getAllRepositoryContents(
      repoFullName
    );

    if (contentsResult.error) {
      return NextResponse.json(
        { error: contentsResult.error.message },
        { status: contentsResult.error.status || 500 }
      );
    }

    return NextResponse.json({
      initialContent: repoCheck.data,
      fullContent: contentsResult.data,
    });
  } catch (error) {
    console.error("Error in GitHub API route:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch repository content",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
