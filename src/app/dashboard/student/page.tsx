"use client";

import React from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Calendar as CalendarIcon,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Megaphone,
  Bell,
  Info,
  X as CloseIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import StudentProfile from "@/components/student-profile";
import Section5Schedules from "@/components/Schedules";
import Calendar from "@/components/Calendar";

const courses = [
  {
    id: "1",
    name: "Mathematics 101",
    registrationNumber: "REG-2024-001",
    description: "Intro to Algebra and Calculus",
    courseStatus: "Ongoing",
    certificateStatus: "Not Issued",
  },
  {
    id: "2",
    name: "Physics 201",
    registrationNumber: "REG-2024-002",
    description: "Mechanics and Thermodynamics",
    courseStatus: "Completed",
    certificateStatus: "Issued",
  },
  {
    id: "3",
    name: "History 101",
    registrationNumber: "REG-2024-003",
    description: "World History Overview",
    courseStatus: "Ongoing",
    certificateStatus: "Not Issued",
  },
  {
    id: "4",
    name: "Computer Science 101",
    registrationNumber: "REG-2024-004",
    description: "Programming Basics",
    courseStatus: "Completed",
    certificateStatus: "Issued",
  },
];

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "Urgent" | "Academic" | "General";
  timestamp: string;
  isRead: boolean;
  imageUrl?: string;
  link?: {
    url: string;
    label: string;
  };
}

const mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "Exam Schedule Released",
    content:
      "The final exam schedule for the January 2024 intake is now available in the academic portal. Please ensure you check your respective subject codes and timings carefully to avoid any confusion. All exams will be held in the main campus hall unless stated otherwise in the detailed breakdown found in the student handbook.",
    category: "Academic",
    timestamp: "30m ago",
    isRead: false,
    imageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60",
    link: { url: "#", label: "View Schedule" },
  },
  {
    id: "ann-2",
    title: "System Maintenance",
    content:
      "The portal will be down for maintenance this Sunday from 2:00 AM to 4:00 AM. During this time, you will not be able to access your courses, submit assignments, or view your schedule. We apologize for any inconvenience caused by this necessary upgrade to our core infrastructure.",
    category: "Urgent",
    timestamp: "2h ago",
    isRead: false,
  },
  {
    id: "ann-3",
    title: "Guest Lecture: AI Trends",
    content:
      "Join us for a session on the future of AI in software development this Friday. Our guest speaker, Dr. Elena Rostova, will be sharing insights into how large language models are reshaping the landscape of development. This is a must-attend for all final year students.",
    category: "General",
    timestamp: "1d ago",
    isRead: true,
    link: { url: "#", label: "Register Now" },
  },
];

