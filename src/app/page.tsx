"use client";

import Link from "next/link";
import { LayoutDashboard, BookOpen, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="flex flex-col items-center gap-10 p-10 bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/60 max-w-md w-full border border-gray-100">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <GraduationCap size={40} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center justify-center gap-1.5">
              ACADE<span className="text-indigo-600">MIX</span>
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Academic Management Platform
            </p>
          </div>
        </div>

        {/* Dashboard Links */}
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-1">
            Select Your Dashboard
          </p>
          <Link
            href="/dashboard/admin"
            className="w-full flex items-center gap-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-indigo-100 hover:shadow-lg transition-all group"
          >
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <LayoutDashboard size={18} />
            </div>
            Admin Dashboard
          </Link>
          <Link
            href="/dashboard/lecturer"
            className="w-full flex items-center gap-4 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 px-6 py-4 rounded-2xl font-black text-xs tracking-widest uppercase border border-gray-100 hover:border-indigo-100 transition-all group shadow-sm"
          >
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <BookOpen size={18} />
            </div>
            Lecturer Dashboard
          </Link>
          <Link
            href="/dashboard/student"
            className="w-full flex items-center gap-4 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 px-6 py-4 rounded-2xl font-black text-xs tracking-widest uppercase border border-gray-100 hover:border-indigo-100 transition-all group shadow-sm"
          >
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <GraduationCap size={18} />
            </div>
            Student Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
