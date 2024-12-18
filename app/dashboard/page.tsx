import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { createGitHubService } from "@/lib/github";
import type { GitHubRepository } from "@/types/github";
import LogoutButton from "@/components/LogoutButton";

import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  console.log("loginsessions", session);
  if (!session?.accessToken) {
    redirect("/auth/signin");
  }

  const github = createGitHubService(session.accessToken);
  const { data: repos, error } = await github.listRepositories();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Repositories</h1>
        <LogoutButton />
      </div>

      {error ? (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
          role="alert"
        >
          {error.message}
        </div>
      ) : !repos ? (
        <div
          className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded"
          role="alert"
        >
          No repositories found
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo: GitHubRepository) => (
            <Link
              key={repo.id}
              href={`/dashboard/${repo.name}`}
              className="block"
            >
              <div className="p-4 border rounded-lg hover:border-green-500 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">{repo.name}</h2>
                  <span className="text-sm text-gray-500">
                    {repo.visibility}
                  </span>
                </div>
                {repo.description && (
                  <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                    {repo.description}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <span className="text-sm text-gray-500">
                    {repo.language || "No language detected"}
                  </span>
                  <span className="text-sm text-gray-500">
                    ★ {repo.stargazers_count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
