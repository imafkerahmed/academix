"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pb, { getCurrentUser, logout, type User } from "@/lib/pocketbase";

export default function HostDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role !== "host") {
      router.push("/dashboard/attendee");
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
      <div className="flex min-h-screen items-center justify-center">
        Loading...
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
                  href="/dashboard/host"
                  className="text-gray-900 dark:text-white font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/host/schedule"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Schedule Class
                </Link>
                <Link
                  href="/dashboard/host/classes"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover: text-white"
                >
                  My Classes
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.full_name || user.email}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Host
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Rest of your dashboard UI...  */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.full_name?.split(" ")[0] || "Host"}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your Zoom classes and track attendance
          </p>
        </div>

        {/* ...  rest of your content ... */}
      </main>
    </div>
  );
}
