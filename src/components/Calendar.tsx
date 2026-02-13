import React, { useState, useEffect } from "react";

import dynamic from "next/dynamic";
const AnimatedList = dynamic(() => import("@/components/ui/AnimatedList.jsx"), {
  ssr: false,
});
import { ModernModal } from "@/components/ui/modern-modal";

// Mock event data structure
const mockEvents = [
  {
    id: 1,
    title: "Zoom Math Class",
    topic: "Algebra: Quadratic Equations",
    type: "Online Zoom Class",
    date: "2024-01-10",
    startTime: "10:00",
    endTime: "11:00",
    platform: "Zoom",
  },
  {
    id: 2,
    title: "Assignment: Algebra HW",
    type: "Assignment",
    date: "2024-01-10",
    startTime: "",
    endTime: "",
    platform: "",
  },
  {
    id: 3,
    title: "Zoom Science Class",
    topic: "Physics: Newton's Laws",
    type: "Online Zoom Class",
    date: "2024-01-12",
    startTime: "09:00",
    endTime: "10:00",
    platform: "Zoom",
  },
  {
    id: 4,
    title: "Assignment: Lab Report",
    type: "Assignment",
    date: "2024-01-12",
    startTime: "",
    endTime: "",
    platform: "",
  },
  {
    id: 5,
    title: "Zoom English Class",
    topic: "Literature: Shakespeare",
    type: "Online Zoom Class",
    date: "2024-01-14",
    startTime: "13:00",
    endTime: "14:00",
    platform: "Zoom",
  },
  {
    id: 6,
    title: "Physical Chemistry Class",
    topic: "Lab: Acids & Bases",
    type: "Physical Class",
    date: "2024-01-15",
    startTime: "08:00",
    endTime: "09:30",
    platform: "Room 204",
  },
  {
    id: 7,
    title: "Holiday: Republic Day",
    type: "Holiday",
    date: "2024-01-26",
    startTime: "",
    endTime: "",
    platform: "",
  },
  {
    id: 8,
    title: "Physical Math Class",
    topic: "Geometry: Circles",
    type: "Physical Class",
    date: "2024-01-18",
    startTime: "11:00",
    endTime: "12:00",
    platform: "Room 101",
  },
  {
    id: 9,
    title: "Holiday: Sports Day",
    type: "Holiday",
    date: "2024-01-20",
    startTime: "",
    endTime: "",
    platform: "",
  },
  {
    id: 10,
    title: "Zoom Biology Class",
    topic: "Cell Structure",
    type: "Online Zoom Class",
    date: "2026-01-31",
    startTime: "15:00",
    endTime: "16:00",
    platform: "Zoom",
  },
  {
    id: 11,
    title: "Assignment: Chemistry HW",
    type: "Assignment",
    date: "2026-02-02",
    startTime: "",
    endTime: "",
    platform: "",
  },
  {
    id: 12,
    title: "Physical Physics Class",
    topic: "Electromagnetism",
    type: "Physical Class",
    date: "2026-02-05",
    startTime: "10:00",
    endTime: "11:30",
    platform: "Room 303",
  },
  {
    id: 13,
    title: "Holiday: Founders Day",
    type: "Holiday",
    date: "2026-02-10",
    startTime: "",
    endTime: "",
    platform: "",
  },
  {
    id: 14,
    title: "Zoom Math Revision",
    topic: "Exam Prep",
    type: "Online Zoom Class",
    date: "2026-02-12",
    startTime: "09:00",
    endTime: "10:00",
    platform: "Zoom",
  },
  {
    id: 15,
    title: "Assignment: English Essay",
    type: "Assignment",
    date: "2026-02-13",
    startTime: "",
    endTime: "",
    platform: "",
  },
  {
    id: 16,
    title: "Physical Chemistry Lab",
    topic: "Organic Compounds",
    type: "Physical Class",
    date: "2026-02-14",
    startTime: "11:00",
    endTime: "12:30",
    platform: "Lab 2",
  },
  {
    id: 17,
    title: "Holiday: Spring Break",
    type: "Holiday",
    date: "2026-02-15",
    startTime: "",
    endTime: "",
    platform: "",
  },
  {
    id: 18,
    title: "Zoom History Class",
    topic: "World War II",
    type: "Online Zoom Class",
    date: "2026-02-16",
    startTime: "14:00",
    endTime: "15:00",
    platform: "Zoom",
  },
  {
    id: 19,
    title: "Assignment: Physics Quiz",
    type: "Assignment",
    date: "2026-02-17",
    startTime: "",
    endTime: "",
    platform: "",
  },
  {
    id: 20,
    title: "Physical Math Class",
    topic: "Trigonometry",
    type: "Physical Class",
    date: "2026-02-18",
    startTime: "10:00",
    endTime: "11:30",
    platform: "Room 105",
  },
];

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
  onDoubleClick,
}: {
  day: number;
  date: string;
  events: typeof mockEvents;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}) {
  return (
    <button
      className={`w-full h-24 p-1 rounded-lg border flex flex-col items-start text-left relative transition border-gray-300
        ${isToday ? "bg-indigo-100 border-indigo-400" : "hover:bg-gray-50"}
        ${isSelected ? "ring-2 ring-indigo-400" : ""}
        min-w-0 max-w-full overflow-hidden`}
      style={{ minWidth: 0 }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
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
          onClick={() => setSelected(dateStr)}
          onDoubleClick={() => {
            setSelected(dateStr);
            setModalDate(dateStr);
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
          onClick={() => setSelected(dateStr)}
          onDoubleClick={() => {
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
          onClick={() => setSelected(dateStr)}
          onDoubleClick={() => {
            setSelected(dateStr);
            setModalDate(dateStr);
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
        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
          <AnimatedList
            items={getEventsForDate(modalDate).map((event) => (
              <div
                key={event.id}
                className={`bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-lg transition-all duration-300 w-full ${
                  event.type === "Online Zoom Class"
                    ? "border-blue-200"
                    : event.type === "Physical Class"
                      ? "border-yellow-200"
                      : event.type === "Assignment"
                        ? "border-green-200"
                        : event.type === "Holiday"
                          ? "border-purple-200"
                          : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 justify-between">
                  <span className="font-bold text-gray-900 text-base tracking-tight line-clamp-2" title={event.title}>
                    {event.title}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-bold ml-2 ${
                      event.type === "Online Zoom Class"
                        ? "bg-blue-100 text-blue-700"
                        : event.type === "Physical Class"
                          ? "bg-yellow-100 text-yellow-700"
                          : event.type === "Assignment"
                            ? "bg-green-100 text-green-700"
                            : event.type === "Holiday"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {event.type}
                  </span>
                </div>
                {event.topic && (
                  <div className="text-xs text-blue-600 mt-1">
                    {event.topic}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {event.date} {event.startTime && `| ${event.startTime}`}
                </div>
              </div>
            ))}
            displayScrollbar={false}
            showGradients={false}
            itemClassName=""
            onItemSelect={() => {}}
          />
          {modalDate && getEventsForDate(modalDate).length === 0 && (
            <div className="text-gray-400">No events for this day.</div>
          )}
        </div>
      </ModernModal>
    </div>
  );
};

export default Calendar;
