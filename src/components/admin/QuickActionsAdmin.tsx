"use client";

import React from "react";
import {
  UserPlus,
  BookOpen,
  Calendar,
  FileText,
  Bell,
  TrendingUp,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

export default function QuickActionsAdmin() {
  const actions: QuickAction[] = [
    {
      id: "add-user",
      label: "Add New User",
      icon: UserPlus,
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => console.log("Add user"),
    },
    {
      id: "create-intake",
      label: "Create Intake",
      icon: Calendar,
      color: "bg-green-500 hover:bg-green-600",
      onClick: () => console.log("Create intake"),
    },
    {
      id: "add-course",
      label: "Add Course",
      icon: BookOpen,
      color: "bg-purple-500 hover:bg-purple-600",
      onClick: () => console.log("Add course"),
    },
    {
      id: "verify-payment",
      label: "Verify Payment",
      icon: TrendingUp,
      color: "bg-orange-500 hover:bg-orange-600",
      onClick: () => console.log("Verify payment"),
    },
    {
      id: "send-announcement",
      label: "Send Announcement",
      icon: Bell,
      color: "bg-pink-500 hover:bg-pink-600",
      onClick: () => console.log("Send announcement"),
    },
    {
      id: "generate-report",
      label: "Generate Report",
      icon: FileText,
      color: "bg-indigo-500 hover:bg-indigo-600",
      onClick: () => console.log("Generate report"),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`${action.color} text-white p-4 rounded-lg transition-colors flex flex-col items-center justify-center gap-2 min-h-[100px]`}
            >
              <Icon size={24} />
              <span className="text-sm font-medium text-center">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
