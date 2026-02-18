"use client";

import React, { useState } from "react";

interface StudentProfileProps {
  fullName: string;
  studentId: string;
  role: string;
  avatarUrl: string;
  accountStatus: string;
  advisorName: string;
  advisorEmail: string;
  compact?: boolean;
  avatarSize?: "default" | "large";
}

export default function StudentProfile({
  fullName,
  studentId,
  role,
  avatarUrl,
  accountStatus,
  advisorName,
  advisorEmail,
  compact = false,
  avatarSize = "default",
}: StudentProfileProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Row: Avatar and Name */}
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="shrink-0">
          <img
            src={avatarUrl}
            alt={fullName}
            className={`object-cover border-4 border-blue-400 shadow-lg ${
              avatarSize === "large"
                ? "w-32 h-32 md:w-48 md:h-48"
                : compact
                  ? "w-28 h-28"
                  : "w-28 h-28 md:w-44 md:h-44"
            } rounded-[1.25rem]`}
          />
        </div>

        {/* Name and ID */}
        <div className="space-y-1 min-w-0">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight break-words">
            {fullName}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            ID: <span className="text-gray-700 font-semibold">{studentId}</span>
          </p>
        </div>
      </div>

      {/* Account Status */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 w-full shadow-sm">
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-semibold text-gray-700">
          Account Status:
        </span>
        <span
          className={`ml-auto px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
            accountStatus === "Active"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {accountStatus}
        </span>
      </div>

      {/* Academic Advisor */}
      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 overflow-hidden">
          {/* Left: Title */}
          <div className="flex items-center gap-2 shrink-0">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h3 className="text-xs md:text-sm font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
              Academic Advisor
            </h3>
          </div>

          {/* Right: Name & Email */}
          <div className="flex flex-wrap items-center md:justify-end gap-x-4 gap-y-1 min-w-0">
            <p className="text-sm md:text-base font-bold text-gray-900 truncate">
              {advisorName}
            </p>
            <a
              href={`mailto:${advisorEmail}`}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors whitespace-nowrap"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {advisorEmail}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
