"use client";

import React, { useState, useEffect } from "react";
import { Clock, Timer, Calendar as CalendarIcon } from "lucide-react";
import { UpcomingClass } from "./UpcomingClasses";
import { ModernModal } from "@/components/ui/modern-modal";

interface AllSchedulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: UpcomingClass[];
}

export default function AllSchedulesModal({
  isOpen,
  onClose,
  classes,
}: AllSchedulesModalProps) {
  const [selectedDay, setSelectedDay] = useState<string>("");

  const dayOptions = React.useMemo(() => {
    const days = new Map<string, string>();
    classes.forEach((classItem) => {
      const date = new Date(classItem.startTime);
      if (Number.isNaN(date.getTime())) return;
      const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (!days.has(dayKey)) days.set(dayKey, label);
    });
    return Array.from(days.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [classes]);

  const filteredClasses = React.useMemo(() => {
    if (!selectedDay) return [];
    return classes.filter((classItem) => {
      const date = new Date(classItem.startTime);
      if (Number.isNaN(date.getTime())) return false;
      const dayKey = date.toISOString().slice(0, 10);
      return dayKey === selectedDay;
    });
  }, [classes, selectedDay]);

  // When the modal opens, default to today if available, otherwise first available day
  useEffect(() => {
    if (!isOpen || classes.length === 0) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    if (dayOptions.find((d) => d.value === todayKey)) {
      setSelectedDay(todayKey);
      return;
    }
    if (dayOptions.length > 0) setSelectedDay(dayOptions[0].value);
  }, [isOpen, classes, dayOptions]);

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

  const getWeekdayLabel = (startTime: string) => {
    const date = new Date(startTime);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const handleQuickJoin = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <ModernModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="All Scheduled Classes"
      subtitle={
        selectedDay
          ? `Showing: ${dayOptions.find((d) => d.value === selectedDay)?.label ?? selectedDay}`
          : "View upcoming schedules"
      }
    >
      <div className="space-y-4">
        {/* Day Selector */}
        {dayOptions.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon size={16} className="text-gray-400" />
            <select
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] -mx-1 px-1">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <p className="font-medium">No scheduled classes found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wider ${getStatusColor(classItem.status)}`}
                        >
                          {classItem.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {classItem.classTitle}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-widest text-indigo-100">
                          Intake
                        </span>{" "}
                        {classItem.intakeName} &nbsp;•&nbsp;
                        <span className="font-semibold text-gray-400 uppercase text-[10px] tracking-widest text-indigo-100">
                          Course
                        </span>{" "}
                        {classItem.courseName}
                      </p>
                      <div className="text-sm text-gray-500 mt-3 flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                          <Clock size={14} className="text-blue-500" />
                          <span className="font-bold text-gray-700">
                            {getWeekdayLabel(classItem.startTime)}
                          </span>
                          <span className="text-gray-400">
                            {new Date(classItem.startTime).toLocaleString()}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                          <Timer size={14} className="text-amber-500" />
                          <span className="font-bold text-gray-700">
                            {classItem.duration} min
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {classItem.zoomJoinUrl ? (
                        <button
                          onClick={() => handleQuickJoin(classItem.zoomJoinUrl)}
                          className="w-full md:w-auto px-6 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 active:scale-95"
                        >
                          Quick Join
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModernModal>
  );
}
