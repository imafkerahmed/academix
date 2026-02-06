"use client";

import React from "react";
import {
  UserPlus,
  BookOpen,
  Calendar,
  FileText,
  Bell,
  TrendingUp,
  Users,
  GraduationCap,
  DollarSign,
} from "lucide-react";

interface QuickLink {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

interface QuickLinksGridProps {
  links: QuickLink[];
  title: string;
}

function QuickLinksGrid({ links, title }: QuickLinksGridProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 w-full h-full flex flex-col">
      <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.id}
              onClick={link.onClick}
              className={`${link.color} text-white p-2 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 min-h-[60px]`}
            >
              <Icon size={18} />
              <span className="text-xs font-medium text-center">
                {link.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickLinksGrid;
