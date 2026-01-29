"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pb, { getCurrentUser, logout, type User } from "@/lib/pocketbase";

export default function LectuerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/");
      return;
    }

    if (currentUser.role !== "host") {
      router.push("/dashboard/student");
      return;
    }

    setUser(currentUser);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                🎓 Zoom Class
              </h1>
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard/lectuer"
                  className="text-gray-900 dark:text-white font-medium"
                >
                  Dashboard
                </Link>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <main className="p-8">
        <h2 className="text-xl font-semibold mb-4">
          Welcome, {user.username}!
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          This is your lectuer dashboard.
        </p>
      </main>
    </div>
  );
}
