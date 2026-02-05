"use client";

import React from "react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  Library,
} from "lucide-react";

interface BentoStatsProps {
  stats: {
    totalIntakes: number;
    totalCourses: number;
    totalSubjects: number;
    upcomingClasses: number;
    assignmentsToMark: number;
  };
}

export default function BentoStats({ stats }: BentoStatsProps) {
  return (
    <>
      {/* Subjects */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow flex items-center justify-between">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
          <BookOpen size={26} className="text-blue-600" />
        </div>
        <div className="flex flex-col items-end text-right">
          <p className="text-4xl font-extrabold text-gray-900 leading-tight">
            {stats.totalSubjects}
          </p>
          <p className="text-base font-medium text-gray-500">Subjects</p>
        </div>
      </div>

      {/* Assignments to mark */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow flex items-center justify-between">
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
          <CheckCircle size={26} className="text-orange-600" />
        </div>
        <div className="flex flex-col items-end text-right">
          <p className="text-4xl font-extrabold text-gray-900 leading-tight">
            {stats.assignmentsToMark}
          </p>
          <p className="text-base font-medium text-gray-500">To Mark</p>
        </div>
      </div>

      {/* Upcoming classes */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow flex items-center justify-between">
        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
          <Clock size={26} className="text-green-600" />
        </div>
        <div className="flex flex-col items-end text-right">
          <p className="text-4xl font-extrabold text-gray-900 leading-tight">
            {stats.upcomingClasses}
          </p>
          <p className="text-base font-medium text-gray-500">Classes</p>
        </div>
      </div>
    </>
  );
}
