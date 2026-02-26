import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  X,
  Clock,
  Calendar as CalendarIcon,
  BookOpen,
  Info,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Calendar, { mockEvents } from "@/components/Calendar";
// Badge color mapping (referenced from Calendar.tsx)
const typeBadge: Record<string, string> = {
  "Online Zoom Class": "bg-blue-100 text-blue-700 border-blue-200",
  "Physical Class": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Holiday: "bg-purple-100 text-purple-700 border-purple-200",
  Assignment: "bg-green-100 text-green-700 border-green-200",
};

interface EventType {
  id: number;
  title: string;
  topic?: string;
  type: string;
  date: string;
  startTime?: string;
  endTime?: string;
  platform?: string;
}

function getUpcomingSchedules(events: EventType[]): EventType[] {
  const today = new Date().toISOString().slice(0, 10);
  // Only future or today events
  return events
    .filter((e: EventType) => e.date >= today)
    .sort((a: EventType, b: EventType) => {
      // Today first, then by date ascending
      if (a.date === today && b.date !== today) return -1;
      if (b.date === today && a.date !== today) return 1;
      return a.date.localeCompare(b.date);
    });
}

export default function Section5Schedules() {
  const [modalOpen, setModalOpen] = useState(false);
  const upcoming = getUpcomingSchedules(mockEvents).slice(0, 2);
  const today = new Date().toISOString().slice(0, 10);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen]);

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      <div className="flex-1 overflow-y-auto mb-6 pr-2 -mr-2 no-scrollbar">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-40">
            <Clock className="text-gray-300 mb-2" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Stable Horizon: No upcoming tasks
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((ev: EventType, idx: number) => {
              const themeClass =
                ev.type === "Online Zoom Class"
                  ? "border-blue-100 bg-blue-50/20"
                  : ev.type === "Assignment"
                    ? "border-green-100 bg-green-50/20"
                    : "border-gray-100 bg-gray-50/20";
              const isToday = ev.date === today;

              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative p-5 rounded-[2rem] border transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-100/30 hover:-translate-y-1 ${isToday ? "border-indigo-200 bg-indigo-50/30 ring-2 ring-indigo-50/50" : themeClass}`}
                >
                  {isToday && (
                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg z-10">
                      Active Now
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-black text-gray-900 text-base tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase">
                          {ev.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-lg border font-black uppercase tracking-widest ${typeBadge[ev.type] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                          >
                            {ev.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon size={12} className="text-gray-300" />{" "}
                          {ev.date}
                        </span>
                        {ev.startTime && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-300" />{" "}
                            {ev.startTime}
                          </span>
                        )}
                      </div>

                      {ev.type === "Online Zoom Class" ? (
                        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-105 transition-all">
                          Schedule
                        </button>
                      ) : ev.type === "Assignment" ? (
                        <button className="px-4 py-2 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 hover:scale-105 transition-all">
                          View
                        </button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <button
        className="mt-auto group relative flex items-center justify-center gap-3 bg-indigo-600 text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-1 transition-all duration-300 uppercase tracking-tighter w-full overflow-hidden"
        onClick={() => setModalOpen(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <span className="relative z-10 flex items-center gap-2">
          VIEW ALL SCHEDULES <ArrowRight size={18} />
        </span>
      </button>
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
                    Academic <span className="text-indigo-600">Schedules</span>
                  </h2>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                    All your upcoming activities
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all font-bold"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-gray-50/30 no-scrollbar">
                {getUpcomingSchedules(mockEvents).length > 0 ? (
                  getUpcomingSchedules(mockEvents).map((ev: EventType) => {
                    const badgeClass =
                      typeBadge[ev.type] ||
                      "bg-gray-100 text-gray-700 border-gray-200";
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-8 border border-gray-100 flex flex-col gap-6 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1 group w-full relative overflow-hidden"
                      >
                        <div
                          className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] transition-transform duration-700 group-hover:scale-150 rounded-full -mr-16 -mt-16 ${ev.type === "Online Zoom Class" ? "bg-blue-600" : "bg-indigo-600"}`}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
                          <div className="flex-1">
                            <h4 className="font-black text-gray-900 text-xl tracking-tight group-hover:text-indigo-600 transition-colors uppercase leading-tight">
                              {ev.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-3">
                              <span
                                className={`text-[10px] px-3 py-1 rounded-xl border font-black uppercase tracking-widest ${badgeClass}`}
                              >
                                {ev.type}
                              </span>
                              {ev.topic && (
                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-xl uppercase tracking-widest">
                                  <Info size={12} /> {ev.topic}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex gap-3">
                            {ev.type === "Online Zoom Class" ? (
                              <button className="px-6 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">
                                Schedule
                              </button>
                            ) : ev.type === "Assignment" ? (
                              <button className="px-6 py-3 rounded-2xl bg-green-600 text-white text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-green-100 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all">
                                View
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 relative z-10 pt-2 border-t border-gray-50">
                          <span className="flex items-center gap-2">
                            <CalendarIcon size={14} className="text-gray-300" />{" "}
                            {ev.date}
                          </span>
                          {ev.startTime && (
                            <span className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-300" />{" "}
                              {ev.startTime} - {ev.endTime}
                            </span>
                          )}
                          {ev.platform && (
                            <span className="flex items-center gap-2">
                              <BookOpen size={14} className="text-gray-300" />{" "}
                              {ev.platform}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 opacity-50">
                    <Clock className="text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                      No upcoming schedules found
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
