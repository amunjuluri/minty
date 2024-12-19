// app/dashboard/page.tsx

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { createGitHubService } from "@/lib/github";
import ClientDashboard from "./client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect("/auth/signin");
  }

  const github = createGitHubService(session.accessToken);
  const { data: initialRepos, error } = await github.listUserRepositories();

  return (
    <ClientDashboard 
      initialRepos={initialRepos}
      error={error}
    />
  );
}