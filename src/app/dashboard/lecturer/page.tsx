"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldX,
  Layout,
  TrendingUp,
  Clock,
  GraduationCap,
  BookOpen,
  Video,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import pb from "@/lib/pocketbase";
import UpcomingClasses, {
  type UpcomingClass,
} from "@/components/lecturer/UpcomingClasses";
import AllSchedulesModal from "@/components/lecturer/AllSchedulesModal";
import {
  type User,
} from "@/lib/pocketbase";
import StatsCarousel from "@/components/admin/StatsCarousel";

// Mock user type
// Mock user type deleted - unused

// UI specific types extending PB types
// Mock data removed

// Data fetching for real classes
const fetchUpcomingClasses = async (
  lecturerId: string,
): Promise<UpcomingClass[]> => {
  try {
    const res = await fetch(`/api/lecturer/classes?lecturerId=${lecturerId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.statusText}`);
    }
    const data = await res.json();
    const records = data.records || [];

    const today = new Date().toISOString().slice(0, 10);

    const mappedRecords = records
      .filter((record: { status: string; start_time: string }) => {
        if (record.status === "completed") {
          const recordDate = new Date(record.start_time)
            .toISOString()
            .slice(0, 10);
          return recordDate === today;
        }
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((record: any) => {
        const csExpand = record.expand?.course_subject;
        const subjects = Array.isArray(csExpand) ? csExpand : [csExpand].filter(Boolean);
        
        const subjectNames = subjects
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((cs: any) => {
            const subjectData = cs?.expand?.subject;
            if (Array.isArray(subjectData)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return subjectData.map((s: any) => s.name).join(", ");
            }
            return subjectData?.name;
          })
          .filter(Boolean)
          .join(", ");

        const courseNames = subjects
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((cs: any) => cs?.expand?.course_intake?.expand?.course?.name)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(", ");

        const intakeNames = subjects
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((cs: any) => cs?.expand?.course_intake?.expand?.intake?.code)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(", ");

        const isMerged = subjects.length > 1;

        return {
          id: record.id,
          intakeName: intakeNames || "N/A",
          courseName: courseNames || "N/A",
          subjectName: subjectNames || "N/A",
          classTitle: record.title,
          startTime: new Date(record.start_time).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          rawStartTime: record.start_time,
          duration: record.duration,
          status: record.status as "scheduled" | "in_progress" | "completed" | "cancelled",
          lecturerName: record.expand?.lecturer?.name || "Lecturer",
          isMerged,
        } as UpcomingClass & { rawStartTime: string };
      });

    const now = Date.now();
    const activeUpcoming: UpcomingClass[] = [];
    const ended: UpcomingClass[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mappedRecords.forEach((item: any) => {
      const scheduledEnd =
        new Date(item.rawStartTime).getTime() + item.duration * 60000;
      if (now >= scheduledEnd) {
        ended.push(item);
      } else {
        activeUpcoming.push(item);
      }
    });

    return [...activeUpcoming, ...ended];
  } catch (error) {
    console.error("Error fetching classes:", error);
    return [];
  }
};

function DateTimeStatCard() {
  const [now, setNow] = useState<Date | null>(() => (typeof window !== "undefined" ? new Date() : null));

  useEffect(() => {
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
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const currentUser = pb.authStore.model as User | null;
    if (!pb.authStore.isValid || currentUser?.role !== "lecturer") {
      router.replace("/login");
      return;
    }
    Promise.resolve().then(() => setUser(currentUser));
  }, [router]);

  const [subjectsCount, setSubjectsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [intakesCount, setIntakesCount] = useState(0);

  const loadStats = async (lecturerId: string) => {
    try {
      const res = await fetch(`/api/lecturer/intakes?lecturerId=${lecturerId}`);
      if (res.ok) {
        const data = await res.json();
        const intakes = data.records || [];
        setIntakesCount(intakes.length);
        
        let courses = 0;
        let subjects = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        intakes.forEach((intake: any) => {
          courses += intake.courses.length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          intake.courses.forEach((course: any) => {
            subjects += course.subjects.length;
          });
        });
        setCoursesCount(courses);
        setSubjectsCount(subjects);
      }
    } catch (error) {
      console.error("Error loading lecturer stats:", error);
    }
  };

  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);

  const loadClasses = async (lecturerId: string) => {
    const classes = await fetchUpcomingClasses(lecturerId);
    setUpcomingClasses(classes);
  };

  useEffect(() => {
    if (user?.id) {
      const init = async () => {
        await loadStats(user.id);
        await loadClasses(user.id);
      };
      init();
      // ... existing subscription code

      // Listen for real-time updates
      const subscribeToClasses = async () => {
        try {
          await pb.collection("classes").subscribe("*", (e) => {
            console.log("Class update received:", e.action, e.record);
            loadClasses(user.id);
          });
        } catch (error) {
          console.error("Failed to subscribe to classes:", error);
        }
      };

      subscribeToClasses();

      return () => {
        pb.collection("classes").unsubscribe("*");
      };
    }
  }, [user]);

  const [isSidebarOpen] = useState(false);

  useEffect(() => {
    // Sidebar effect logic
  }, [isSidebarOpen]);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = {
    totalIntakes: intakesCount,
    totalCourses: coursesCount,
    totalSubjects: subjectsCount,
    upcomingClasses: upcomingClasses.length,
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

  if (!user || user.role !== "lecturer" || (user.accountStatus as string) === "disabled") {
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
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Back to Home
          </Link>
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
              <UpcomingClasses classes={upcomingClasses} />
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
          classes={upcomingClasses}
        />
      )}
    </>
  );
}
