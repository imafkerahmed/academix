"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full text-center relative">
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] opacity-60" />

        <div className="mb-12 relative inline-block">
          <div className="text-[180px] font-black leading-none text-indigo-600/10 tracking-tighter animate-pulse">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-indigo-600 border border-gray-50 transform -rotate-12 animate-in zoom-in duration-700">
              <Search size={48} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
          Page <span className="text-indigo-600">Not Found</span>
        </h1>
        
        <p className="text-lg text-gray-500 font-medium leading-relaxed mb-12 max-w-md mx-auto">
          Oops! The page you're looking for seems to have vanished into thin air. 
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs tracking-widest uppercase shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 group w-full sm:w-auto"
          >
            <Home size={18} />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-3 px-10 py-5 bg-white text-gray-700 border border-gray-100 rounded-[2rem] font-black text-xs tracking-widest uppercase hover:bg-gray-50 hover:-translate-y-1 transition-all active:scale-95 w-full sm:w-auto"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
        
        <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-xl font-black text-gray-900">24/7</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Support</div>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <div className="text-xl font-black text-gray-900">Secure</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Platform</div>
          </div>
        </div>
      </div>
    </div>
  );
}
