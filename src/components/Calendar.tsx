"use client";

import React, { useState, useEffect } from "react";

import { ModernModal } from "@/components/ui/modern-modal";
import {
  X,
  CheckCircle,
  Clock,
  Calendar as CalendarIcon,
  Info,
} from "lucide-react";

// Event data structure (empty - to be loaded from database)
const mockEvents: any[] = [];

// Helper to get days in month
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get start day of week for month (0=Sun, 1=Mon...)
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export { mockEvents };

// Helper to get week days
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Event badge color
const typeBadge: Record<string, string> = {
  "Online Zoom Class": "bg-blue-100 text-blue-700 border-blue-200",
  "Physical Class": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Holiday: "bg-purple-100 text-purple-700 border-purple-200",
  Assignment: "bg-green-100 text-green-700 border-green-200",
};

// EventItem component
function EventItem({ event }: { event: (typeof mockEvents)[0] }) {
  return (
    <div
      className={`flex items-center gap-2 mt-1 px-1 py-0.5 rounded text-xs bg-gray-50 border ${typeBadge[event.type] || "border-gray-200"}`}
    >
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadge[event.type] || "bg-gray-100 text-gray-700 border-gray-200"}`}
      >
        {event.type}
      </span>
      <span className="font-medium truncate">{event.title}</span>
      {/* Show topic for Zoom class */}
      {event.type === "Online Zoom Class" && event.topic && (
        <span className="ml-2 text-blue-500 font-medium truncate">
          {event.topic}
        </span>
      )}
      {event.startTime && (
        <span className="ml-auto text-gray-400">
          {event.startTime}
          {event.endTime ? ` - ${event.endTime}` : ""}
        </span>
      )}
    </div>
  );
}

// DayCell component
function DayCell({
  day,
  date,
  events,
  isToday,
  isSelected,
  onClick,
}: {
  day: number;
  date: string;
  events: typeof mockEvents;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`w-full h-24 p-1 rounded-lg border flex flex-col items-start text-left relative transition border-gray-300
        ${isToday ? "bg-indigo-100 border-indigo-400" : "hover:bg-gray-50"}
        ${isSelected ? "ring-2 ring-indigo-400" : ""}
        min-w-0 max-w-full overflow-hidden`}
      style={{ minWidth: 0 }}
      onClick={onClick}
    >
      <span
        className={`text-lg font-bold ${isToday ? "text-indigo-600" : "text-gray-700"}`}
      >
        {day}
      </span>
      <div className="flex-1 w-full overflow-y-auto">
        {events.slice(0, 3).map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
        {events.length > 3 && (
          <span className="text-xs text-gray-400">
            +{events.length - 3} more
          </span>
        )}
      </div>
      {events.length > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-400 rounded-full"></span>
      )}
    </button>
  );
}

// Main Calendar component
interface CalendarProps {
  onModalOpenChange?: (open: boolean) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onModalOpenChange }) => {
  // Render day view (must be inside Calendar to access state)
  function renderDay() {
    const d = new Date(current.year, current.month, current.day);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const events = getEventsForDate(dateStr);
    return (
      <div className="grid grid-cols-1 gap-2">
        <DayCell
          key={dateStr}
          day={d.getDate()}
          date={dateStr}
          events={events}
          isToday={dateStr === todayStr}
          isSelected={selected === dateStr}
          onClick={() => {
            setSelected(dateStr);
            setModalDate(dateStr);
            if (onModalOpenChange) onModalOpenChange(true);
          }}
        />
      </div>
    );
  }
  // State for view, date, and selected day
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (modalDate) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalDate]);

  // Get today string for highlight
  const todayStr = new Date().toISOString().slice(0, 10);

  // Get events for a date
  const getEventsForDate = (date: string) =>
    mockEvents.filter((e) => e.date === date);

  // Navigation handlers
  function prev() {
    if (view === "month") {
      setCurrent((c) => {
        const m = c.month === 0 ? 11 : c.month - 1;
        const y = c.month === 0 ? c.year - 1 : c.year;
        return { ...c, year: y, month: m };
      });
    } else if (view === "week" || view === "day") {
      setCurrent((c) => {
        const d = new Date(c.year, c.month, c.day - (view === "week" ? 7 : 1));
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    }
  }
  function next() {
    if (view === "month") {
      setCurrent((c) => {
        const m = c.month === 11 ? 0 : c.month + 1;
        const y = c.month === 11 ? c.year + 1 : c.year;
        return { ...c, year: y, month: m };
      });
    } else if (view === "week" || view === "day") {
      setCurrent((c) => {
        const d = new Date(c.year, c.month, c.day + (view === "week" ? 7 : 1));
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    }
  }

  // Modal for expanded day events
  const closeModal = () => {
    setModalDate(null);
    if (onModalOpenChange) onModalOpenChange(false);
  };

  // Render month view
  function renderMonth() {
    const days = getDaysInMonth(current.year, current.month);
    const start = getStartDay(current.year, current.month);
    const cells = [];
    for (let i = 0; i < start; i++) cells.push(<div key={"empty-" + i}></div>);
    for (let d = 1; d <= days; d++) {
      const dateStr = `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const events = getEventsForDate(dateStr);
      cells.push(
        <DayCell
          key={dateStr}
          day={d}
          date={dateStr}
          events={events}
          isToday={dateStr === todayStr}
          isSelected={selected === dateStr}
          onClick={() => {
            setSelected(dateStr);
            setModalDate(dateStr);
            if (onModalOpenChange) onModalOpenChange(true);
          }}
        />,
      );
    }
    return (
      <div className="grid grid-cols-7 gap-2 w-full max-w-full overflow-x-hidden">
        {weekDays.map((w) => (
          <div
            key={w}
            className="text-xs font-bold text-gray-400 text-center mb-1 min-w-0"
          >
            {w}
          </div>
        ))}
        {cells}
      </div>
    );
  }

  // Render week view
  function renderWeek() {
    const refDate = new Date(current.year, current.month, current.day);
    const weekStart = new Date(refDate);
    weekStart.setDate(refDate.getDate() - weekStart.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const events = getEventsForDate(dateStr);
      days.push(
        <DayCell
          key={dateStr}
          day={d.getDate()}
          date={dateStr}
          events={events}
          isToday={dateStr === todayStr}
          isSelected={selected === dateStr}
          onClick={() => {
            setSelected(dateStr);
            setModalDate(dateStr);
            if (onModalOpenChange) onModalOpenChange(true);
          }}
        />,
      );
    }
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((w) => (
          <div
            key={w}
            className="text-xs font-bold text-gray-400 text-center mb-1"
          >
            {w}
          </div>
        ))}
        {days}
      </div>
    );
  }

  return (
    <div
      id="calendar-root"
      className="w-full h-full bg-white rounded-2xl p-4 flex flex-col max-w-full overflow-x-hidden"
      style={{ boxSizing: "border-box" }}
    >
      {/* Header: Navigation & View Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="p-2 rounded hover:bg-gray-100 text-gray-500"
          >
            <span className="sr-only">Previous</span>
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path
                d="M12 15l-5-5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="text-lg font-semibold text-gray-700">
            {view === "month" &&
              `${new Date(current.year, current.month).toLocaleString("default", { month: "long" })} ${current.year}`}
            {view === "week" &&
              `Week of ${new Date(current.year, current.month, current.day).toLocaleDateString()}`}
            {view === "day" &&
              `${new Date(current.year, current.month, current.day).toLocaleDateString()}`}
          </div>
          <button
            onClick={next}
            className="p-2 rounded hover:bg-gray-100 text-gray-500"
          >
            <span className="sr-only">Next</span>
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path
                d="M8 5l5 5-5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${view === "day" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Day
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${view === "week" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${view === "month" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Month
          </button>
        </div>
      </div>
      {/* Calendar Body */}
      <div className="flex-1 w-full max-w-full overflow-x-hidden">
        {view === "month" && renderMonth()}
        {view === "week" && renderWeek()}
        {view === "day" && renderDay()}
      </div>

      {/* ModernModal for expanded day events */}
      <ModernModal
        open={!!modalDate}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        title={
          modalDate
            ? (() => {
                const d = new Date(modalDate);
                return `${weekDays[d.getDay()]}, ${d.toLocaleDateString()}`;
              })()
            : ""
        }
        subtitle={
          modalDate
            ? `${getEventsForDate(modalDate).length} event(s)`
            : undefined
        }
        avatarChar={modalDate ? `${new Date(modalDate).getDate()}` : undefined}
        avatarColor="bg-indigo-600"
        className="max-w-2xl"
      >
        <div className="max-h-[500px] overflow-y-auto no-scrollbar py-2 space-y-4">
          {getEventsForDate(modalDate || "").map((event) => (
            <div
              key={event.id}
              className={`bg-white border rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-300 w-full group relative overflow-hidden ${
                event.type === "Online Zoom Class"
                  ? "border-blue-100"
                  : event.type === "Physical Class"
                    ? "border-yellow-100"
                    : event.type === "Assignment"
                      ? "border-green-100"
                      : event.type === "Holiday"
                        ? "border-purple-100"
                        : "border-gray-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
                <div className="flex-1">
                  <h4 className="font-black text-gray-900 text-xl tracking-tight group-hover:text-indigo-600 transition-colors uppercase leading-tight">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-3">
                    <span
                      className={`text-[10px] px-3 py-1 rounded-xl font-black uppercase tracking-widest ${
                        event.type === "Online Zoom Class"
                          ? "bg-blue-50 text-blue-700"
                          : event.type === "Physical Class"
                            ? "bg-yellow-50 text-yellow-700"
                            : event.type === "Assignment"
                              ? "bg-green-50 text-green-700"
                              : event.type === "Holiday"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {event.type}
                    </span>
                    {event.topic && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50/50 w-fit px-3 py-1 rounded-xl uppercase tracking-widest">
                        <Info size={12} /> {event.topic}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex gap-3">
                  {event.type === "Online Zoom Class" ? (
                    <button className="px-6 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">
                      Schedule
                    </button>
                  ) : event.type === "Assignment" ? (
                    <button className="px-6 py-3 rounded-2xl bg-green-600 text-white text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-green-100 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all">
                      View
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 relative z-10 pt-4 border-t border-gray-50">
                <span className="flex items-center gap-2">
                  <CalendarIcon size={14} className="text-gray-300" />{" "}
                  {event.date}
                </span>
                {event.startTime && (
                  <span className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-300" />{" "}
                    {event.startTime} - {event.endTime}
                  </span>
                )}
              </div>
            </div>
          ))}
          {modalDate && getEventsForDate(modalDate).length === 0 && (
            <div className="text-gray-400">No events for this day.</div>
          )}
        </div>
      </ModernModal>
    </div>
  );
};

export default Calendar;
