"use client";
import React from "react";
import UpcomingClasses from "@/components/lecturer/UpcomingClasses";
import AllSchedulesModal from "@/components/admin/AllSchedulesModal";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Calendar from "@/components/Calendar";
import AnimatedList from "@/components/ui/AnimatedList";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  FileText,
  Bell,
  TrendingUp,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";

// Mock data for today's classes (replace with real data as needed)
const todaysClasses = [
  {
    id: 21,
    title: "Zoom Math Class",
    topic: "Algebra: Quadratic Equations",
    type: "Online Zoom Class",
    date: "2026-02-07",
    startTime: "10:00",
    endTime: "11:00",
    platform: "Zoom",
    joinUrl: "https://zoom.us/j/1234567890",
    intakeName: "2026 Intake A",
    courseName: "Math 101",
    duration: 60,
    status: "scheduled",
  },
  {
    id: 22,
    title: "Physical Chemistry Lab",
    topic: "Organic Compounds",
    type: "Physical Class",
    date: "2026-02-07",
    startTime: "13:00",
    endTime: "14:30",
    platform: "Lab 2",
    joinUrl: "",
    intakeName: "2025 Intake B",
    courseName: "Chem 201",
    duration: 90,
    status: "scheduled",
  },
  {
    id: 23,
    title: "Zoom English Lecture",
    topic: "Shakespearean Sonnets",
    type: "Online Zoom Class",
    date: "2026-02-07",
    startTime: "15:00",
    endTime: "16:00",
    platform: "Zoom",
    joinUrl: "https://zoom.us/j/9876543210",
    intakeName: "2026 Intake C",
    courseName: "Eng 102",
    duration: 60,
    status: "ongoing",
  },
  {
    id: 24,
    title: "Campus Seminar",
    topic: "Career Development",
    type: "Physical Class",
    date: "2026-02-07",
    startTime: "09:00",
    endTime: "10:00",
    platform: "Hall A",
    joinUrl: "",
    intakeName: "2024 Intake D",
    courseName: "Seminars 001",
    duration: 60,
    status: "scheduled",
  },
  {
    id: 25,
    title: "Guest Lecture: AI",
    topic: "Intro to AI",
    type: "Online Zoom Class",
    date: "2026-02-07",
    startTime: "17:00",
    endTime: "18:30",
    platform: "Zoom",
    joinUrl: "https://zoom.us/j/5555555555",
    intakeName: "2026 Intake A",
    courseName: "CS 301",
    duration: 90,
    status: "scheduled",
  },
];

// Compact date/time bar for mobile header
function MobileDateTimeBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400">
        Loading time...
      </div>
    );
  }

  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timeLabel = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <span className="text-xl font-semibold text-blue-600 leading-tight">
        {timeLabel}
      </span>
      <span className="text-xs font-medium text-gray-700 mt-1">
        {dateLabel}
      </span>
    </div>
  );
}

const statsData = [
  {
    title: "Active Students",
    value: 1234,
    icon: Users,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    trend: { value: "2.5%", isPositive: true },
  },
  {
    title: "Active Intakes",
    value: 4,
    icon: GraduationCap,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    trend: { value: "1.2%", isPositive: true },
  },
  {
    title: "Pending Payments",
    value: 12,
    icon: DollarSign,
    bgColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
    trend: { value: "0.8%", isPositive: false },
  },
];

import StatsCarousel from "@/components/admin/StatsCarousel";

