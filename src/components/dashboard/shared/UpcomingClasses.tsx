"use client";

import React from "react";
import { Clock } from "lucide-react";

export interface UpcomingClass {
  id: string;
  intakeName: string;
  courseName: string;
  subjectName?: string;
  classTitle: string;
  startTime: string; // ISO string or displayable date/time
  rawStartTime?: string;
  duration: number; // minutes
  status: "scheduled" | "in_progress" | "ongoing" | "completed";
  isMerged?: boolean;
  zoomJoinUrl?: string; // Specific to Admin flow
}

interface UpcomingClassesProps {
  classes: UpcomingClass[];
  onQuickJoin?: (id: string, url?: string, status?: string) => void;
  onViewAll?: () => void;
  role?: "admin" | "lecturer";
}

export function UpcomingClasses({
  classes,
  onQuickJoin,
  onViewAll,
  role = "admin",
}: UpcomingClassesProps) {
  const getWeekdayLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress":
      case "ongoing":
        return "bg-green-100 text-green-700 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-gray-100 text-center">
        <Clock className="text-gray-300 mb-2 mx-auto" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          No upcoming classes scheduled
        </p>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition"
          >
            VIEW FULL SCHEDULE
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-sm p-4 lg:p-6 border border-gray-100 flex flex-col max-h-[500px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-base lg:text-lg font-black text-gray-900 tracking-tighter uppercase">
          Upcoming Classes
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition"
          >
            VIEW ALL
          </button>
        )}
      </div>

      <div className="overflow-y-auto pr-2 custom-scrollbar space-y-4 flex-1">
        {classes.map((classItem) => {
          const isOngoing = classItem.status === "in_progress" || classItem.status === "ongoing";
          const isCompleted = classItem.status === "completed";
          const themeClass = isOngoing
            ? "border-indigo-200 bg-indigo-50/30 ring-2 ring-indigo-50/50"
            : "border-gray-100 bg-gray-50/20";

          return (
            <div
              key={classItem.id}
              className={`relative p-5 rounded-[2rem] border transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-100/30 hover:-translate-y-1 ${themeClass} min-w-0 flex-1`}
            >
              {isOngoing && (
                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg z-10 animate-pulse">
                  Active Now
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4
                      className="font-black text-gray-900 text-base tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase line-clamp-2"
                      title={classItem.classTitle}
                    >
                      {classItem.classTitle}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {(() => {
                        const startTimeStr =
                          classItem.rawStartTime || classItem.startTime;
                        const scheduledEnd =
                          new Date(startTimeStr).getTime() +
                          classItem.duration * 60000;
                        const isWithinTimeWindow = Date.now() < scheduledEnd;
                        const isEndedEarly =
                          classItem.status === "completed" && isWithinTimeWindow;

                        let badgeLabel = classItem.status.toUpperCase();
                        let badgeColor = getStatusColor(classItem.status);

                        if (isEndedEarly) {
                          badgeLabel = "ENDED EARLY";
                          badgeColor =
                            "border-amber-100 bg-amber-50 text-amber-700";
                        }

                        return (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-lg border font-black uppercase tracking-widest ${badgeColor}`}
                          >
                            {badgeLabel}
                          </span>
                        );
                      })()}
                      {classItem.isMerged && (
                        <span className="text-[9px] px-2 py-0.5 rounded-lg border border-purple-100 bg-purple-50 text-purple-700 font-black uppercase tracking-widest animate-pulse">
                          Merged Session
                        </span>
                      )}
                      {classItem.subjectName && (
                        <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                          {classItem.subjectName}
                        </span>
                      )}
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg">
                        {classItem.intakeName}
                      </span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline-block">
                        {classItem.courseName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100/50">
                  <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <Clock size={12} className="text-gray-300" />{" "}
                      {getWeekdayLabel(
                        classItem.rawStartTime || classItem.startTime
                      )}{" "}
                      • {classItem.startTime} -{" "}
                      {new Date(
                        new Date(
                          classItem.rawStartTime || classItem.startTime
                        ).getTime() +
                          classItem.duration * 60000
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {(() => {
                    const startTimeStr =
                      classItem.rawStartTime || classItem.startTime;
                    const scheduledEnd =
                      new Date(startTimeStr).getTime() +
                      classItem.duration * 60000;
                    const isWithinTimeWindow = Date.now() < scheduledEnd;
                    const isReallyEnded = isCompleted && !isWithinTimeWindow;

                    // Display 'Class Ended' if it's past the time window
                    if (isReallyEnded) {
                      return (
                        <span className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest inline-block text-center border border-gray-100">
                          Class Ended
                        </span>
                      );
                    }

                    // For lecturers, they might rejoin early-ended sessions
                    // For admins, they might just have a zoom JoinLink
                    if (role === "admin" && !classItem.zoomJoinUrl) {
                      return null;
                    }

                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onQuickJoin) {
                            onQuickJoin(classItem.id, classItem.zoomJoinUrl, classItem.status);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105 ${
                          isCompleted
                            ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                            : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                        }`}
                      >
                        {isCompleted && role === "lecturer" ? "Rejoin" : "Quick Join"}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
