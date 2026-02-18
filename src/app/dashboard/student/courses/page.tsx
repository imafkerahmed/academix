"use client";

import React from "react";
import CourseList from "@/components/CourseList";
import { BookOpen, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

// Mock data (should strictly come from API/Context in real app)
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

export default function CoursesPage() {
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
        <CourseList courses={courses} />
      </motion.div>
    </motion.div>
  );
}
