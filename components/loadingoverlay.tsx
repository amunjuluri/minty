import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
interface Repository {
  id: string;
  name: string;
  description: string;
  // Add other repository properties as needed
}

interface RepositoryCardProps {
  repo: Repository;
  index: number;
}
const RepositoryCard: React.FC<RepositoryCardProps> = ({ repo, index }) => {
  const [celebration, setCelebration] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStarClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCelebration(true);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ["#4ade80", "#22c55e", "#16a34a"],
    });
    setTimeout(() => setCelebration(false), 1000);
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(`/dashboard/${repo.name}`);
  };

  return (
    <>
      {isLoading && <LoadingOverlay />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -4 }}
        className="group"
      >
        <div onClick={handleClick}>
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
                    <Star
                      size={16}
                      className={celebration ? "text-yellow-400" : ""}
                    />
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
        </div>
      </motion.div>
    </>
  );
};

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

export default LoadingOverlay;
