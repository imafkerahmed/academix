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
      {/* Large stat card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalSubjects}
            </p>
            <p className="text-xs text-gray-500">Subjects</p>
          </div>
        </div>
      </div>

      {/* Assignments to mark */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-2">
          <CheckCircle size={18} className="text-orange-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {stats.assignmentsToMark}
        </p>
        <p className="text-xs text-gray-500">To Mark</p>
      </div>

      {/* Upcoming classes */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-2">
          <Clock size={18} className="text-green-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {stats.upcomingClasses}
        </p>
        <p className="text-xs text-gray-500">Classes</p>
      </div>

      {/* Intakes */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-2">
          <GraduationCap size={18} className="text-purple-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {stats.totalIntakes}
        </p>
        <p className="text-xs text-gray-500">Intakes</p>
      </div>

      {/* Courses */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-2">
          <Library size={18} className="text-indigo-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {stats.totalCourses}
        </p>
        <p className="text-xs text-gray-500">Courses</p>
      </div>
    </>
  );
}
