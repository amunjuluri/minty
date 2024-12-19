// app/api/repos/[repoName]/route.ts
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

    // Create GitHub service and fetch repository content
    const githubService = createGitHubService(token);
    const repoFullName = `${username}/${repoName}`;
    console.log("aaaaaaaaaaaa", repoFullName);
    const response = await githubService.getAllRepositoryContents(repoFullName);

    if (response.error) {
      return NextResponse.json(
        { error: response.error.message },
        { status: response.error.status || 500 }
      );
    }

    if (!response.data) {
      return NextResponse.json({ error: "No content found" }, { status: 404 });
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
