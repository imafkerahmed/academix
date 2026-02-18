"use client";

import LoginIllustration from "@/components/LoginIllustration";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="flex flex-col items-center gap-0 bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/60 max-w-4xl w-full overflow-hidden md:flex-row border border-gray-100">
        {/* Left: Illustration */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/2 bg-indigo-600 p-12 gap-6 min-h-[300px] md:min-h-[560px]">
          <div className="flex flex-col items-center gap-2 mb-2">
            <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-1.5">
              ACADE<span className="text-indigo-200">MIX</span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </h2>
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-8 bg-white/40 rounded-full" />
              <div className="h-0.5 w-2 bg-white/20 rounded-full" />
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-full flex justify-center"
          >
            <LoginIllustration />
          </motion.div>
          <p className="text-indigo-200 text-[11px] font-black uppercase tracking-widest text-center">
            Your Academic Management Platform
          </p>
        </div>

        {/* Right: Form */}
        <div className="flex flex-col w-full md:w-1/2 p-10 md:p-14 gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              Welcome <span className="text-indigo-600">Back</span>
            </h1>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Sign in to access your dashboard
            </p>
          </div>

          <form className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 text-gray-900 text-sm font-medium focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-300"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 text-gray-900 text-sm font-medium focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-300"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-indigo-100 hover:shadow-lg transition-all mt-2"
            >
              Sign In
            </button>
          </form>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Contact your administrator if you&apos;re having trouble accessing
            your account.
          </p>
        </div>
      </main>
    </div>
  );
}
