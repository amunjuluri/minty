// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { createGitHubService } from "@/lib/github";
import type { GitHubRepository } from "@/types/github";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { Suspense } from "react";

function RepositoryCard({ repo }: { repo: GitHubRepository }) {
  return (
    <Link href={`/dashboard/${repo.name}`} className="block">
      <div className="p-4 border rounded-lg hover:border-green-500 hover:shadow-md transition-all cursor-pointer bg-white">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg truncate">{repo.name}</h2>
          <span className="text-sm text-gray-500 ml-2 flex-shrink-0">
            {repo.visibility}
          </span>
        </div>
        {repo.description && (
          <p className="mt-2 text-gray-600 text-sm line-clamp-2">
            {repo.description}
          </p>
        )}
        <div className="mt-4 flex gap-4">
          {repo.language && (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              {repo.language}
            </span>
          )}
          <span className="text-sm text-gray-500 flex items-center gap-1">
            ★ {repo.stargazers_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

function LoadingRepositories() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="p-4 border rounded-lg bg-gray-50 animate-pulse h-32"
        />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect("/auth/signin");
  }

  const github = createGitHubService(session.accessToken);
  const { data: repos, error } = await github.listUserRepositories();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Your Repositories</h1>
          <LogoutButton />
        </div>

        <Suspense fallback={<LoadingRepositories />}>
          {error ? (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
              role="alert"
            >
              {error.message}
            </div>
          ) : !repos?.length ? (
            <div
              className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded"
              role="alert"
            >
              No repositories found. Create a new repository to get started!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {repos.map((repo) => (
                <RepositoryCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}