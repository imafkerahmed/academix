import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AttendeeDashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/api/auth/login");
  }

  const user = session.user;

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
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500 dark: text-gray-400">
                    Student
                  </span>
                </div>
              </div>
              <Link
                href="/api/auth/logout"
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg: px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user.name?.split(" ")[0]}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and join your scheduled classes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
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
                <p className="text-sm text-gray-600 dark: text-gray-400 mb-1">
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
                <p className="text-sm text-gray-600 dark: text-gray-400 mb-1">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
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
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-3xl">
                📅
              </div>
              <h3 className="text-2xl font-bold">View Schedule</h3>
            </div>
            <p className="text-blue-100 mb-4">
              See all your upcoming classes and sessions
            </p>
            <Link
              href="/dashboard/attendee/schedule"
              className="inline-flex items-center text-sm font-medium hover:gap-2 transition-all"
            >
              View Calendar
              <svg
                className="w-4 h-4 ml-1"
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
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-3xl">
                📖
              </div>
              <h3 className="text-2xl font-bold">Attendance History</h3>
            </div>
            <p className="text-purple-100 mb-4">
              Track your attendance and participation
            </p>
            <Link
              href="/dashboard/attendee/attendance"
              className="inline-flex items-center text-sm font-medium hover:gap-2 transition-all"
            >
              View History
              <svg
                className="w-4 h-4 ml-1"
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
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
