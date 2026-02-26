"use client";

import React from "react";
import { GraduationCap, TrendingUp, Layout } from "lucide-react";
import IntakesTree, { type Intake } from "@/components/lecturer/IntakesTree";

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

export default function IntakesPage() {
  return (
    <>
      {/* Page Header Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <GraduationCap size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              My <span className="text-indigo-600">Intakes</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-400" />
              Managed Academic Terms & Courses
            </p>
          </div>
        </div>
      </div>
      <IntakesTree intakes={mockIntakes} />
    </>
  );
}
