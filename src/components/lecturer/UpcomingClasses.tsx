"use client";

import React from "react";
import { Clock, Timer } from "lucide-react";

export interface UpcomingClass {
  id: string;
  intakeName: string;
  courseName: string;
  classTitle: string;
  startTime: string;
  duration: number;
  status: "scheduled" | "ongoing" | "completed";
  zoomJoinUrl: string;
}

interface UpcomingClassesProps {
  classes: UpcomingClass[];
  onViewAll?: () => void;
}

export default function UpcomingClasses({
  classes,
  onViewAll,
}: UpcomingClassesProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "ongoing":
        return "bg-green-100 text-green-700 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleQuickJoin = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Upcoming Classes (Next 7 Days)
          </h2>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All
            </button>
          )}
        </div>
        <div className="text-center py-6 text-gray-500 text-sm">
          <p>No upcoming classes scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">
          Upcoming Classes (Next 7 Days)
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            View All
          </button>
        )}
      </div>
      <div className="space-y-3">
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-1 rounded border font-semibold ${getStatusColor(classItem.status)}`}
                  >
                    {classItem.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-base text-gray-800 mb-1">
                  {classItem.classTitle}
                </h3>
                <p className="text-xs text-gray-600 mb-1">
                  <span className="font-semibold">Intake:</span>{" "}
                  {classItem.intakeName} →{" "}
                  <span className="font-semibold">Course:</span>{" "}
                  {classItem.courseName}
                </p>
                <div className="text-xs text-gray-500 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {classItem.startTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer size={14} />
                    {classItem.duration} min
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickJoin(classItem.zoomJoinUrl)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  aria-label={`Join ${classItem.classTitle}`}
                >
                  Quick Join
                </button>
                <button
                  onClick={() => console.log("Details:", classItem.id)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                  aria-label={`View details for ${classItem.classTitle}`}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
