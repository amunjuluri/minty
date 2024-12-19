// app/dashboard/[repoName]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import type {
  ProcessedContent,
  AnalysisResult,
  ApiResponse,
} from "@/types/github";
import type { Session } from "next-auth";
// import { AnalysisDisplay } from "../../../components/AnalysisDisplay";
// import { RepoContent } from "../../../components/RepoContent";

async function analyzeRepository(
  files: ProcessedContent[]
): Promise<AnalysisResult[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files,
      }),
    });
    console.log("you reached analyzeRepository function");
    const results = await response.json();
    return results as AnalysisResult[];
  } catch (error) {
    console.error("Repository analysis failed:", error);
    throw error;
  }
}

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

    console.log("bhai reponame and token", repoName, session.accessToken);
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

    // Analyze repository
    const analysisResults = await analyzeRepository(data);

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          Repository Analysis: {repoName}
        </h1>

        {/* 
        <AnalysisDisplay results={analysisResults} />


        <RepoContent content={data} />  */}
      </div>
    );
  } catch (error) {
    console.error("Error analyzing repository:", error);
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
