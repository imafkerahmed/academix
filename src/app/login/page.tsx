"use client";

import LoginIllustration from "@/components/LoginIllustration";
import Link from "next/link";
import GradientText from "@/components/ui/GradientText";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col md:flex-row items-center gap-8 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full">
        <div className="flex flex-col items-center md:items-start md:w-1/2 gap-4 w-full">
          <div className="flex flex-col items-center w-full">
            <GradientText className="text-4xl font-extrabold mb-2">ACADEMIX</GradientText>
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-full flex justify-center"
            >
              <LoginIllustration />
            </motion.div>
          </div>
        </div>
        <div className="flex flex-col md:w-1/2 items-center md:items-start w-full">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Sign in to your account to access your classes.
          </p>
          <form className="flex flex-col gap-4 w-full">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:text-white"
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:text-white"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-center transition-colors"
            >
              Sign In
            </button>
          </form>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
