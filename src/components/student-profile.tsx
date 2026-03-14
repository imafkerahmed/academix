"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

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
  avatarUrl,
  accountStatus,
  compact = false,
  avatarSize = "default",
}: StudentProfileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-5 w-full"
    >
      {/* Header Row: Avatar and Name */}
      <div className="flex items-center gap-5">
        <div className="shrink-0 relative">
          <div className={`relative ring-8 ring-indigo-50 border-4 border-indigo-100 shadow-xl overflow-hidden ${
            avatarSize === "large"
              ? "w-32 h-32 md:w-48 md:h-48"
              : compact
                ? "w-28 h-28"
                : "w-28 h-28 md:w-40 md:h-40"
          } rounded-[2rem]`}>
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Name and ID */}
        <div className="space-y-1 min-w-0">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight break-words">
            {fullName}
          </h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            ID: <span className="text-indigo-600">{studentId}</span>
          </p>
        </div>
      </div>

      {/* Account Status */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 w-full group hover:bg-white hover:border-indigo-100 transition-all duration-300">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-indigo-600 shadow-sm transition-colors">
          <CheckCircle2 size={18} />
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Account Status:
        </span>
        <span
          className={`ml-auto px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
            accountStatus === "Active"
              ? "bg-green-100 text-green-600 border border-green-200"
              : "bg-red-100 text-red-600 border border-red-200"
          }`}
        >
          {accountStatus}
        </span>
      </div>
    </motion.div>
  );
}
