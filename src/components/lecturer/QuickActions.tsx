"use client";

import React from "react";
import { GraduationCap, FileEdit, FolderOpen } from "lucide-react";

interface QuickActionsProps {
  onTabChange: (tab: string) => void;
}

export default function QuickActions({ onTabChange }: QuickActionsProps) {
  const actions = [
    {
      label: "View Intakes",
      tab: "Intakes",
      icon: GraduationCap,
      iconColor: "text-blue-600",
      bgColor: "hover:bg-blue-50",
    },
    {
      label: "Mark Assignments",
      tab: "Assignments",
      icon: FileEdit,
      iconColor: "text-purple-600",
      bgColor: "hover:bg-purple-50",
    },
    {
      label: "Add Materials",
      tab: "Materials",
      icon: FolderOpen,
      iconColor: "text-green-600",
      bgColor: "hover:bg-green-50",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Quick Actions
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action, idx) => {
          const IconComponent = action.icon;
          return (
            <button
              key={idx}
              onClick={() => onTabChange(action.tab)}
              className={`border border-gray-200 bg-white ${action.bgColor} rounded-md p-3 transition-colors flex flex-col items-center justify-center gap-2`}
            >
              <IconComponent size={24} className={`${action.iconColor}`} />
              <div className="text-xs font-medium text-gray-700 text-center leading-tight">
                {action.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
