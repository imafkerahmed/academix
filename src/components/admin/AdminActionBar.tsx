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
    <div className="w-full max-w-xl">
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-center md:justify-start justify-between mb-4">
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
        {action && (
          <div className="w-full md:w-auto flex-shrink-0">
            {React.cloneElement(action, {
              className: `${action.props.className ?? ""} h-12 px-6 text-base flex items-center justify-center`,
              style: { ...(action.props.style || {}), minWidth: 0 },
            })}
          </div>
        )}
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
