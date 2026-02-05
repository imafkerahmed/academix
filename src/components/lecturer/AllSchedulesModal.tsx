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

  const handleQuickJoin = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-white/10 backdrop-blur-sm transition-all duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden mx-4 transition-all duration-300 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All Scheduled Classes
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {classes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No scheduled classes found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((classItem) => (
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
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        aria-label={`Join ${classItem.classTitle}`}
                      >
                        Quick Join
                      </button>
                      <button
                        onClick={() => console.log("Details:", classItem.id)}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                        aria-label={`View details for ${classItem.classTitle}`}
                      >
                        Details
                      </button>
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
