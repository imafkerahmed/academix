"use client";
import dynamic from "next/dynamic";
const AnimatedList = dynamic(() => import("@/components/ui/AnimatedList"), {
  ssr: false,
});
// Badge color mapping (referenced from Calendar.tsx)
const typeBadge: Record<string, string> = {
  "Online Zoom Class": "bg-blue-100 text-blue-700 border-blue-200",
  "Physical Class": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Holiday: "bg-purple-100 text-purple-700 border-purple-200",
  Assignment: "bg-green-100 text-green-700 border-green-200",
};
import React, { useState, useEffect } from "react";
import Calendar, { mockEvents } from "@/components/Calendar";

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
      <h2 className="text-xl font-semibold mb-4">Upcoming Schedules</h2>
      <div className="flex-1 overflow-y-auto mb-4">
        {upcoming.length === 0 ? (
          <div className="text-gray-400">No upcoming schedules.</div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((ev: EventType) => (
              <li
                key={ev.id}
                className={`p-3 rounded-lg border flex flex-col ${ev.date === today ? "bg-indigo-50 border-indigo-400" : "bg-gray-50 border-gray-200"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base">{ev.title}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded border ml-2 font-semibold ${typeBadge[ev.type] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                  >
                    {ev.type}
                  </span>
                </div>
                {ev.topic && (
                  <div className="text-sm text-blue-600 mt-1">{ev.topic}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {ev.date} {ev.startTime && `| ${ev.startTime}`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        className="mt-auto px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        onClick={() => setModalOpen(true)}
      >
        VIEW ALL SCHEDULES
      </button>
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl relative transition-transform duration-300 scale-100 animate-zoomIn"
            style={{ minHeight: "340px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4 uppercase">
              ALL UPCOMING SCHEDULES
            </h3>
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              <AnimatedList
                items={getUpcomingSchedules(mockEvents).map((ev: EventType) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-lg border-4 flex flex-col bg-white w-full ${
                      ev.type === "Online Zoom Class"
                        ? "border-blue-200"
                        : ev.type === "Physical Class"
                          ? "border-yellow-200"
                          : ev.type === "Assignment"
                            ? "border-green-200"
                            : ev.type === "Holiday"
                              ? "border-purple-200"
                              : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base">{ev.title}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded border ml-2 font-semibold ${typeBadge[ev.type] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                      >
                        {ev.type}
                      </span>
                    </div>
                    {ev.topic && (
                      <div className="text-sm text-blue-600 mt-1">
                        {ev.topic}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {ev.date} {ev.startTime && `| ${ev.startTime}`}
                    </div>
                  </div>
                ))}
                displayScrollbar={false}
                showGradients={false}
                itemClassName=""
                onItemSelect={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
