"use client";

import React from "react";
import { Search } from "lucide-react";

interface AdminActionBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  action?: React.ReactElement<any, any>;
}

export default function AdminActionBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  action,
}: AdminActionBarProps) {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center w-full mb-6">
        {/* Search Input - Refined Premium Style */}
        <div className="relative flex-1 w-full group">
          <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300">
            <Search size={18} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-100 outline-none transition-all duration-300 placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
          />
        </div>

        {/* Action Button (Create) - Premium Scaling */}
        {action && (
          <div className="w-full md:w-auto flex-shrink-0 animate-in fade-in zoom-in duration-500">
            {React.cloneElement(action, {
              className: `${action.props.className ?? ""} h-14 px-10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`,
              style: { ...(action.props.style || {}), minWidth: 0 },
            })}
          </div>
        )}
      </div>

      {/* Categories / Filters - Glassmorphism Accents */}
      {children && (
        <div className="pt-6 border-t border-gray-50 mt-2">
          <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-left-4 duration-500 overflow-x-auto no-scrollbar pb-2">
            <div className="flex-shrink-0 mr-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">
                Filter System
              </span>
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
