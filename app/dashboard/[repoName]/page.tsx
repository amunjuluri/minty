import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import Link from "next/link";

interface RepoContentProps {
  repoName: string;
}

async function RepoContent({ repoName }: RepoContentProps) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const session = await getServerSession(authOptions);

    const response = await fetch(
      `${baseUrl}/api/repos/${repoName}?token=${session?.accessToken}&username=${session?.user.username}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (response.status === 401) {
      redirect("/auth/signin");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${repoName}`);
    }

    const { owner, content } = await response.json();

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Repository: {owner}/{repoName}
          </h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="space-y-4">
          {content.map((item: any) => (
            <div
              key={item.path}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-gray-500">({item.type})</span>
              </div>
              <p className="text-sm text-gray-600">{item.path}</p>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching repository:", error);
    notFound();
  }
}

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ repoName: string }> | { repoName: string };
}) {
  const resolvedParams = await params;
  const val = resolvedParams.repoName;

  if (!val) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        }
      >
        <RepoContent repoName={val} />
      </Suspense>
    </div>
  );
}
