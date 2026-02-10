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
  children?: React.ReactNode; // For extra grid items like DateTimeStatCard
}

export default function StatsCarousel({ stats, children }: StatsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [stats.length]);

  return (
    <div className="mb-4">
      {/* Mobile Carousel (< md) */}
      <div className="md:hidden px-4">
        <div className="relative overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <AdminStatsCard {...stat} />
              </div>
            ))}
          </div>
        </div>
        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 mt-2">
          {stats.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                currentIndex === index ? "bg-blue-600 w-4" : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* iPad/Desktop Grid (>= md) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <AdminStatsCard key={index} {...stat} />
        ))}
        {children}
      </div>
    </div>
  );
}
