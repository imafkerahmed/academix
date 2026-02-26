"use client";

import React from "react";
import { BookOpen, TrendingUp } from "lucide-react";

export default function MaterialsPage() {
  return (
    <>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <BookOpen size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Study <span className="text-indigo-600">Materials</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-400" />
              Course Resources & Files
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-16 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-200 mx-auto mb-6">
          <BookOpen size={40} />
        </div>
        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
          Coming Soon
        </h3>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
          Materials page is under development
        </p>
      </div>
    </>
  );
}
