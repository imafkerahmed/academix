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
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            {value}
          </h3>
          {trend && (
            <p
              className={`text-xs md:text-sm mt-2 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`${bgColor} p-2 md:p-3 rounded-lg`}>
          <Icon className={`${iconColor} w-8 h-8 md:w-10 md:h-10`} />
        </div>
      </div>
    </div>
  );
}
