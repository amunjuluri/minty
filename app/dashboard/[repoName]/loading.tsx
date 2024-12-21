// app/dashboard/[repoName]/loading.tsx
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-600 text-lg">Loading repository content...</p>
      </div>
    </div>
  );
}
