import Link from "next/link";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  // If user is logged in, redirect based on role
  if (session) {
    const role = session.user["https://yourapp.com/role"] || "attendee";

    if (role === "host") {
      redirect("/dashboard/host");
    } else {
      redirect("/dashboard/attendee");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center gap-8 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center">
          <div className="text-6xl mb-4">����</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Zoom Class Scheduler
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Schedule and manage your recurring Zoom classes
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <Link
            href="/api/auth/login"
            className="flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 text-white font-medium transition-colors hover:bg-blue-700"
          >
            Sign In
          </Link>

          <Link
            href="/api/auth/signup"
            className="flex h-12 items-center justify-center rounded-lg border-2 border-blue-600 px-6 text-blue-600 font-medium transition-colors hover:bg-blue-50 dark:hover:bg-gray-700"
          >
            Sign Up
          </Link>
        </div>

        <div className="text-sm text-gray-500 dark: text-gray-400 text-center space-y-1">
          <p>
            🎯 Sign in as a <strong>host</strong> to schedule classes
          </p>
          <p>
            📚 Sign in as an <strong>attendee</strong> to join classes
          </p>
        </div>
      </main>
    </div>
  );
}
