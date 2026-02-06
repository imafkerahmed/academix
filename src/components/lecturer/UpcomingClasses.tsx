"use client";

import React from "react";
import { Clock, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface UpcomingClass {
  id: string;
  intakeName: string;
  courseName: string;
  classTitle: string;
  startTime: string; // ISO string or displayable date/time
  duration: number; // minutes
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
  const [selectedClass, setSelectedClass] =
    React.useState<UpcomingClass | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const getWeekdayLabel = (startTime: string) => {
    const date = new Date(startTime);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { weekday: "short" });
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

  const openDetails = (classItem: UpcomingClass) => {
    setSelectedClass(classItem);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setSelectedClass(null);
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
    <>
      <div className="bg-white rounded-lg shadow-sm p-3 lg:p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900">
            Upcoming Classes
          </h2>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All
            </button>
          )}
        </div>

        <div className="space-y-3 lg:space-y-4">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetails(classItem)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openDetails(classItem);
                }
              }}
              className="w-full cursor-pointer border border-gray-200 rounded-lg p-3 lg:p-4 hover:shadow-md hover:border-blue-200 transition-shadow transition-colors bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 lg:gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-1 rounded border font-semibold ${getStatusColor(classItem.status)}`}
                    >
                      {classItem.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base lg:text-lg text-gray-800 mb-1">
                    {classItem.classTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Intake:</span>{" "}
                    {classItem.intakeName} •{" "}
                    <span className="font-semibold">Course:</span>{" "}
                    {classItem.courseName}
                  </p>
                  <div className="text-xs lg:text-sm text-gray-500 flex flex-wrap items-center gap-3 lg:gap-4">
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

                <div className="mt-3 md:mt-0 flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickJoin(classItem.zoomJoinUrl);
                    }}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
                    aria-label={`Join ${classItem.classTitle}`}
                  >
                    Quick Join
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          {selectedClass && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedClass.classTitle}</DialogTitle>
                <DialogDescription>
                  {selectedClass.intakeName} • {selectedClass.courseName}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  {selectedClass.status.toUpperCase()}
                </p>
                <p className="flex items-center gap-1">
                  <Clock size={14} />
                  <span className="font-medium text-gray-800">
                    {getWeekdayLabel(selectedClass.startTime)}
                  </span>
                  <span>• {selectedClass.startTime}</span>
                </p>
                <p className="flex items-center gap-1">
                  <Timer size={14} /> {selectedClass.duration} min
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleQuickJoin(selectedClass.zoomJoinUrl)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Join Class
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
