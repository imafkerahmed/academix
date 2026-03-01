"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CourseList from "@/components/CourseList";
import { BookOpen, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import pb from "@/lib/pocketbase";

export default function CoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = pb.authStore.model;
    if (!currentUser || currentUser.role !== "student") {
      router.push("/login");
      return;
    }

    fetchCourses(currentUser.id);
  }, [router]);

  const fetchCourses = async (studentId: string) => {
    try {
      // Fetch enrollments for this student
      const enrollmentRecords = await pb
        .collection("enrollments")
        .getFullList({
          filter: `student = "${studentId}"`,
        })
        .catch(() => []);

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
    } catch (error) {
      console.error("Error fetching courses:", error);
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
