'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GitHubRepository, GitHubError } from "@/types/github";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

// Types
type FilterType = 'all' | 'public' | 'private';
type Sequence = 'konami' | 'mint' | 'fresh';

interface RepositoryCardProps {
  repo: GitHubRepository;
  index: number;
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

// Helper Components
const EnhancedMatrixEffect = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const mintChars = '🌿☘️MINTY'.split('');

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 pointer-events-none overflow-hidden bg-black/30 backdrop-blur-sm z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-emerald-400 font-mono text-3xl font-bold"
            initial={{ 
              opacity: 0,
              y: -50,
              x: Math.random() * dimensions.width,
              rotate: 0,
              scale: 0
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              y: dimensions.height + 50,
              rotate: 360,
              scale: [0, 1, 1, 0],
              transition: {
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "linear"
              }
            }}
            style={{
              textShadow: '0 0 10px #4ade80, 0 0 20px #4ade80, 0 0 30px #4ade80'
            }}
          >
            {mintChars[Math.floor(Math.random() * mintChars.length)]}
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-emerald-900/20 to-emerald-900/40 mix-blend-overlay" />
      </motion.div>
    </AnimatePresence>
  );
};

const MintRainEffect = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 pointer-events-none overflow-hidden z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ 
              x: Math.random() * dimensions.width,
              y: -50,
              rotate: 0,
              scale: 0
            }}
            animate={{ 
              y: dimensions.height + 50,
              rotate: 720,
              scale: [0, 1, 1, 0],
              transition: {
                duration: 2,
                ease: "easeInOut",
                times: [0, 0.2, 0.8, 1],
                repeat: Infinity,
                delay: i * 0.1
              }
            }}
          >
            <svg className="w-8 h-8 text-emerald-400 drop-shadow-lg" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L17 8v8l-5 3-5-3V8l5-3.5z"
              />
            </svg>
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/10 to-emerald-100/20 mix-blend-overlay" />
      </motion.div>
    </AnimatePresence>
  );
};

const RepositoryCard: React.FC<RepositoryCardProps> = ({ repo, index }) => {
  const [celebration, setCelebration] = useState<boolean>(false);

  const handleStarClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCelebration(true);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#4ade80', '#22c55e', '#16a34a']
    });
    setTimeout(() => setCelebration(false), 1000);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link href={`/dashboard/${repo.name}`}>
        <Card className="relative h-full overflow-hidden bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 border-0 hover:shadow-lg transition-all duration-300">
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
                  <Star size={16} className={celebration ? "text-yellow-400" : ""} />
                  {repo.stargazers_count}
                </motion.button>
              </div>
              <time 
                className="text-xs text-gray-500"
                dateTime={repo.updated_at}
              >
                {formatTimeAgo(repo.updated_at)}
              </time>
            </div>
          </CardContent>

          <div className="absolute inset-0 rounded-xl shadow-inner pointer-events-none" />
        </Card>
      </Link>
    </motion.div>
  );
};

// Utility functions
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const updated = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInMonths > 12) {
    const years = Math.floor(diffInMonths / 12);
    return `Updated ${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
  if (diffInMonths >= 1) {
    return `Updated ${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  if (diffInDays >= 1) {
    return `Updated ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  if (diffInHours >= 1) {
    return `Updated ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffInMinutes >= 1) {
    return `Updated ${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  return 'Updated just now';
};

const ClientDashboard: React.FC<ClientDashboardProps> = ({ initialRepos, error }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [repos] = useState<GitHubRepository[]>(initialRepos || []);
  const [matrixMode, setMatrixMode] = useState(false);
  const [mintRain, setMintRain] = useState(false);
  const [freshLeaves, setFreshLeaves] = useState<FreshLeaf[]>([]);
  
  const sequences = useRef({
    konami: '',
    mint: '',
    fresh: ''
  });

  const triggerConfetti = useCallback((colors: string[] = ['#4ade80', '#22c55e', '#16a34a']) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors
    });
  }, []);

  const handleSequence = useCallback((type: Sequence) => {
    switch (type) {
      case 'konami':
        setMatrixMode(true);
        triggerConfetti();
        setTimeout(() => setMatrixMode(false), 5000);
        break;
      case 'mint':
        setMintRain(true);
        triggerConfetti(['#4ade80', '#22c55e', '#16a34a']);
        setTimeout(() => setMintRain(false), 4000);
        break;
      case 'fresh':
        setFreshLeaves(prev => [
          ...prev,
          {
            id: Date.now(),
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
          }
        ]);
        setTimeout(() => setFreshLeaves([]), 1000);
        break;
    }
  }, [triggerConfetti]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Update sequences
      sequences.current.konami += e.key;
      sequences.current.mint += e.key.toLowerCase();
      sequences.current.fresh += e.key.toLowerCase();

      // Trim sequences
      if (sequences.current.konami.length > 10) {
        sequences.current.konami = sequences.current.konami.slice(1);
      }
      if (sequences.current.mint.length > 4) {
        sequences.current.mint = sequences.current.mint.slice(1);
      }
      if (sequences.current.fresh.length > 5) {
        sequences.current.fresh = sequences.current.fresh.slice(1);
      }

      // Check sequences
      if (sequences.current.konami.includes('ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba')) {
        handleSequence('konami');
        sequences.current.konami = '';
      }
      if (sequences.current.mint === 'mint') {
        handleSequence('mint');
        sequences.current.mint = '';
      }
      if (sequences.current.fresh === 'fresh') {
        handleSequence('fresh');
        sequences.current.fresh = '';
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleSequence]);

  const filteredRepos = repos?.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || repo.visibility === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {matrixMode && <EnhancedMatrixEffect />}
      {mintRain && <MintRainEffect />}
      <AnimatePresence>
        {freshLeaves.map(leaf => (
          <motion.div
            key={leaf.id}
            initial={{ opacity: 1, x: leaf.x, y: leaf.y, scale: 0 }}
            animate={{ 
                opacity: 0,
                y: leaf.y - 100,
                rotate: 360,
                scale: 1,
                transition: { duration: 1, ease: "easeOut" }
              }}
              className="fixed text-6xl z-50 pointer-events-none"
          >
            🌿
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <motion.h1 
              className="text-3xl font-bold text-gray-900"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Your Repositories
            </motion.h1>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  size={18} 
                />
                <Input
                  type="search"
                  placeholder="Search repositories..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Filter size={20} />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilter("all")}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("public")}>
                    Public
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("private")}>
                    Private
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <LogoutButton />
            </div>
          </div>
        </header>

        <main>
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
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;