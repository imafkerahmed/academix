"use client";

import React from "react";

interface QuickLink {
  title: string;
  icon: string;
  onClick: () => void;
}

interface QuickLinksProps {
  onTabChange: (tab: string) => void;
}

export default function QuickLinks({ onTabChange }: QuickLinksProps) {
  const links: QuickLink[] = [
    {
      title: "My Intakes",
      icon: "📚",
      onClick: () => onTabChange("Intakes"),
    },
    {
      title: "My Courses",
      icon: "📖",
      onClick: () => onTabChange("Intakes"),
    },
    {
      title: "My Subjects",
      icon: "📝",
      onClick: () => onTabChange("Subjects"),
    },
    {
      title: "My Assignments",
      icon: "✍️",
      onClick: () => onTabChange("Assignments"),
    },
    {
      title: "Add Study Materials",
      icon: "➕",
      onClick: () => onTabChange("Materials"),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Links</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {links.map((link, index) => (
          <button
            key={index}
            onClick={link.onClick}
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            aria-label={link.title}
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              {link.icon}
            </span>
            <span className="text-sm font-medium text-gray-700 text-center">
              {link.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
