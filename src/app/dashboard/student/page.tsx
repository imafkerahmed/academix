"use client";

import React, { useState, useRef } from "react";
import GradientText from "@/components/ui/GradientText";
import NotificationButton from "@/components/ui/notification-button";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CourseList from "@/components/CourseList";
// Mock data for enrolled courses
const courses = [
  {
    id: "1",
    name: "Mathematics 101",
    description: "Intro to Algebra and Calculus",
  },
  { id: "2", name: "Physics 201", description: "Mechanics and Thermodynamics" },
  { id: "3", name: "History 101", description: "World History Overview" },
  { id: "4", name: "Computer Science 101", description: "Programming Basics" },
];

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
          <GradientText className="text-2xl font-bold ml-8">
            ACADEMIX
          </GradientText>
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

      <div className="grid gap-4 p-4 sm:p-6 md:p-8 grid-cols-1 grid-rows-none md:grid-cols-4 md:grid-rows-3">
        {/* Section 1 (student profile removed) */}
        <div className="border border-gray-300 shadow-lg rounded-xl min-w-0 w-full h-full p-6 flex items-center justify-center col-span-1 md:col-span-2 md:col-start-1 md:row-start-1">
          <div className="text-center text-gray-500">
            Student profile removed. Will be redesigned later.
          </div>
        </div>
        {/* Section 2: Enrolled Courses */}
        <div className="border border-gray-300 shadow-lg rounded-xl min-w-0 w-full h-full p-4 md:row-span-2 md:col-start-1 md:row-start-2 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Enrolled Courses</h2>
          <CourseList courses={courses} />
        </div>
        {/* Section 3 */}
        <div className="border border-gray-300 shadow-lg rounded-xl flex items-center justify-center min-w-0 w-full h-full text-3xl font-bold md:col-span-2 md:row-span-2 md:col-start-2 md:row-start-2">
          3
        </div>
        {/* Section 4 */}
        <div className="border border-gray-300 shadow-lg rounded-xl flex items-center justify-center min-w-0 w-full h-full text-3xl font-bold md:row-span-2 md:col-start-4 md:row-start-2">
          4
        </div>
        {/* Section 5 */}
        <div className="border border-gray-300 shadow-lg rounded-xl flex items-center justify-center min-w-0 w-full h-full text-3xl font-bold md:col-start-3 md:row-start-1">
          5
        </div>
        {/* Section 6 */}
        <div className="border border-gray-300 shadow-lg rounded-xl flex items-center justify-center min-w-0 w-full h-full text-3xl font-bold md:col-start-4 md:row-start-1">
          6
        </div>
      </div>
    </div>
  );
}
