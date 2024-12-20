// app/dashboard/[repoName]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import type { ProcessedContent, ApiResponse } from "@/types/github";
import type { Session } from "next-auth";
import { RepositoryOverview } from "@/components/RepositoryOverview";

async function RepoAnalysis({ repoName }: { repoName: string }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.accessToken) {
      redirect("/auth/signin");
    }

    if (!session.user.username) {
      throw new Error("GitHub username not found in session");
    }

    // Fetch repository content
    const response = await fetch(
      `${baseUrl}/api/repos/${repoName}?username=${session.user.username}&token=${session.accessToken}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${repoName}`);
    }

    const data = (await response.json()) as ApiResponse<ProcessedContent[]>;
    // console.log("bhai data value:", data);
    if (!data) {
      throw new Error("No repository data received");
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <RepositoryOverview
          repoName={repoName}
          baseUrl={baseUrl}
          files={data}
          session={session}
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching repository:", error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error: {(error as Error).message}</p>
      </div>
    );
  }
}

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ repoName: string }>;
}) {
  const resolvedParams = await params;
  const repoName = resolvedParams.repoName;

  if (!repoName) {
    notFound();
  }

  return <RepoAnalysis repoName={repoName} />;
}
