"use client";

import React, { useState, useEffect } from "react";
import AdminStatsCard from "./AdminStatsCard";
import { LucideIcon } from "lucide-react";

interface StatItem {
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

interface StatsCarouselProps {
  stats: StatItem[];
  children?: React.ReactNode;
}

export default function StatsCarousel({ stats, children }: StatsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stats.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stats.length]);

  return (
    <div className="mb-4">
      {/* Mobile/Tablet Carousel (< lg) */}
      <div className="lg:hidden">
        <div className="relative overflow-hidden rounded-[2rem] shadow-sm bg-white/50 border border-indigo-50/50">
          <div
            className="flex transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="w-full flex-shrink-0 p-1">
                <AdminStatsCard {...stat} />
              </div>
            ))}
          </div>
        </div>
        {/* Carousel Indicators - Refined Premium Dots */}
        <div className="flex justify-center gap-3 mt-6">
          {stats.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                currentIndex === index
                  ? "bg-indigo-600 w-8"
                  : "bg-indigo-100 w-3 hover:bg-indigo-200"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Large Desktop Grid (>= lg) */}
      <div className="hidden lg:grid grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <AdminStatsCard {...stat} />
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}
