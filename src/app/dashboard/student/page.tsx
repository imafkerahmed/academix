"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Megaphone,
  Bell,
  X as CloseIcon,
  Loader2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import StudentProfile from "@/components/student-profile";
import Section5Schedules from "@/components/Schedules";
import Calendar from "@/components/Calendar";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

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

interface EnrollmentRecord {
  id: string;
  course_intake: string;
  status: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  topic?: string;
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

interface StudentUser {
  id: string;
  name?: string;
  userId?: string;
  avatar?: string;
  accountStatus?: string;
  academicAdvisor?: string;
}

interface PBClass {
  id: string;
  topic?: string;
  type?: string;
  start_time: string;
  duration: number;
  zoom_link?: string;
  status: string;
  expand?: {
    course_subject?: {
      id: string;
      course_intake?: string;
      expand?: {
        subject?: { name: string; id: string };
        course_intake?: {
          expand?: {
            course?: { name: string };
          };
        };
      };
    };
  };
}

interface PBAssignment {
  id: string;
  title: string;
  deadline?: string;
  due_date?: string;
  created: string;
  expand?: {
    course_subject?: {
      id: string;
      course_intake?: string;
      expand?: {
        subject?: { name: string; id: string };
        course_intake?: {
          expand?: {
            course?: { name: string };
          };
        };
      };
    };
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<StudentUser | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const hasInitialized = React.useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);


  const fetchCalendarEvents = React.useCallback(async (providedEnrollments?: EnrollmentRecord[]) => {
    try {
      setIsCalendarLoading(true);
      const currentUser = pb.authStore.model;
      if (!currentUser) return;

      // 1. Fetch enrollments
      let enrollmentRecords = providedEnrollments || enrollments;
      if (!enrollmentRecords || enrollmentRecords.length === 0) {
        const token = pb.authStore.token;
        const resp = await fetch("/api/student/enrollments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error("Failed to fetch enrollments");
        const data = await resp.json();
        enrollmentRecords = data.enrollments;
        setEnrollments(enrollmentRecords!);
      }

      const intakeIds = enrollmentRecords.map((e: { course_intake: string }) => e.course_intake);
      if (intakeIds.length === 0) {
        setCalendarEvents([]);
        return;
      }

      // 2. Fetch course subject IDs
      const csFilter = intakeIds
        .map((id: string) => `course_intake = "${id}"`)
        .join(" || ");

      const matchingCourseSubjects = await pb
        .collection("course_subjects")
        .getFullList({
          filter: csFilter,
          fields: "id",
        });

      const csIds = matchingCourseSubjects.map((cs) => cs.id);
      if (csIds.length === 0) {
        setCalendarEvents([]);
        return;
      }

      // 3. Fetch Classes
      const classFilter = csIds
        .map((id: string) => `course_subject ~ "${id}"`)
        .join(" || ");

      const classes = (await pb.collection("classes").getFullList({
        filter: `(${classFilter}) && status != "cancelled"`,
        expand: "course_subject.subject,course_intake.course",
        sort: "start_time",
      })) as unknown as PBClass[];

      // 4. Fetch Assignments
      const assignmentFilter = csIds
        .map((id: string) => `course_subject = "${id}"`)
        .join(" || ");

      const assignments = (await pb.collection("assignments").getFullList({
        filter: assignmentFilter,
        expand: "course_subject.subject,course_subject.course_intake.course",
      })) as unknown as PBAssignment[];

      // 5. Format Events
      const classEvents = classes.map((c: PBClass) => {
        const cs = Array.isArray(c.expand?.course_subject) ? c.expand.course_subject[0] : c.expand?.course_subject;
        const subject = cs?.expand?.subject;
        const course = cs?.expand?.course_intake?.expand?.course;
        
        // Find enrollment for this course_intake to build the link
        const enrollment = enrollmentRecords.find((e: EnrollmentRecord) => e.course_intake === cs?.course_intake);
        const link = enrollment ? `/dashboard/student/courses/${enrollment.id}/subjects/${subject?.id}` : "";

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
          link: c.zoom_link || link,
          rawStartTime: c.start_time,
          duration: c.duration,
        };
      });

      const assignmentEvents = assignments.map((a: PBAssignment) => {
        const cs = a.expand?.course_subject;
        const subject = cs?.expand?.subject;
        const course = cs?.expand?.course_intake?.expand?.course;
        
        // Find enrollment for this course_intake to build the link
        const enrollment = enrollmentRecords.find((e: EnrollmentRecord) => e.course_intake === cs?.course_intake);
        const link = enrollment ? `/dashboard/student/courses/${enrollment.id}/subjects/${subject?.id}?tab=assignments` : "";

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
          link: link,
        };
      });

      setCalendarEvents([...classEvents, ...assignmentEvents]);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setIsCalendarLoading(false);
    }
  }, [enrollments]);

