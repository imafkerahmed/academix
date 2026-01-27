"use client";

import React, { useState, useRef } from "react";
import GradientText from "@/components/ui/GradientText";
import NotificationButton from "@/components/ui/notification-button";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function StudentDashboard() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation durations (ms)
  const OPEN_DURATION = 900;
  const CLOSE_DURATION = 1500;

  // Handle animation mount/unmount
  React.useEffect(() => {
    if (showNotifications) {
      setDrawerVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else if (drawerVisible) {
      timeoutRef.current = setTimeout(
        () => setDrawerVisible(false),
        CLOSE_DURATION,
      );
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showNotifications, drawerVisible]);

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  return (
    <div>
      {/* Header */}
      <header className="flex items-center justify-between px-12 py-4 bg-white shadow mb-6 rounded-lg">
        {/* Left: Title with SplitText */}
        <div className="flex items-center">
          <GradientText className="text-2xl font-bold ml-8">ACADEMIX</GradientText>
        </div>
        {/* Right: Notification Button and Profile Icon */}
        <div className="flex items-center gap-4 mr-8 relative">
          <NotificationButton
            onClick={() => setShowNotifications(true)}
            aria-label="Show notifications"
          />
          <button
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setShowLogout((prev) => !prev)}
            aria-label="Account menu"
          >
            <AccountCircleIcon style={{ fontSize: 32, color: "black" }} />
          </button>
          {showLogout && (
            <div className="absolute right-0 top-14 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50 animate-dropdown">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setShowLogout(false);
                  // Add your view profile logic here
                }}
              >
                View Profile
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                onClick={() => {
                  setShowLogout(false);
                  // Add your logout logic here
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      {/* Notification Drawer */}
      {drawerVisible && (
        <div
          className={`
            fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-lg z-50 flex flex-col border-l border-gray-200
            transition-transform transition-opacity
            ${
              showNotifications
                ? `duration-[${OPEN_DURATION}ms] translate-x-0 opacity-100`
                : `duration-[${CLOSE_DURATION}ms] translate-x-full opacity-0 pointer-events-none`
            }
          `}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="font-semibold text-lg">Notifications</span>
            <button
              className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={handleCloseNotifications}
              aria-label="Close notifications"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Placeholder for notifications */}
            <div className="text-gray-500 text-center mt-8">
              No notifications yet.
            </div>
          </div>
        </div>
      )}
      {/* Main Grid Layout */}

      <div className="grid grid-cols-5 grid-rows-5 gap-4">
        <div className="col-span-2 row-span-2">1</div>
        <div className="col-span-3 row-span-2 col-start-3">2</div>
        <div className="col-span-2 row-span-3 row-start-3">3</div>
        <div className="col-span-3 row-span-3 col-start-3 row-start-3">4</div>
      </div>
    </div>
  );
}
