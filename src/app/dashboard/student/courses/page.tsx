"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CourseList from "@/components/CourseList";
import { BookOpen, TrendingUp, Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

export default function CoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  useEffect(() => {
    const checkAccountStatus = async () => {
      const currentUser = pb.authStore.model;
      if (!currentUser || currentUser.role !== "student") {
        router.push("/login");
        return;
      }

      // Refresh user auth to get latest account status from server
      try {
        await pb.collection("users").authRefresh();
      } catch (error) {
        console.log("Auth refresh failed:", error);
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

      fetchCourses(latestUser.id);
    };

    checkAccountStatus();
  }, [router]);

  const fetchCourses = async (studentId: string) => {
    try {
      // Fetch enrollments via API endpoint
      const token = pb.authStore.token;
      const response = await fetch("/api/student/enrollments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw { status: response.status, message: response.statusText };
      }

      const data = await response.json();
      const enrollmentRecords = data.enrollments;

      // Transform enrollments into course format
      const courseList = enrollmentRecords.map(
        (enrollment: any, index: number) => ({
          id: enrollment.id,
          name: `Course ${index + 1}`,
          registrationNumber: enrollment.id.substring(0, 15).toUpperCase(),
          description: "",
          courseStatus:
            enrollment.status === "completed" ? "Completed" : "Ongoing",
          certificateStatus: "Not Issued",
        }),
      );

      setCourses(courseList);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      // Handle permission errors by redirecting to login
      if (error?.status === 403 || error?.status === 404) {
        toast.error("Permission denied. Please log in again.");
        setLoading(false);
        await pb.authStore.clear();
        router.push("/login");
        return;
      }
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Show disabled account message if account is disabled
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 shadow-indigo-100/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50"
            >
              <BookOpen size={32} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                My <span className="text-indigo-600">Courses</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <TrendingUp size={14} className="text-indigo-400" />
                Enrolled Academic Programs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-indigo-600 font-bold text-sm tracking-tight">
                {courses.length} Active Courses
              </span>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 shadow-indigo-100/10"
      >
        {courses.length > 0 ? (
          <CourseList courses={courses} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
              No courses found
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
