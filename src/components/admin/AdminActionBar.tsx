"use client";

import React from "react";
import { Search } from "lucide-react";

interface AdminActionBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export default function AdminActionBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  action,
}: AdminActionBarProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
        {/* Search */}
        <div className="relative flex-1 w-full md:max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Action Button (Create) */}
        {action && <div>{action}</div>}
      </div>

      {/* Categories / Filters */}
      {children && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-2 items-center w-full">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