export default function StudentDashboard() {
  const statsData = [
    {
      title: "Enrolled Courses",
      value: courses.length,
      icon: BookOpen,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: { value: "Active", isPositive: true },
    },
    {
      title: "Completed",
      value: courses.filter((c) => c.courseStatus === "Completed").length,
      icon: CheckCircle2,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      trend: { value: "Finished", isPositive: true },
    },
    {
      title: "In Progress",
      value: courses.filter((c) => c.courseStatus === "Ongoing").length,
      icon: Clock,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      trend: { value: "Ongoing", isPositive: true },
    },
    {
      title: "Certificates",
      value: courses.filter((c) => c.certificateStatus === "Issued").length,
      icon: GraduationCap,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      trend: { value: "Issued", isPositive: true },
    },
  ];

  const [isPortalOpen, setIsPortalOpen] = React.useState(false);
  const [announcements, setAnnouncements] =
    React.useState<Announcement[]>(mockAnnouncements);
  const unreadCount = announcements.filter(
    (a: Announcement) => !a.isRead,
  ).length;

  const markAllAsRead = () => {
    setAnnouncements(
      announcements.map((a: Announcement) => ({ ...a, isRead: true })),
    );
  };

  // Background Scroll Lock
  React.useEffect(() => {
    if (isPortalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isPortalOpen]);

  // State for expanded announcements
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  return (
    <>
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {/* Profile */}
        <div className="lg:col-span-6 xl:col-span-6 min-w-0">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-500">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-6">
              My <span className="text-indigo-600">Profile</span>
            </h3>
            <StudentProfile
              fullName="Mohammed Inayathullah Afker Ahmed"
              studentId="REG-2024-XYZ"
              role="STUDENT"
              avatarUrl="/profile-img.jpg"
              accountStatus="Active"
              advisorName="Dr. Sarah Johnson"
              advisorEmail="sarah.johnson@academix.edu"
              compact={true}
            />
          </div>
        </div>

        {/* Schedules */}
        <div className="lg:col-span-6 xl:col-span-6 min-w-0">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-500">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-6">
              Upcoming <span className="text-indigo-600">Schedules</span>
            </h3>
            <Section5Schedules />
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <CalendarIcon size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
              Academic <span className="text-indigo-600">Calendar</span>
            </h3>
          </div>
          <div className="h-[600px]">
            <Calendar />
          </div>
        </div>
      </div>

      {/* Floating Announcement Portal */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setIsPortalOpen(true)}
          className="group relative w-16 h-16 bg-white/80 backdrop-blur-xl border border-white/40 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
        >
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center z-10 animate-in zoom-in-50">
                {unreadCount}
              </span>
              <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
            </>
          )}
          <Megaphone
            className={`transition-colors duration-300 ${unreadCount > 0 ? "text-indigo-600" : "text-gray-400"}`}
            size={28}
          />
        </button>
      </div>

      <AnimatePresence>
        {isPortalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPortalOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white/90 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[70] flex flex-col border-l border-white/20"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                      What's <span className="text-indigo-600">New</span>
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {unreadCount} UNREAD UPDATES
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="p-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={() => setIsPortalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                  >
                    <CloseIcon size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {announcements.map((ann: Announcement, idx: number) => {
                  const isExpanded = expandedId === ann.id;
                  const hasLongContent = ann.content.length > 120;

                  return (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      onClick={() => {
                        // Mark as read when clicking
                        setAnnouncements((prev) =>
                          prev.map((a) =>
                            a.id === ann.id ? { ...a, isRead: true } : a,
                          ),
                        );
                        if (hasLongContent) {
                          setExpandedId(isExpanded ? null : ann.id);
                        }
                      }}
                      className={`rounded-[2rem] border transition-all duration-500 relative group overflow-hidden ${
                        ann.isRead
                          ? "bg-gray-50/30 border-gray-100"
                          : "bg-white border-indigo-50 shadow-xl shadow-indigo-100/5 hover:border-indigo-200"
                      }`}
                    >
                      {ann.imageUrl && (
                        <div className="w-full h-40 overflow-hidden relative">
                          <img
                            src={ann.imageUrl}
                            alt={ann.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          {!ann.isRead && (
                            <div className="absolute top-4 right-4 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-lg z-10" />
                          )}
                        </div>
                      )}

                      <div className="p-6 space-y-4">
                        {!ann.imageUrl && !ann.isRead && (
                          <div className="absolute top-6 right-6 w-2 h-2 bg-indigo-600 rounded-full" />
                        )}

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                ann.category === "Urgent"
                                  ? "bg-red-50 text-red-600"
                                  : ann.category === "Academic"
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {ann.category}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                              {ann.timestamp}
                            </span>
                          </div>

                          <h3
                            className={`text-sm font-black tracking-tight uppercase leading-tight ${ann.isRead ? "text-gray-600" : "text-gray-900"}`}
                          >
                            {ann.title}
                          </h3>

                          <motion.div
                            initial={false}
                            animate={{
                              height:
                                isExpanded || !hasLongContent ? "auto" : "3em",
                            }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs font-medium text-gray-500 leading-relaxed">
                              {ann.content}
                            </p>
                          </motion.div>

                          {hasLongContent && (
                            <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 w-fit">
                              {isExpanded ? "Show Less" : "Read More"}
                            </button>
                          )}

                          {ann.link && (
                            <a
                              href={ann.link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:shadow-2xl hover:bg-indigo-700 transition-all w-fit mt-2"
                            >
                              {ann.link.label}
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
