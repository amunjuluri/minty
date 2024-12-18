import { NextRequest, NextResponse } from "next/server";
import { GitHubService } from "@/lib/github-service";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoName: string }> | { repoName: string } }
) {
  console.log("aaaaaaaaaaaaaaaaaaaa");

  const token = request.nextUrl.searchParams.get("token");
  const username = request.nextUrl.searchParams.get("username");

  console.log("did i get the token", token);
  console.log("did i get the username", username);

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

  const resolvedParams = await params;
  console.log("params mannnnn", resolvedParams);

  try {
    const githubService = new GitHubService(token);
    const { owner, content } = await githubService.getRepositoryContent(
      username + "/" + resolvedParams.repoName
      // Pass username to the service
    );

    return NextResponse.json({
      owner,
      content,
    });
  } catch (error) {
    console.error("Error in GitHub API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository content" },
      { status: 500 }
    );
  }
}
