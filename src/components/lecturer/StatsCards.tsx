"use client";

import React from "react";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
} from "lucide-react";

interface Stats {
  totalIntakes: number;
  totalCourses: number;
  totalSubjects: number;
  upcomingClasses: number;
  assignmentsToMark: number;
}

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Intakes",
      value: stats.totalIntakes,
      icon: GraduationCap,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      title: "Total Subjects",
      value: stats.totalSubjects,
      icon: FileText,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
    {
      title: "Upcoming Classes",
      value: stats.upcomingClasses,
      icon: Clock,
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      borderColor: "border-orange-200",
    },
    {
      title: "Assignments to Mark",
      value: stats.assignmentsToMark,
      icon: CheckCircle,
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} rounded-xl shadow-md p-6 border-2 ${card.borderColor} hover:shadow-lg transition-shadow flex items-center`}
          >
            <div className="flex items-center justify-center mr-5 flex-shrink-0">
              <IconComponent size={48} className={card.textColor} />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className={`text-5xl font-extrabold ${card.textColor}`}>
                {card.value}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-gray-800">
                {card.title}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
