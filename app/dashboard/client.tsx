"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { GitHubRepository, GitHubError } from "@/types/github";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Filter, Menu, X, Plus, Github } from "lucide-react";
import confetti from "canvas-confetti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Types
type FilterType = "all" | "public" | "private";
type Sequence = "konami" | "mint" | "fresh";

interface RepositoryCardProps {
  repo: GitHubRepository;
  index: number;
  onNavigate: () => void;
}

interface ClientDashboardProps {
  initialRepos: GitHubRepository[] | null;
  error?: GitHubError | null;
}

interface FreshLeaf {
  id: number;
  x: number;
  y: number;
}

// Loading Overlay Component
const LoadingOverlay = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div
            className="w-16 h-16 border-4 border-emerald-200 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="text-emerald-800 font-medium">Loading repository...</p>
      </div>
    </motion.div>
  );
};

// Repository Card Component
const RepositoryCard: React.FC<RepositoryCardProps> = ({
  repo,
  index,
  onNavigate,
}) => {
  const [celebration, setCelebration] = useState<boolean>(false);
  const router = useRouter();

  const handleStarClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCelebration(true);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ["#4ade80", "#22c55e", "#16a34a"],
    });
    setTimeout(() => setCelebration(false), 1000);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate();
    router.push(`/dashboard/${repo.name}`);
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const updated = new Date(dateString);
    const diffInSeconds = Math.floor(
      (now.getTime() - updated.getTime()) / 1000
    );
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMonths > 12) {
      const years = Math.floor(diffInMonths / 12);
      return `${years}y ago`;
    }
    if (diffInMonths >= 1) return `${diffInMonths}mo ago`;
    if (diffInDays >= 1) return `${diffInDays}d ago`;
    if (diffInHours >= 1) return `${diffInHours}h ago`;
    if (diffInMinutes >= 1) return `${diffInMinutes}m ago`;
    return "just now";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group"
      onClick={handleClick}
    >
      <Card className="relative h-full overflow-hidden bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 border-0 hover:shadow-lg transition-all duration-300 cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-white/60 pointer-events-none" />
        <div className="absolute inset-px rounded-xl bg-gradient-to-br from-white/50 via-white/20 to-transparent pointer-events-none" />

        <CardHeader className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800 truncate group-hover:text-emerald-600 transition-colors">
              {repo.name}
            </CardTitle>
            <span className="text-sm px-2 py-1 rounded-full bg-white/80 text-emerald-700 border border-emerald-100 backdrop-blur-sm">
              {repo.visibility}
            </span>
          </div>
          {repo.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {repo.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="relative">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {repo.language && (
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  {repo.language}
                </div>
              )}
              <motion.button
                className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                onClick={handleStarClick}
                animate={celebration ? { scale: [1, 1.2, 1] } : undefined}
              >
                <Star
                  size={16}
                  className={celebration ? "text-yellow-400" : ""}
                />
                {repo.stargazers_count}
              </motion.button>
            </div>
            <time className="text-xs text-gray-500" dateTime={repo.updated_at}>
              {formatTimeAgo(repo.updated_at)}
            </time>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Dashboard Component
const ModernDashboard: React.FC<ClientDashboardProps> = ({
  initialRepos,
  error,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [repos] = useState<GitHubRepository[]>(initialRepos || []);
  const [isLoading, setIsLoading] = useState(false);

  const filteredRepos = repos?.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || repo.visibility === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AnimatePresence>{isLoading && <LoadingOverlay />}</AnimatePresence>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
            <Github className="h-6 w-6" />
            <h1 className="text-xl font-semibold hidden sm:block bg-gradient-to-r from-green-600 via-green-500 to-green-600 bg-clip-text text-transparent">
              minty
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden md:block">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="search"
                placeholder="Search repositories..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Filter size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  All Repositories
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("public")}>
                  Public Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("private")}>
                  Private Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 z-30`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Total Repositories
                </span>
                <span className="font-medium">{repos.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Public</span>
                <span className="font-medium">
                  {repos.filter((r) => r.visibility === "public").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Private</span>
                <span className="font-medium">
                  {repos.filter((r) => r.visibility === "private").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 ${isSidebarOpen ? "lg:pl-64" : ""} min-h-screen`}>
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error.message}</span>
              </motion.div>
            ) : !filteredRepos?.length ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">
                  {repos?.length
                    ? "No matching repositories found."
                    : "No repositories found. Create a new repository to get started!"}
                </span>
              </motion.div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRepos.map((repo, index) => (
                  <RepositoryCard
                    key={repo.id}
                    repo={repo}
                    index={index}
                    onNavigate={() => setIsLoading(true)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ModernDashboard;
