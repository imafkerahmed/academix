"use client";

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

        <div className="flex flex-col gap-4 w-full">
          <Link
            href="/dashboard/admin"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-center transition-colors"
          >
            Admin Dashboard
          </Link>
          <Link
            href="/dashboard/lecturer"
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-center transition-colors"
          >
            Lecturer Dashboard
          </Link>
          <Link
            href="/dashboard/student"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium text-center transition-colors"
          >
            Student Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
