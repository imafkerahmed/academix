"use client";

import React, { useState } from "react";
import Link from "next/link";
import GradientText from "@/components/ui/GradientText";
import NotificationButton from "@/components/ui/notification-button";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

interface DashboardHeaderProps {
  lecturerName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardHeader({
  lecturerName,
  activeTab,
  onTabChange,
}: DashboardHeaderProps) {
  const [showLogout, setShowLogout] = useState(false);

  const tabs = [
    "Dashboard",
    "Intakes",
    "Subjects",
    "Assignments",
    "Materials",
    "Zoom Accounts",
  ];

  const handleLogout = () => {
    // Placeholder for logout functionality
    console.log("Logout clicked");
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 md:px-12 py-4">
        {/* Left: Logo/Title */}
        <div className="flex items-center">
          <GradientText className="text-2xl font-bold ml-0 md:ml-8">
            ACADEMIX
          </GradientText>
        </div>

        {/* Right: Notification and Profile */}
        <div className="flex items-center gap-2 md:gap-4 mr-0 md:mr-8 relative">
          <NotificationButton
            onClick={() => console.log("Show notifications")}
            aria-label="Show notifications"
          />
          <button
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setShowLogout(!showLogout)}
            aria-label="User menu"
          >
            <AccountCircleIcon fontSize="large" className="text-gray-600" />
          </button>

          {/* Logout Dropdown */}
          {showLogout && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">
                  {lecturerName}
                </p>
                <p className="text-xs text-gray-500">Lecturer</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="border-t border-gray-200">
        <div className="px-4 md:px-12 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
