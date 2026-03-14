"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-100 p-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-50">
          <AlertTriangle size={40} />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">
          Something went <span className="text-red-600">wrong</span>
        </h1>
        
        <p className="text-gray-500 font-medium leading-relaxed mb-10">
          An unexpected error occurred. Don't worry, our team has been notified. 
          {error.digest && (
            <span className="block mt-2 text-[10px] font-mono text-gray-400">
              Error ID: {error.digest}
            </span>
          )}
        </p>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 group"
          >
            <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = "/"}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-700 border border-gray-100 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gray-50 transition-all active:scale-95"
          >
            <Home size={16} />
            Back Home
          </button>
        </div>
      </div>
    </div>
  );
}
