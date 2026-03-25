"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string | { value: string; isPositive: boolean };
  trendUp?: boolean;
  bgColor?: string;
  iconColor?: string;
  className?: string;
}

export function DashboardStatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  bgColor = "bg-white",
  iconColor = "text-indigo-600",
  className,
}: DashboardStatsCardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-indigo-900/[0.04] group relative overflow-hidden",
        bgColor,
        className
      )}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              {value}
            </h3>
            {trend && (
              <span
                className={cn(
                  "text-[10px] font-black",
                  typeof trend === "string" 
                    ? (trendUp ? "text-green-500" : "text-red-500")
                    : (trend.isPositive ? "text-green-500" : "text-red-500")
                )}
              >
                {typeof trend === "string" ? trend : trend.value}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
              "bg-gray-50 shadow-inner ring-1 ring-gray-950/[0.05]",
              iconColor
            )}
          >
            <Icon size={24} strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Decorative inner gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/20 to-transparent rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150" />
    </div>
  );
}
