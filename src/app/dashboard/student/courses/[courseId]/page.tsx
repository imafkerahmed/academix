"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RouteLink } from "@/components/ui/route-link";
import StudentBreadcrumbs from "@/components/student/StudentBreadcrumbs";
import pb from "@/lib/pocketbase";
import { Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = (params?.courseId as string) || "";
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [activeSemester, setActiveSemester] = useState(0);
  const [disabledSemesters, setDisabledSemesters] = useState<string[]>([]);
  const [disabledSubjects, setDisabledSubjects] = useState<string[]>([]);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  useEffect(() => {
    const currentUser = pb.authStore.model;
    if (!currentUser || currentUser.role !== "student") {
      router.push("/login");
      return;
    }

    // Check if account is disabled
    if (currentUser.accountStatus === "disabled") {
      setIsAccountDisabled(true);
      return;
    }

    fetchCourseData();
  }, [courseId, router]);

  // Periodic check for account status changes (every 30 seconds)
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const currentUser = pb.authStore.model;
      if (!currentUser) return;

      try {
        // Refresh auth to get latest account status
        await pb.collection("users").authRefresh();
        const latestUser = pb.authStore.model;

        if (latestUser && latestUser.accountStatus === "disabled") {
          setIsAccountDisabled(true);
        }
      } catch (error) {
        // Silently handle errors - user may be logged out
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchCourseData = async () => {
    try {
      // Fetch enrollment by ID with expanded relations
      const enrollment = await pb
        .collection("enrollments")
        .getOne(courseId, {
          expand: "course_intake.course,course_intake.intake",
        })
        .catch(() => null);

      if (!enrollment) {
        setLoading(false);
        return;
      }

      const courseIntake = enrollment.expand?.course_intake;
      const course = courseIntake?.expand?.course;
      const intake = courseIntake?.expand?.intake;

      // Fetch course subjects for this course_intake
      let semesters: any[] = [];
      if (courseIntake?.id) {
        const courseSubjects = await pb
          .collection("course_subjects")
          .getFullList({
            filter: `course_intake="${courseIntake.id}"`,
            expand: "subject,lecturer",
          });

        // Group subjects by semester
        const semesterGroups: Record<string, any[]> = {};

        if (courseIntake.is_semester_based && courseIntake.semester_count) {
          // Initialize semesters
          for (let i = 1; i <= courseIntake.semester_count; i++) {
            semesterGroups[`Semester ${i}`] = [];
          }
        } else {
          semesterGroups["All Subjects"] = [];
        }

        courseSubjects.forEach((cs: any) => {
          const subjectData = cs.expand?.subject;
          const lecturerData = cs.expand?.lecturer;

          // Handle both single subject and array of subjects
          const subjects = Array.isArray(subjectData)
            ? subjectData
            : subjectData
              ? [subjectData]
              : [];

          subjects.forEach((subject: any) => {
            const subjectEntry = {
              id: subject.id,
              name: subject.name,
              code: subject.code,
              instructor:
                lecturerData?.name || lecturerData?.full_name || "TBA",
              progress: 0, // Progress tracking not implemented yet
            };

            const semesterKey = cs.semester || "All Subjects";
            if (!semesterGroups[semesterKey]) {
              semesterGroups[semesterKey] = [];
            }
            semesterGroups[semesterKey].push(subjectEntry);
          });
        });

        // Convert to array format expected by UI
        semesters = Object.entries(semesterGroups)
          .filter(([_, subjects]) => subjects.length > 0)
          .map(([name, subjects], index) => ({
            id: `sem-${index + 1}`,
            name,
            status: "Ongoing",
            subjects,
          }));
      }

      // Map enrollment status
      const statusMap: Record<string, string> = {
        enrolled: "Ongoing",
        "dropped-out": "Dropped Out",
        expelled: "Expelled",
        completed: "Completed",
      };
      const courseStatus =
        statusMap[enrollment.enrollement_status || "enrolled"] || "Ongoing";

      // Map certificate status
      const certMap: Record<string, string> = {
        pending: "Pending",
        applied: "Applied",
        delivered: "Issued",
      };
      const certificateStatus =
        certMap[enrollment.certificate_status || "pending"] || "Not Issued";

      setCourse({
        id: enrollment.id,
        name: course?.name || "Unknown Course",
        registrationNumber: enrollment.registration_number || "",
        description: course?.description || "",
        courseStatus,
        certificateStatus,
        intakeCode: intake?.code || "",
        startDate:
          courseIntake?.start_date ||
          enrollment.enrollment_date ||
          enrollment.created,
        endDate: courseIntake?.end_date || "",
        semesters,
      });
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load disabled states from localStorage
  React.useEffect(() => {
    const savedSemesters = localStorage.getItem(
      `disabled_semesters_${courseId}`,
    );
    if (savedSemesters) {
      setDisabledSemesters(JSON.parse(savedSemesters));
    }
    const savedSubjects = localStorage.getItem(`disabled_subjects_${courseId}`);
    if (savedSubjects) {
      setDisabledSubjects(JSON.parse(savedSubjects));
    }
  }, [courseId]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation durations (ms)
  const OPEN_DURATION = 900;
  const CLOSE_DURATION = 1500;

  // Handle animation mount/unmount
  React.useEffect(() => {
    if (showNotifications) {
      setDrawerVisible(true);
      // Small delay to ensure the drawer is mounted before animation starts
      const animationTimeout = setTimeout(() => {
        // This forces a reflow, allowing the animation to play
      }, 10);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return () => clearTimeout(animationTimeout);
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

  // Show disabled account message if account is disabled (BEFORE loading check)
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

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Course Not Found
          </h1>
          <button
            onClick={() => router.push("/dashboard/student/courses")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentBreadcrumbs
        items={[
          { label: "Courses", href: "/dashboard/student/courses" },
          { label: course.name },
        ]}
      />

      {/* Header Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50 shrink-0">
            <span className="font-black text-2xl">{course.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              {course.name}
            </h1>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-indigo-50 text-indigo-600 border-none rounded-lg px-2 py-0.5"
              >
                {course.registrationNumber}
              </Badge>
              <span>•</span>
              {course.intakeCode}
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-start">
          <Badge
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none ${
              course.courseStatus.toLowerCase() === "ongoing"
                ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                : "bg-green-100 text-green-700 hover:bg-green-100"
            }`}
          >
            {course.courseStatus}
          </Badge>

          <Badge
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none ${
              course.certificateStatus.toLowerCase() === "issued"
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
                : "bg-gray-100 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {course.certificateStatus}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 flex flex-col gap-2 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Start Date
          </h3>
          <p className="text-lg font-bold text-gray-900">
            {new Date(course.startDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 flex flex-col gap-2 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            End Date
          </h3>
          <p className="text-lg font-bold text-gray-900">
            {new Date(course.endDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 flex flex-col gap-2 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Intake
          </h3>
          <p className="text-lg font-bold text-gray-900">{course.intakeCode}</p>
        </div>
      </div>

      {course.description && (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
            Course Description
          </h3>
          <p className="text-gray-600 leading-relaxed">{course.description}</p>
        </div>
      )}

      {/* Subjects Section */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6 flex items-center gap-2">
          Enrolled <span className="text-indigo-600">Subjects</span>
        </h2>

        {/* Semester Tabs */}
        {course.semesters && course.semesters.length > 0 && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {course.semesters
              .filter((s) => !disabledSemesters.includes(s.name))
              .map((semester, index) => {
                const displayIndex = course.semesters
                  .filter((s) => !disabledSemesters.includes(s.name))
                  .indexOf(semester);

                return (
                  <button
                    key={semester.id}
                    onClick={() => setActiveSemester(displayIndex)}
                    className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
                      activeSemester === displayIndex
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "bg-white text-gray-500 border border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{semester.name}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                          activeSemester === displayIndex
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {semester.status}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        )}

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {course.semesters
            .filter((s) => !disabledSemesters.includes(s.name))
            [activeSemester]?.subjects?.filter(
              (subject) => !disabledSubjects.includes(subject.code),
            )
            ?.map((subject) => (
              <RouteLink
                key={subject.id}
                href={`/dashboard/student/courses/${courseId}/subjects/${subject.id}`}
                className="block group h-full"
              >
                <Card className="h-full border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2.5rem] overflow-hidden bg-white group-hover:border-indigo-100">
                  <CardHeader className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <span className="font-black text-lg">
                          {subject.name.charAt(0)}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase tracking-widest border-indigo-100 text-indigo-400 bg-indigo-50/50"
                      >
                        {subject.code}
                      </Badge>
                    </div>

                    <CardTitle className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2">
                      {subject.name}
                    </CardTitle>

                    <CardDescription className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <svg
                          className="w-4 h-4 text-indigo-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>{subject.instructor}</span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                          <span>Completion</span>
                          <span className="text-indigo-600">
                            {subject.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                              subject.progress === 100
                                ? "bg-green-500"
                                : "bg-indigo-600"
                            }`}
                            style={{ width: `${subject.progress}%` }}
                          />
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </RouteLink>
            ))}
        </div>
      </div>
    </div>
  );
}
