"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldX,
  Menu,
  Layout,
  TrendingUp,
  Clock,
  GraduationCap,
  BookOpen,
  FileEdit,
  Video,
  CalendarIcon,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import pb from "@/lib/pocketbase";
import Sidebar from "@/components/lecturer/Sidebar";
import UpcomingClasses, {
  type UpcomingClass,
} from "@/components/lecturer/UpcomingClasses";
import AllSchedulesModal from "@/components/lecturer/AllSchedulesModal";
import IntakesTree, {
  type Intake,
  type Course,
  type Subject,
} from "@/components/lecturer/IntakesTree";
import StatsCarousel from "@/components/admin/StatsCarousel";

// Mock user type
interface MockUser {
  id: string;
  name: string;
  role: "lecturer" | "student" | "admin";
  accountStatus: "active" | "disabled";
}

// Mock data
const mockUser: MockUser = {
  id: "lect-001",
  name: "Dr. Sarah Johnson",
  role: "lecturer",
  accountStatus: "active",
};

const mockIntakes: Intake[] = [
  {
    id: "intake-1",
    code: "INT-2024-01",
    name: "January 2024 Intake",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    courses: [
      {
        id: "course-1",
        name: "Computer Science Fundamentals",
        code: "CS101",
        subjects: [
          {
            id: "subject-1",
            name: "Programming Basics",
            code: "CS101-A",
            assigned: true,
          },
          {
            id: "subject-2",
            name: "Data Structures",
            code: "CS101-B",
            assigned: true,
          },
          {
            id: "subject-3",
            name: "Algorithms",
            code: "CS101-C",
            assigned: false,
          },
        ],
      },
      {
        id: "course-2",
        name: "Web Development",
        code: "WEB201",
        subjects: [
          {
            id: "subject-4",
            name: "Frontend Development",
            code: "WEB201-A",
            assigned: true,
          },
          {
            id: "subject-5",
            name: "Backend Development",
            code: "WEB201-B",
            assigned: false,
          },
        ],
      },
    ],
  },
  {
    id: "intake-2",
    code: "INT-2024-02",
    name: "March 2024 Intake",
    startDate: "2024-03-01",
    endDate: "2024-08-31",
    courses: [
      {
        id: "course-3",
        name: "Mathematics",
        code: "MATH101",
        subjects: [
          {
            id: "subject-6",
            name: "Calculus I",
            code: "MATH101-A",
            assigned: true,
          },
        ],
      },
    ],
  },
];

const mockUpcomingClasses: UpcomingClass[] = [
  {
    id: "class-1",
    intakeName: "January 2024 Intake",
    courseName: "Computer Science Fundamentals",
    classTitle: "Introduction to Programming - Lecture 5",
    startTime: "2026-02-07 10:00 AM",
    duration: 90,
    status: "scheduled",
    zoomJoinUrl: "https://zoom.us/j/mock-meeting-1",
  },
  {
    id: "class-2",
    intakeName: "January 2024 Intake",
    courseName: "Web Development",
    classTitle: "React Components Deep Dive",
    startTime: "2026-02-08 02:00 PM",
    duration: 120,
    status: "scheduled",
    zoomJoinUrl: "https://zoom.us/j/mock-meeting-2",
  },
  {
    id: "class-3",
    intakeName: "March 2024 Intake",
    courseName: "Mathematics",
    classTitle: "Limits and Continuity",
    startTime: "2026-02-09 09:00 AM",
    duration: 60,
    status: "scheduled",
    zoomJoinUrl: "https://zoom.us/j/mock-meeting-3",
  },
];

function DateTimeStatCard() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
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

export default function LecturerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const currentUser = pb.authStore.model;
    if (!pb.authStore.isValid || (currentUser as any)?.role !== "lecturer") {
      router.replace("/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  // Show disabled account message if account is disabled
  if (user?.accountStatus === "disabled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-12 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Lock size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Account Disabled
          </h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Your account has been disabled. Please contact the administrator for
            assistance.
          </p>
          <button
            onClick={() => {
              pb.authStore.clear();
              router.push("/login");
            }}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = {
    totalIntakes: mockIntakes.length,
    totalCourses: mockIntakes.reduce(
      (sum, intake) => sum + intake.courses.length,
      0,
    ),
    totalSubjects: mockIntakes.reduce(
      (sum, intake) =>
        sum +
        intake.courses.reduce(
          (courseSum: number, course: Course) =>
            courseSum +
            course.subjects.filter((s: Subject) => s.assigned).length,
          0,
        ),
      0,
    ),
    upcomingClasses: mockUpcomingClasses.length,
    assignmentsToMark: 0,
  };

  const statsData = [
    {
      title: "Active Intakes",
      value: stats.totalIntakes,
      icon: GraduationCap,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: { value: "2 active", isPositive: true },
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      trend: { value: "Assigned", isPositive: true },
    },
    {
      title: "My Subjects",
      value: stats.totalSubjects,
      icon: Layout,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      trend: { value: "Teaching", isPositive: true },
    },
    {
      title: "Upcoming Classes",
      value: stats.upcomingClasses,
      icon: Video,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      trend: { value: "This week", isPositive: true },
    },
  ];

  if (!user || user.role !== "lecturer" || user.accountStatus === "disabled") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto mb-6">
            <ShieldX size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Access Denied
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
            Insufficient permissions
          </p>
          <a
            href="/"
            className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <Layout size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Lecturer <span className="text-indigo-600">Dashboard</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-400" />
              Welcome back, {user.name.split(" ")[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateTimeStatCard />
        </div>
      </div>

      {/* Stats Carousel */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <StatsCarousel stats={statsData} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {/* Upcoming Classes */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 ring-1 ring-gray-950/[0.02] flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Video size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    Upcoming <span className="text-indigo-600">Classes</span>
                  </h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                    Your scheduled sessions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                View All
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <UpcomingClasses classes={mockUpcomingClasses} />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 ring-1 ring-gray-950/[0.02]">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-4">
              Recent <span className="text-indigo-600">Activity</span>
            </h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              Activity feed will appear here.
            </p>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 ring-1 ring-gray-950/[0.02]">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-4">
              <span className="text-indigo-600">Announcements</span>
            </h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              Important announcements will appear here.
            </p>
          </div>
        </div>
      </div>

      {/* All Schedules Modal */}
      {isModalOpen && (
        <AllSchedulesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          classes={mockUpcomingClasses}
        />
      )}
    </>
  );
}
