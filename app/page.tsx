'use client'
import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { motion, Variants } from "framer-motion";
import { Github, ArrowRight, Book, Boxes, GitBranch, LucideIcon, Sparkles } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: delay
    }
  })
};

const gradientVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 0.6, 0.5],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const sparkleVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: [0, 1, 0],
    scale: [0, 1, 0],
    y: [-20, -40, -20],
    x: [-10 + i * 10, 0 + i * 10, 10 + i * 10],
    transition: {
      duration: 2,
      delay: i * 0.3,
      repeat: Infinity,
      repeatDelay: 3
    }
  })
};

const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

const logoVariants: Variants = {
  initial: { rotate: 12, scale: 0.9 },
  animate: { 
    rotate: 0, 
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  },
  hover: { 
    rotate: 12,
    transition: { type: "spring", stiffness: 300 }
  }
};

const GradientPattern = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <motion.div 
      className="absolute inset-0 bg-[radial-gradient(circle_at_40%_-25%,#dcfce7,transparent_50%)]"
      variants={gradientVariants}
      animate="animate"
    />
    <motion.div 
      className="absolute inset-0 bg-[radial-gradient(circle_at_60%_125%,#dcfce7,transparent_50%)]"
      variants={gradientVariants}
      animate="animate"
      style={{ animationDelay: "1s" }}
    />
    <div className="absolute w-full h-full bg-[linear-gradient(to_right,white_0%,transparent_15%,transparent_85%,white_100%)]" />
  </div>
);

const SparkleEffect = () => (
  <div className="absolute -inset-4 flex items-center justify-center">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        custom={i}
        variants={sparkleVariants}
        initial="hidden"
        animate="visible"
        className="absolute"
      >
        <Sparkles className="w-4 h-4 text-green-400" />
      </motion.div>
    ))}
  </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, index }) => (
  <motion.div
    variants={fadeInVariants}
    initial="hidden"
    animate="visible"
    custom={index * 0.1}
    className="group relative bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_50px_-12px_rgba(34,197,94,0.25)]"
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <motion.div
      className="relative"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4"
      >
        <Icon className="w-6 h-6 text-green-600" />
      </motion.div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  </motion.div>
);

const Home: NextPage = () => {
  const router = useRouter();

  const handleClick = (): void => {
    router.push('/auth/signin'); // Redirect to the desired route
  };
  const features: Omit<FeatureCardProps, 'index'>[] = [
    {
      icon: Book,
      title: "Smart Documentation",
      description: "Automatically generates beautiful documentation from your markdown files with intelligent structure and organization."
    },
    {
      icon: Boxes,
      title: "Minimal Setup",
      description: "Start effortlessly—Minty handles everything for you, from fetching content to generating results. No complicated setup or configuration required."
    },
    {
      icon: GitBranch,
      title: "GitHub Integration",
      description: "Easily connects to your GitHub account, fetches repositories, analyzes content, and generates a README file that you can review and push back to your repository."
    }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <GradientPattern />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center relative">
          {/* Logo */}
          <motion.div 
            className="flex justify-center mb-10"
            variants={logoVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            <div className="w-40 h-40 relative bg-white rounded-3xl shadow-[0_0_60px_-12px_rgba(0,0,0,0.1)] p-6">
              {/* SVG content remains the same */}
              <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 200 200"
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f0fdf4"/>
                      <stop offset="100%" stopColor="#dcfce7"/>
                    </linearGradient>
                    <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4ade80"/>
                      <stop offset="100%" stopColor="#22c55e"/>
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="90" fill="url(#circleGradient)"/>
                  <path d="M100 45 C135 45, 155 65, 155 100 C155 135, 135 155, 100 155 C65 155, 45 135, 45 100 C45 65, 65 45, 100 45 Z" 
                    fill="url(#leafGradient)"/>
                  <path d="M80 85 L120 85" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
                  <path d="M75 100 L125 100" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
                  <path d="M80 115 L120 115" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
                  <path d="M100 140 L100 155" stroke="#16a34a" strokeWidth="5" strokeLinecap="round"/>
                </svg>
            </div>
          </motion.div>

          {/* Hero Content */}
          <motion.div 
            className="max-w-3xl mx-auto mb-16"
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            <motion.div 
              className="mb-4"
              variants={fadeInVariants}
              custom={0.5}
            >
              <span className="text-lg font-medium text-green-600 tracking-wide">
                Introducing
              </span>
            </motion.div>
            <div className="relative inline-block">
              <SparkleEffect />
              <h1 className="text-5xl sm:text-7xl font-bold mb-8 bg-gradient-to-r from-green-600 via-green-500 to-green-600 bg-clip-text text-transparent leading-normal px-4 pb-2">
                minty
              </h1>
            </div>
            <motion.p 
              className="text-2xl sm:text-3xl text-gray-600 font-medium mb-6"
              variants={fadeInVariants}
              custom={0.7}
            >
              fresh docs, <span className="text-green-500">minty</span> fresh
            </motion.p>

            <motion.p 
              className="text-xl text-gray-600 mb-10 leading-relaxed"
              variants={fadeInVariants}
              custom={0.9}
            >
              A modern documentation generator that makes your GitHub project shine.<br/>
              Simple, elegant, and refreshingly easy to use.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={fadeInVariants}
              custom={1.1}
            >
              <motion.button 
                onClick={handleClick}
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                type="button"
                className="group px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-300 shadow-[0_0_40px_-12px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_-12px_rgba(34,197,94,0.6)]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Github className="w-5 h-5" />
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
              <motion.button 
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                type="button"
                className="px-8 py-4 text-green-600 hover:text-green-700 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                Live Demo
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                {...feature}
                index={index}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;