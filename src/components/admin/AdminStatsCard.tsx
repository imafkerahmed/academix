"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function AdminStatsCard({
  title,
  value,
  icon: Icon,
  bgColor,
  iconColor,
  trend,
}: AdminStatsCardProps) {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 hover:shadow-xl transition-all duration-500 group ring-1 ring-gray-950/[0.02]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors leading-none">
            {title}
          </p>
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase truncate leading-none mt-2">
            {value}
          </h3>
          {trend && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg mt-4 ${
                trend.isPositive
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </span>
            </div>
          )}
        </div>
        <div
          className={`${bgColor} p-4 md:p-5 rounded-[1.25rem] shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
        >
          <Icon
            className={`${iconColor} w-6 h-6 md:w-8 md:h-8`}
            strokeWidth={2.5}
          />
        </div>
      </div>
    </div>
  );
}
