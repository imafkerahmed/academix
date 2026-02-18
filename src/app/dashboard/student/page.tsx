"use client";

import React from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Calendar as CalendarIcon,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
} from "lucide-react";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import StudentProfile from "@/components/student-profile";
import Section5Schedules from "@/components/Schedules";
import Calendar from "@/components/Calendar";

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

export default function StudentDashboard() {
  const statsData = [
    {
      title: "Enrolled Courses",
      value: courses.length,
      icon: BookOpen,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: { value: "Active", isPositive: true },
    },
    {
      title: "Completed",
      value: courses.filter((c) => c.courseStatus === "Completed").length,
      icon: CheckCircle2,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      trend: { value: "Finished", isPositive: true },
    },
    {
      title: "In Progress",
      value: courses.filter((c) => c.courseStatus === "Ongoing").length,
      icon: Clock,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      trend: { value: "Ongoing", isPositive: true },
    },
    {
      title: "Certificates",
      value: courses.filter((c) => c.certificateStatus === "Issued").length,
      icon: GraduationCap,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      trend: { value: "Issued", isPositive: true },
    },
  ];

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
              fullName="Mohammed Inayathullah Afker Ahmed"
              studentId="REG-2024-XYZ"
              role="STUDENT"
              avatarUrl="/profile-img.jpg"
              accountStatus="Active"
              advisorName="Dr. Sarah Johnson"
              advisorEmail="sarah.johnson@academix.edu"
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
            <Section5Schedules />
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
            <Calendar />
          </div>
        </div>
      </div>
    </>
  );
}
