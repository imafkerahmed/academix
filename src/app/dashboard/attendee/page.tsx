"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pb, { getCurrentUser, logout, type User } from "@/lib/pocketbase";

export default function AttendeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role !== "attendee") {
      router.push("/dashboard/host");
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
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark: border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                🎓 Zoom Class
              </h1>
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard/attendee"
                  className="text-gray-900 dark:text-white font-medium"
                >
                  My Classes
                </Link>
                <Link
                  href="/dashboard/attendee/schedule"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Schedule
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                {user.avatar && (
                  <img
                    src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}`}
                    alt={user.full_name || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.full_name || user.email}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Student
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user.full_name?.split(" ")[0] || "Student"}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and join your scheduled classes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark: bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark: border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Enrolled Classes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Upcoming Today
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Attended
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark: border-gray-700 mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Upcoming Classes
            </h3>
          </div>
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No upcoming classes
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              You haven't enrolled in any classes yet
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* View Schedule Card */}
          <Link
            href="/dashboard/attendee/schedule"
            className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-lg p-8 text-white transition-all hover:shadow-xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-3xl">
                📅
              </div>
              <h3 className="text-2xl font-bold">View Schedule</h3>
            </div>
            <p className="text-blue-100 mb-4">
              See all your upcoming classes and sessions
            </p>
            <span className="inline-flex items-center text-sm font-medium group-hover:gap-2 transition-all">
              View Calendar
              <svg
                className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </Link>

          {/* Attendance History Card */}
          <Link
            href="/dashboard/attendee/attendance"
            className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg shadow-lg p-8 text-white transition-all hover:shadow-xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-3xl">
                📖
              </div>
              <h3 className="text-2xl font-bold">Attendance History</h3>
            </div>
            <p className="text-purple-100 mb-4">
              Track your attendance and participation
            </p>
            <span className="inline-flex items-center text-sm font-medium group-hover:gap-2 transition-all">
              View History
              <svg
                className="w-4 h-4 ml-1 group-hover: translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </Link>
        </div>

        {/* User Info Card (for verification) */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark: border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <span className="text-2xl">ℹ️</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Your Account Details
              </h4>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Name:</strong> {user.full_name || "Not set"}
                </p>
                <p>
                  <strong>Role:</strong> {user.role}
                </p>
                <p>
                  <strong>Verified:</strong>{" "}
                  {user.verified ? "✅ Yes" : "⚠️ Not verified"}
                </p>
                {!user.verified && (
                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                    Check your email to verify your account
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
