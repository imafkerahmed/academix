"use client";

import React from "react";
import { Clock } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: string;
}

export default function RecentActivity() {
  const activities: Activity[] = [
    {
      id: "1",
      type: "enrollment",
      message: "New student enrolled in Web Development Course",
      timestamp: "2 minutes ago",
      user: "John Doe",
    },
    {
      id: "2",
      type: "payment",
      message: "Payment verified for INR 15,000",
      timestamp: "15 minutes ago",
      user: "Sarah Smith",
    },
    {
      id: "3",
      type: "assignment",
      message: "New assignment submitted for CS101",
      timestamp: "1 hour ago",
      user: "Mike Johnson",
    },
    {
      id: "4",
      type: "class",
      message: "Online class completed - Database Systems",
      timestamp: "2 hours ago",
      user: "Dr. Anderson",
    },
    {
      id: "5",
      type: "user",
      message: "New lecturer account created",
      timestamp: "3 hours ago",
      user: "Admin",
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case "enrollment":
        return "bg-green-100 text-green-800";
      case "payment":
        return "bg-blue-100 text-blue-800";
      case "assignment":
        return "bg-purple-100 text-purple-800";
      case "class":
        return "bg-orange-100 text-orange-800";
      case "user":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h2>
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
          >
            <div
              className={`${getActivityColor(
                activity.type,
              )} px-2 py-1 rounded text-xs font-medium uppercase`}
            >
              {activity.type}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Clock size={12} />
                <span>{activity.timestamp}</span>
                <span>•</span>
                <span>{activity.user}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
