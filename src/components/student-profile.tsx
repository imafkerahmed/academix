"use client";

import React from "react";

interface StudentProfileProps {
  fullName: string;
  studentId: string;
  role: string;
  avatarUrl: string;
  accountStatus: string;
  advisorName: string;
  advisorEmail: string;
}

export default function StudentProfile({
  fullName,
  studentId,
  role,
  avatarUrl,
  accountStatus,
  advisorName,
  advisorEmail,
}: StudentProfileProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center">
      {/* Avatar and Role Badge */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <div className="relative">
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-28 h-28 md:w-44 md:h-44 rounded-full object-cover border-4 border-blue-400 shadow-lg"
          />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full border-4 border-white shadow-md"></div>
        </div>
        <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
          {role}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 gap-5 w-full">
        {/* Name and ID */}
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {fullName}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            ID: <span className="text-gray-700 font-semibold">{studentId}</span>
          </p>
        </div>

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
        <div className="p-3 md:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5 md:mb-3">
            <svg
              className="w-4 h-4 md:w-6 md:h-6 text-blue-600"
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
            {advisorName}
          </p>
          <a
            href={`mailto:${advisorEmail}`}
            className="inline-flex items-center gap-1 text-sm md:text-base text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
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
  );
}
