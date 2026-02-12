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
  Clock,
  Layout,
  Zap,
  Activity,
  Video,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import StatsCarousel from "@/components/admin/StatsCarousel";

// Mock data for today's classes
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
];

const statsData = [
  {
    title: "Active Students",
    value: 1234,
    icon: Users,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    trend: { value: "2.5%", isPositive: true },
  },
  {
    title: "Active Intakes",
    value: 4,
    icon: GraduationCap,
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    trend: { value: "1.2%", isPositive: true },
  },
  {
    title: "Pending Payments",
    value: 12,
    icon: DollarSign,
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    trend: { value: "0.8%", isPositive: false },
  },
];

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
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden transition-all duration-300">
        <main className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 group">
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                Dashboard <span className="text-indigo-600">Overview</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <DateTimeStatCard />
              <button
                className="lg:hidden p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-500"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>

          {/* Stats Section with Premium Styling */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <StatsCarousel stats={statsData} />
          </div>

          {/* Main Grid: 2 Column Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 w-full max-w-full overflow-x-hidden">
            {/* Left: Calendar - 5 cols */}
            <div className="lg:col-span-5 flex flex-col gap-6 animate-in fade-in slide-in-from-left-6 duration-700">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-2 overflow-hidden h-full min-h-[400px] hover:shadow-xl transition-all duration-500 ring-1 ring-gray-950/[0.02]">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon size={16} className="text-indigo-500" />{" "}
                    Academic Calendar
                  </h3>
                </div>
                <div className="p-4 h-full">
                  <Calendar />
                </div>
              </div>
            </div>

            {/* Right: Today's Classes & Quick Actions - 7 cols */}
            <div className="lg:col-span-7 flex flex-col gap-8 animate-in fade-in slide-in-from-right-6 duration-700">
              {/* Today's Classes Card */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col min-h-[400px] hover:shadow-xl transition-all duration-500 ring-1 ring-gray-950/[0.02]">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                      Today&apos;s{" "}
                      <span className="text-indigo-600">Classes</span>
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                      Live updates from the system
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAllSchedulesOpen(true)}
                    className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    View Schedule
                  </button>
                </div>

                <div className="flex-1 space-y-4">
                  {todaysClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="group bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-indigo-100 rounded-[1.8rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/[0.05]"
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 ${cls.status === "ongoing" ? "bg-green-100 text-green-600 animate-pulse ring-4 ring-green-50" : "bg-white text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"}`}
                        >
                          <Video size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                            {cls.title}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span className="text-indigo-500">
                              {cls.courseName}
                            </span>
                            <span>•</span>
                            <span>{cls.platform}</span>
                            {cls.status === "ongoing" && (
                              <span className="flex items-center gap-1 text-green-500 ml-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{" "}
                                LIVE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">
                            Session Timing
                          </span>
                          <div className="flex items-center gap-2 font-bold text-gray-900">
                            <Clock size={14} className="text-indigo-400" />
                            {cls.startTime} - {cls.endTime}
                          </div>
                        </div>
                        {cls.joinUrl && (
                          <button className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 uppercase">
                            Spectate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Insights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Active Sessions",
                    value: "12",
                    icon: Zap,
                    color: "text-amber-500",
                    bg: "bg-amber-50",
                  },
                  {
                    label: "New Notifications",
                    value: "08",
                    icon: Bell,
                    color: "text-indigo-500",
                    bg: "bg-indigo-50",
                  },
                  {
                    label: "Live Traffic",
                    value: "High",
                    icon: Activity,
                    color: "text-green-500",
                    bg: "bg-green-50",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-[2rem] border border-gray-100 p-6 flex items-center gap-5 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div
                      className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm`}
                    >
                      <item.icon size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {item.label}
                      </span>
                      <span className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <AllSchedulesModal
        isOpen={isAllSchedulesOpen}
        onClose={() => setIsAllSchedulesOpen(false)}
        classes={mappedSchedulesForModal}
      />
    </div>
  );
}

function DateTimeStatCard() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  const time = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="bg-white rounded-[1.8rem] shadow-sm border border-gray-100 px-6 py-3 flex items-center gap-4 hover:shadow-md transition-all group">
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
        <Clock size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black text-gray-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
          {time}
        </span>
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
          {date.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
