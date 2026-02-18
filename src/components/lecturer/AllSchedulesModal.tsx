"use client";

import React, { useState, useEffect } from "react";
import { X, Clock, Timer } from "lucide-react";
import { UpcomingClass } from "./UpcomingClasses";

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const monthOptions = React.useMemo(() => {
    const monthMap = new Map<string, string>();

    classes.forEach((classItem) => {
      const date = new Date(classItem.startTime);
      if (Number.isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, monthLabel);
      }
    });

    return Array.from(monthMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => (a.value < b.value ? -1 : 1));
  }, [classes]);

  const filteredClasses = React.useMemo(() => {
    if (!selectedMonth) return classes;

    return classes.filter((classItem) => {
      const date = new Date(classItem.startTime);
      if (Number.isNaN(date.getTime())) return false;

      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

      return monthKey === selectedMonth;
    });
  }, [classes, selectedMonth]);

  // When the modal opens, default the filter to the current month
  useEffect(() => {
    if (!isOpen || classes.length === 0) return;

    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const currentMonthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

    const hasCurrentMonthClasses = classes.some((classItem) => {
      const date = new Date(classItem.startTime);
      if (Number.isNaN(date.getTime())) return false;
      const itemYear = date.getFullYear();
      const itemMonthIndex = date.getMonth();
      const itemKey = `${itemYear}-${String(itemMonthIndex + 1).padStart(2, "0")}`;
      return itemKey === currentMonthKey;
    });

    setSelectedMonth(hasCurrentMonthClasses ? currentMonthKey : "");
  }, [isOpen, classes]);

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after mount
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

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

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden mx-4 transition-transform transition-opacity duration-300 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 p-4 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              All Scheduled Classes
            </h2>
            {selectedMonth && (
              <p className="text-xs text-gray-500 mt-1">
                Filtering by:{" "}
                {monthOptions.find((m) => m.value === selectedMonth)?.label ??
                  selectedMonth}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {monthOptions.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(event) => {
                  setSelectedMonth(event.target.value);
                }}
                className="border border-gray-300 rounded-md text-sm px-2 py-1 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All months</option>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No scheduled classes found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-1 rounded border font-semibold ${getStatusColor(classItem.status)}`}
                        >
                          {classItem.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base text-gray-800 mb-1">
                        {classItem.classTitle}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold">Intake:</span>{" "}
                        {classItem.intakeName} →{" "}
                        <span className="font-semibold">Course:</span>{" "}
                        {classItem.courseName}
                      </p>
                      <div className="text-sm text-gray-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          <span className="font-medium text-gray-800">
                            {getWeekdayLabel(classItem.startTime)}
                          </span>
                          <span>• {classItem.startTime}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer size={14} />
                          {classItem.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {classItem.zoomJoinUrl ? (
                        <button
                          onClick={(event) => {
                            handleQuickJoin(classItem.zoomJoinUrl);
                          }}
                          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                          aria-label={`Join ${classItem.classTitle}`}
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
    </div>
  );
}
