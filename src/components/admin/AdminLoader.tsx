"use client";

import React from "react";

interface AdminLoaderProps {
  message?: string;
  inline?: boolean;
}

export default function AdminLoader({ 
  message = "Loading data...",
  inline = false 
}: AdminLoaderProps) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center ${inline ? 'py-12' : 'min-h-[60vh]'} animate-in fade-in duration-500`}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className={`border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin shadow-sm ${inline ? 'w-12 h-12' : 'w-16 h-16'}`} />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-indigo-500/10 rounded-full" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-black text-gray-900 uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-600">
            {message}
          </p>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
