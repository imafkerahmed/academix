"use client";

import React from "react";
import CourseList from "@/components/CourseList";
import { BookOpen, TrendingUp } from "lucide-react";

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
    <>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <BookOpen size={40} />
          </div>
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
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
        <CourseList courses={courses} />
      </div>
    </>
  );
}