export default function AdminDashboard() {
  const [isAllSchedulesOpen, setIsAllSchedulesOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const mappedSchedulesForModal = todaysClasses.map((c) => ({
    id: String(c.id),
    intakeName: c.intakeName ?? "",
    courseName: c.courseName ?? "",
    classTitle: c.title,
    startTime: c.date + "T" + (c.startTime || "00:00") + ":00Z",
    duration: c.duration ?? 60,
    status: (c.status as any) ?? "scheduled",
    zoomJoinUrl: c.joinUrl ?? "",
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        adminName="Admin User"
        activeTab="overview"
        onLogout={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        <main className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          {/* Mobile header with hamburger — phones only */}
          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide text-center flex-1">
                ACADEMIX
              </h1>

              {/* Spacer to keep title centered */}
              <div className="w-10" aria-hidden="true" />
            </div>
            <div className="mt-2">
              <MobileDateTimeBar />
            </div>
          </div>

          {/* iPad header with hamburger — no compact clock since card clock is visible */}
          <div className="hidden md:block lg:hidden mb-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide text-center flex-1">
                ACADEMIX
              </h1>

              {/* Spacer to keep title centered */}
              <div className="w-10" aria-hidden="true" />
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block mb-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-0">
              Manage all student accounts and enrollments
            </p>
          </div>

          {/* Mobile/iPad header text */}
          <div className="lg:hidden mb-4 text-center">
            <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600 text-sm mt-0">
              Manage all student accounts and enrollments
            </p>
          </div>

          {/* Stats Carousel - match student dashboard mobile size */}
          <div className="w-full p-4">
            <StatsCarousel stats={statsData}>
              {/* Date/time card on iPad and desktop */}
              <div>
                <DateTimeStatCard />
              </div>
            </StatsCarousel>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 w-full max-w-full overflow-x-hidden">
            {/* Calendar */}
            <div className="bg-gray-200 rounded-lg shadow-md min-h-[300px] lg:min-h-0 overflow-hidden lg:row-span-2 max-w-full overflow-x-hidden">
              <Calendar />
            </div>

            {/* Today's Classes */}
            <div className="bg-white rounded-lg shadow-md p-4 flex flex-col min-h-[300px] lg:min-h-0 overflow-auto">
              <div className="flex items-start justify-between mb-4">
                <div className="text-xl font-semibold">
                  Today&apos;s Classes
                </div>
                <div>
                  <button
                    onClick={() => setIsAllSchedulesOpen(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    View all
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2 overflow-auto">
                <AnimatedList
                  items={todaysClasses.slice(0, 3).map((cls) => (
                    <div
                      key={cls.id}
                      className="bg-white rounded-md border border-gray-200 flex items-center justify-between gap-4 flex-1 min-h-0 py-4 px-4"
                      style={{ minHeight: 0 }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {cls.title}
                        </div>
                        {cls.topic && (
                          <div className="text-xs text-gray-500 truncate">
                            {cls.topic}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 truncate">
                          <span className="inline-block truncate">
                            <span className="font-medium">Time:</span>{" "}
                            {cls.startTime}–{cls.endTime}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="inline-block truncate">
                            <span className="font-medium">Loc:</span>{" "}
                            {cls.platform}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {cls.platform === "Zoom" && cls.joinUrl ? (
                          <a
                            href={cls.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1 rounded"
                          >
                            Specate
                          </a>
                        ) : (
                          <div className="text-xs text-gray-500">
                            {cls.platform}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  showGradients={false}
                  displayScrollbar={false}
                  className="h-full min-h-0"
                  itemClassName="w-full flex-1 min-h-0"
                  onItemSelect={() => {}}
                />
              </div>
              <AllSchedulesModal
                isOpen={isAllSchedulesOpen}
                onClose={() => setIsAllSchedulesOpen(false)}
                classes={mappedSchedulesForModal}
              />
            </div>

            {/* Section 7 — right column on desktop (below Today's Classes), full width on mobile */}
            <div className="bg-gray-200 rounded-lg shadow-md p-2 min-h-0 overflow-hidden">
              <div className="w-full h-full grid grid-cols-2 gap-2 min-h-0">
                <div className="bg-white rounded shadow flex items-center justify-center min-h-[60px]">
                  Section 7.1
                </div>
                <div className="bg-white rounded shadow flex items-center justify-center min-h-[60px]">
                  Section 7.2
                </div>
                <div className="bg-white rounded shadow flex items-center justify-center min-h-[60px]">
                  Section 7.3
                </div>
                <div className="bg-white rounded shadow flex items-center justify-center min-h-[60px]">
                  Section 7.4
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// DateTimeStatCard component outside AdminDashboard
function DateTimeStatCard() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col items-center justify-center w-full animate-pulse">
        <div className="h-10 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-6 w-24 bg-gray-100 rounded"></div>
      </div>
    );
  }

  const time = now.toLocaleTimeString("en-US", { hour12: false });
  const date = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col items-center justify-center w-full">
      <span className="text-4xl md:text-5xl font-extrabold text-blue-600 mb-2 tracking-wider">
        {time}
      </span>
      <span className="text-lg md:text-xl font-semibold text-gray-800">
        {date}
      </span>
    </div>
  );
}
