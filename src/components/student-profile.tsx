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
    <div
      className={`flex ${compact ? "flex-row gap-3" : "flex-col md:flex-row gap-6 md:gap-8"} items-center min-h-0`}
    >
      {/* Avatar and Role Badge */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <div className="relative flex flex-col items-center">
          <img
            src={avatarUrl}
            alt={fullName}
            className={`object-cover border-4 border-blue-400 shadow-lg ${
              avatarSize === "large"
                ? "w-32 h-32 md:w-48 md:h-48"
                : compact
                  ? "w-24 h-24"
                  : "w-28 h-28 md:w-44 md:h-44"
            } rounded-[1.25rem]`}
          />
          <span className="mt-3 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
            {role}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 gap-5 w-full">
        {/* Name and ID */}
        <div className="space-y-1 text-center md:text-left min-w-0">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight break-words">
            {fullName}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            ID: <span className="text-gray-700 font-semibold">{studentId}</span>
          </p>
        </div>

        {/* More Button - Mobile Only */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>More</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Collapsible Content - Hidden on mobile unless expanded, always visible on desktop */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden md:!flex md:!flex-col md:!gap-4 md:!max-h-none md:!opacity-100 ${
            isExpanded
              ? "flex flex-col gap-4 max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          {/* Account Status */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200">
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
              className={`ml-auto px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                accountStatus === "Active"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {accountStatus}
            </span>
          </div>

          {/* Academic Advisor */}
          <div className="p-2 md:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5 md:mb-3">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-blue-600"
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
              <h3 className="text-sm md:text-base font-bold text-gray-800">
                Academic Advisor
              </h3>
            </div>
            <p className="text-sm md:text-lg font-semibold text-gray-900 mb-0.5 md:mb-2">
              <span className="text-sm md:text-base">{advisorName}</span>
            </p>
            <a
              href={`mailto:${advisorEmail}`}
              className="inline-flex items-center gap-1 text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              <svg
                className="w-3 h-3 md:w-4 md:h-4"
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
