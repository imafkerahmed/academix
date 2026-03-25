"use client";

import React from "react";
import { DashboardStatsCard } from "./DashboardStatsCard";
import { LucideIcon } from "lucide-react";

interface StatsCarouselProps {
  stats: Array<{
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: string | { value: string; isPositive: boolean };
    trendUp?: boolean;
    bgColor?: string;
    iconColor?: string;
  }>;
  children?: React.ReactNode;
}

export function StatsCarousel({ stats, children }: StatsCarouselProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {stats.map((stat, index) => {
        // Handle both LucideIcon type and possible string icons from older data
        const Icon = stat.icon;
        
        return (
          <div
            key={stat.title}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {typeof Icon !== "string" ? (
              <DashboardStatsCard {...stat} icon={Icon} />
            ) : (
              <DashboardStatsCard {...stat} />
            )}
          </div>
        );
      })}
      {children}
    </div>
  );
}
