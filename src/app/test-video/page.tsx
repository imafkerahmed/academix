"use client";

import { AlertCircle } from "lucide-react";

export default function TestVideoPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-20 h-20 bg-gray-800 rounded-[2rem] flex items-center justify-center shadow-2xl ring-8 ring-gray-500/5">
              <AlertCircle size={36} className="text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 via-transparent to-gray-500/5 z-0" />

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Video Test Page Disabled
              </h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                LiveKit has been removed from this project
              </p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <p className="text-sm text-gray-300">
                This page previously tested LiveKit video functionality. The
                LiveKit integration has been completely removed from the
                project.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
