"use client";

import React, { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { UpcomingClass } from "./UpcomingClasses";
import pb from "@/lib/pocketbase";

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
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const [nowTimestamp, setNowTimestamp] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setNowTimestamp(Date.now());
      }, 0);
    }
  }, [isOpen]);

  const monthOptions = React.useMemo(() => {
    const monthMap = new Map<string, string>();

    classes.forEach((classItem) => {
      const date = new Date(classItem.rawStartTime || classItem.startTime);
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
      const date = new Date(classItem.rawStartTime || classItem.startTime);
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
      const date = new Date(classItem.rawStartTime || classItem.startTime);
      if (Number.isNaN(date.getTime())) return false;
      const itemYear = date.getFullYear();
      const itemMonthIndex = date.getMonth();
      const itemKey = `${itemYear}-${String(itemMonthIndex + 1).padStart(2, "0")}`;
      return itemKey === currentMonthKey;
    });

    const targetMonth = hasCurrentMonthClasses ? currentMonthKey : "";
    
    setTimeout(() => {
      setSelectedMonth(targetMonth);
    }, 0);
  }, [isOpen, classes]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after mount
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 0);
      return () => clearTimeout(timer);
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

  const getWeekdayLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { weekday: "short" });
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
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden mx-4 transition-transform transition-opacity duration-300 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
              Upcoming <span className="text-indigo-600">Classes</span>
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                All your upcoming activities
              </p>
              {monthOptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <select
                    value={selectedMonth}
                    onChange={(event) => {
                      setSelectedMonth(event.target.value);
                    }}
                    className="border-none bg-transparent text-[10px] font-black uppercase tracking-widest text-indigo-600 focus:outline-none cursor-pointer hover:text-indigo-700 transition-colors"
                  >
                    <option value="">All months</option>
                    {monthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all font-bold"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-gray-50/30 no-scrollbar">
          {filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 opacity-50">
              <Clock className="text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                No scheduled classes found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClasses.map((classItem) => {
                const isOngoing = classItem.status === "in_progress";
                const isCompleted = classItem.status === "completed";
                const startTimeStr =
                  classItem.rawStartTime || classItem.startTime;
                const scheduledEnd =
                  new Date(startTimeStr).getTime() + classItem.duration * 60000;
                const isWithinTimeWindow = nowTimestamp < scheduledEnd;
                const isReallyEnded = isCompleted && !isWithinTimeWindow;

                return (
                  <div
                    key={classItem.id}
                    className="bg-white rounded-[2.5rem] p-8 border border-gray-100 flex flex-col gap-6 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1 group w-full relative overflow-hidden min-w-0"
                  >
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] transition-transform duration-700 group-hover:scale-150 rounded-full -mr-16 -mt-16 bg-indigo-600`}
                    />

                    {isOngoing && (
                      <div className="absolute top-6 right-8 bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg z-10 animate-pulse">
                        Active Now
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
                      <div className="flex-1">
                        <h4 
                          className="font-black text-gray-900 text-xl tracking-tight group-hover:text-indigo-600 transition-colors uppercase leading-tight line-clamp-2"
                          title={classItem.classTitle}
                        >
                          {classItem.classTitle}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          {(() => {
                            let badgeLabel = classItem.status.toUpperCase();
                            let badgeColor = getStatusColor(classItem.status);

                            if (
                              classItem.status === "completed" &&
                              !isReallyEnded
                            ) {
                              badgeLabel = "ENDED EARLY";
                              badgeColor =
                                "border-amber-100 bg-amber-50 text-amber-700";
                            }

                            return (
                              <span
                                className={`text-[10px] px-3 py-1 rounded-xl border font-black uppercase tracking-widest ${badgeColor}`}
                              >
                                {badgeLabel}
                              </span>
                            );
                          })()}
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl uppercase tracking-widest">
                            {classItem.subjectName || "SUBJECT"}
                          </span>
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-xl uppercase tracking-widest">
                            {classItem.intakeName}
                          </span>
                          <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-3 py-1 rounded-xl uppercase tracking-widest">
                            {classItem.courseName}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isReallyEnded ? (
                          <span className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-400 text-xs font-black uppercase tracking-[0.1em] inline-block text-center border border-gray-100">
                            Class Ended
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleQuickJoin(classItem.id, classItem.status)
                            }
                            className={`px-6 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-[0.1em] shadow-xl transition-all hover:scale-105 active:scale-95 ${
                              isCompleted
                                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                            }`}
                          >
                            {isCompleted ? "Rejoin Session" : "Join Class"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 relative z-10 pt-4 border-t border-gray-50">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <Clock size={14} className="text-gray-300" />{" "}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
