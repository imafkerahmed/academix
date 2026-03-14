"use client";

import React from "react";
import { Clock, Timer } from "lucide-react";
import pb from "@/lib/pocketbase";
import { useRouter } from "next/navigation";

export interface UpcomingClass {
  id: string;
  intakeName: string;
  courseName: string;
  subjectName?: string;
  classTitle: string;
  startTime: string; // ISO string or displayable date/time
  rawStartTime?: string;
  duration: number; // minutes
  status: "scheduled" | "in_progress" | "completed";
  isMerged?: boolean;
}

interface UpcomingClassesProps {
  classes: UpcomingClass[];
}

export default function UpcomingClasses({ classes }: UpcomingClassesProps) {
  const router = useRouter();
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
        return "bg-green-100 text-green-700 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleQuickJoin = async (id: string, status: string) => {
    if (status === "completed") {
      try {
        await pb.collection("classes").update(id, {
          status: "scheduled",
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        /* silent */
      }
    }
    router.push(`/dashboard/classroom/${id}?role=host`);
  };

  if (classes.length === 0) {
    return (
      <div className="text-center py-10 opacity-40">
        <Clock className="text-gray-300 mb-2 mx-auto" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          No upcoming classes scheduled
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
      <div className="space-y-4">
        {classes.map((classItem) => {
          const isOngoing = classItem.status === "in_progress";
          const themeClass = isOngoing
            ? "border-indigo-200 bg-indigo-50/30 ring-2 ring-indigo-50/50"
            : "border-gray-100 bg-gray-50/20";

          return (
            <div
              key={classItem.id}
              className={`relative p-5 rounded-[2rem] border transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-100/30 hover:-translate-y-1 ${themeClass}`}
            >
              {isOngoing && (
                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg z-10 animate-pulse">
                  Active Now
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-black text-gray-900 text-base tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase">
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
                          classItem.status === "completed" &&
                          isWithinTimeWindow;

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
                      <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                        {classItem.subjectName || "SUBJECT"}
                      </span>
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg">
                        {classItem.intakeName}
                      </span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {classItem.courseName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <Clock size={12} className="text-gray-300" />{" "}
                      {getWeekdayLabel(
                        classItem.rawStartTime || classItem.startTime,
                      )}{" "}
                      • {classItem.startTime} -{" "}
                      {new Date(
                        new Date(
                          classItem.rawStartTime || classItem.startTime,
                        ).getTime() +
                          classItem.duration * 60000,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {(() => {
                    const isCompleted = classItem.status === "completed";
                    const startTimeStr =
                      classItem.rawStartTime || classItem.startTime;
                    const scheduledEnd =
                      new Date(startTimeStr).getTime() +
                      classItem.duration * 60000;
                    const isWithinTimeWindow = Date.now() < scheduledEnd;
                    const isReallyEnded = isCompleted && !isWithinTimeWindow;

                    if (isReallyEnded) {
                      return (
                        <span className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                          Class Ended
                        </span>
                      );
                    }

                    return (
                      <button
                        onClick={() =>
                          handleQuickJoin(classItem.id, classItem.status)
                        }
                        className={`px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105 ${
                          isCompleted
                            ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                            : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                        }`}
                      >
                        {isCompleted ? "Rejoin" : "Quick Join"}
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