  const fetchStudentData = React.useCallback(async (studentId: string) => {
    try {
      // Fetch enrollments via API endpoint for central state
      const token = pb.authStore.token;
      const response = await fetch("/api/student/enrollments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments);
        // Also trigger calendar fetch with these enrollments to be efficient
        fetchCalendarEvents(data.enrollments);
      }

      console.log("Fetching data for student:", studentId);
    } catch (error: unknown) {
      console.error("Error fetching student data:", error);
      // Handle permission errors by redirecting to login
      const err = error as { status?: number; message?: string };
      if (err?.status === 403 || err?.status === 404) {
        toast.error("Permission denied. Please log in again.");
        setLoading(false);
        await pb.authStore.clear();
        router.push("/login");
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [fetchCalendarEvents, router]);

  // Check account status on initial load
  useEffect(() => {
    const checkAccountStatus = async () => {
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      const currentUser = pb.authStore.model;
      if (!currentUser || currentUser.role !== "student") {
        router.push("/login");
        return;
      }

      // Refresh user auth to get latest account status from server
      try {
        await pb.collection("users").authRefresh();
      } catch (error) {
        console.error("Auth refresh failed:", error);
      }

      // Check account status from refreshed auth store
      const latestUser = pb.authStore.model;
      if (latestUser?.accountStatus === "disabled") {
        setLoading(false);
        setIsAccountDisabled(true);
        return;
      }

      if (!latestUser?.id) {
        router.push("/login");
        return;
      }

      setUser(latestUser as unknown as StudentUser);
      fetchStudentData(latestUser.id);
    };

    checkAccountStatus();
  }, [router, fetchStudentData]);

  // statsData was unused, removed.

  const [isPortalOpen, setIsPortalOpen] = React.useState(false);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const unreadCount = announcements.filter(
    (a: Announcement) => !a.isRead,
  ).length;

  const markAllAsRead = React.useCallback(() => {
    setAnnouncements(
      announcements.map((a: Announcement) => ({ ...a, isRead: true })),
    );
  }, [announcements]);

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

  // Show disabled account message first (before loading or other checks)
  if (isAccountDisabled) {
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
            onClick={async () => {
              await pb.authStore.clear();
              router.push("/login");
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
              fullName={user.name || "Student"}
              studentId={user.userId || "N/A"}
              role="STUDENT"
              avatarUrl={
                user.avatar
                  ? pb.files.getUrl(user, user.avatar)
                  : "/profile-img.jpg"
              }
              accountStatus={user.accountStatus || "Active"}
              advisorName={user.academicAdvisor || "Not Assigned"}
              advisorEmail="advisor@academix.edu"
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
            <Section5Schedules enrollments={enrollments} />
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
            <Calendar events={calendarEvents} />
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
                      What&apos;s <span className="text-indigo-600">New</span>
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
                          <Image
                            src={ann.imageUrl}
                            alt={ann.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
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
