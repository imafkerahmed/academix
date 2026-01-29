import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center gap-8 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Zoom Class Scheduler
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Schedule and manage your recurring Zoom classes
          </p>
        </div>

        <div className="text-sm text-gray-500 dark: text-gray-400 text-center">
          <p>Welcome — explore the dashboard when available.</p>
        </div>
      </main>
    </div>
  );
}
