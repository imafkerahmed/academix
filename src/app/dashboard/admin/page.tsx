"use client";
import React from "react";
import { useRouter } from "next/navigation";

import AllSchedulesModal from "@/components/admin/AllSchedulesModal";
import Calendar from "@/components/Calendar";
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  Layout,
  Video,
  Calendar as CalendarIcon,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import StatsCarousel from "@/components/admin/StatsCarousel";
import pb from "@/lib/pocketbase";

interface CalendarEvent {
  id: string;
  title: string;
  topic: string;
  type: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: string;
  courseName?: string;
  subjectName?: string;
  link: string;
  rawStartTime?: string;
  duration?: number;
}

interface DashboardStat {
  title: string;
  value: string | number;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

interface TodaysClass {
  id: string;
  title: string;
  courseName: string;
  intakeName: string;
  platform: string;
  startTime: string;
  endTime: string;
  joinUrl: string;
  status: string;
  duration: number;
  rawStartTime: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isAllSchedulesOpen, setIsAllSchedulesOpen] = React.useState(false);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [todaysClasses, setTodaysClasses] = useState<TodaysClass[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);

  useEffect(() => {
    const currentUser = pb.authStore.model;
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/login");
      return;
    }

    if (currentUser.accountStatus === "disabled") {
      return;
    }

    const init = async () => {
      // Fetch each section independently to improve perceived load speed
      void fetchDashboardStats();
      void fetchTodaysClasses();
      void fetchCalendarEvents();
    };
    init();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const [students, intakes, payments, courses] = await Promise.all([
        pb.collection("users").getList(1, 1, { filter: 'role = "student" && accountStatus = "active"' }),
        pb.collection("intakes").getList(1, 1, { filter: 'intakeStatus = "ongoing"' }),
        pb.collection("payments").getList(1, 1, { filter: "verified = false" }),
        pb.collection("courses").getList(1, 1),
      ]);

      setStats([
        {
          title: "Active Students",
          value: students.totalItems,
          icon: Users,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          title: "Active Intakes",
          value: intakes.totalItems,
          icon: GraduationCap,
          bgColor: "bg-green-50",
          iconColor: "text-green-600",
        },
        {
          title: "Pending Sync",
          value: payments.totalItems,
          icon: DollarSign,
          bgColor: "bg-orange-50",
          iconColor: "text-orange-600",
        },
        {
          title: "Total Courses",
          value: courses.totalItems,
          icon: BookOpen,
          bgColor: "bg-purple-50",
          iconColor: "text-purple-600",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTodaysClasses = async () => {
    try {
      setClassesLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const records = await pb.collection("classes").getFullList({
        filter: `start_time >= "${today.toISOString()}" && start_time < "${tomorrow.toISOString()}"`,
        expand: "course_subject.subject,course_subject.course_intake.course",
        sort: "start_time",
      });

      setTodaysClasses(records.map(record => {
        const cs = record.expand?.course_subject;
        const subject = cs?.expand?.subject;
        const intake = cs?.expand?.course_intake?.expand?.intake;
        const course = cs?.expand?.course_intake?.expand?.course;
        const subjectName = Array.isArray(subject) ? subject[0]?.name : subject?.name;

        return {
          id: record.id,
          title: subjectName || record.title,
          courseName: course?.name || "Multiple Courses",
          intakeName: intake?.name || "Multiple Intakes",
          platform: record.type || "Online",
          startTime: new Date(record.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          endTime: new Date(new Date(record.start_time).getTime() + record.duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          joinUrl: record.zoom_link,
          status: record.status,
          duration: record.duration,
          rawStartTime: record.start_time,
        };
      }));
    } catch (error) {
      console.error("Error fetching today's classes:", error);
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      setCalendarLoading(true);
      // 1. Fetch all Classes
      const classes = await pb.collection("classes").getFullList({
        filter: 'status != "cancelled"',
        expand: "course_subject.subject,course_subject.course_intake.course",
        sort: "start_time",
      });

      // 2. Fetch all Assignments
      const assignments = await pb.collection("assignments").getFullList({
        expand: "course_subject.subject,course_subject.course_intake.course",
      });

      // 3. Format Events
      const classEvents = classes.map((c) => {
        const cs = c.expand?.course_subject;
        const subject = cs?.expand?.subject;
        const course = cs?.expand?.course_intake?.expand?.course;

        const subjectName = subject?.name || (Array.isArray(subject) ? subject[0]?.name : subject?.name);

        return {
          id: c.id,
          title: subjectName || "Class",
          topic: c.topic || "",
          type: (c.type === "Online Class" ? "Online Class" : c.type) || "Online Class",
          date: new Date(c.start_time).toISOString().slice(0, 10),
          startTime: new Date(c.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          endTime: new Date(
            new Date(c.start_time).getTime() + c.duration * 60000,
          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: c.status,
          courseName: course?.name,
          subjectName: subjectName,
          link: c.zoom_link || "",
          rawStartTime: c.start_time,
          duration: c.duration,
        };
      });

      const assignmentEvents = assignments.map((a) => {
        const cs = a.expand?.course_subject;
        const subject = cs?.expand?.subject;
        const course = cs?.expand?.course_intake?.expand?.course;

        const dueDate = a.deadline || a.due_date || a.created;
        return {
          id: a.id,
          title: `Assignment: ${a.title}`,
          topic: "",
          type: "Assignment",
          date: new Date(dueDate).toISOString().slice(0, 10),
          startTime: new Date(dueDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "pending",
          courseName: course?.name,
          subjectName: subject?.name,
          link: `/dashboard/admin/assignments/${a.id}`,
        };
      });

      setCalendarEvents([...classEvents, ...assignmentEvents]);
    } finally {
      setCalendarLoading(false);
    }
  };
  // Show disabled account message if account is disabled
  if (pb.authStore.model?.accountStatus === "disabled") {
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

  const mappedSchedulesForModal = todaysClasses.map((c) => ({
    id: String(c.id),
    intakeName: c.intakeName ?? "",
    courseName: c.courseName ?? "",
    classTitle: c.title,
    startTime: c.rawStartTime || (new Date().toISOString()),
    duration: c.duration ?? 60,
    status: (c.status as "scheduled" | "ongoing" | "completed") ?? "scheduled",
    zoomJoinUrl: c.joinUrl ?? "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <Layout size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Dashboard <span className="text-indigo-600">Overview</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-400" />
              Insights & Quick Stats
            </p>
          </div>
        </div>
      </div>

          {/* Stats Section with Premium Styling */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {statsLoading ? (
              <div className="h-32 bg-gray-50 rounded-3xl animate-pulse" />
            ) : (
              <StatsCarousel stats={stats} />
            )}
          </div>

          {/* Main Grid: 2 Column Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 w-full max-w-full overflow-x-hidden">
            {/* Calendar: Make more prominent on desktop */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 animate-in fade-in slide-in-from-left-6 duration-700">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 lg:p-4 overflow-hidden hover:shadow-xl transition-all duration-500 ring-1 ring-gray-950/[0.02] flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg lg:text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon size={20} className="text-indigo-500" />{" "}
                    Academic Calendar
                  </h3>
                </div>
                <div className="flex items-start justify-center">
                  <div className="w-full">
                    {calendarLoading ? (
                      <div className="h-[400px] flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <Calendar events={calendarEvents} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Today's Classes & Quick Insights */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8 animate-in fade-in slide-in-from-right-6 duration-700">
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

                {/* Only the new list view is rendered */}
                <div className="flex-1 max-h-[420px] overflow-y-auto pr-1">
                  <div className="flex flex-col gap-5">
                    {classesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
                        ))}
                      </div>
                    ) : todaysClasses.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">No classes scheduled for today</p>
                      </div>
                    ) : (
                      todaysClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-3 shadow-sm hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 mt-1 ${cls.status === "ongoing" || cls.status === "in_progress" ? "bg-green-100 text-green-600 animate-pulse ring-4 ring-green-50" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"}`}
                            >
                              <Video size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-2"
                                  title={cls.title}
                                >
                                  {cls.title}
                                </span>
                                {(cls.status === "ongoing" || cls.status === "in_progress") && (
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-pulse">
                                    LIVE
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-semibold mt-1 truncate">
                                {cls.courseName} &bull; {cls.platform}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                            <span className="text-xs text-gray-400 font-bold">
                              {cls.startTime} - {cls.endTime}
                            </span>
                            {cls.joinUrl && (
                              <a
                                href={cls.joinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm text-center"
                              >
                                Spectate
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
      <AllSchedulesModal
        isOpen={isAllSchedulesOpen}
        onClose={() => setIsAllSchedulesOpen(false)}
        classes={mappedSchedulesForModal}
      />
    </div>
  );
}

