"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShieldX, Menu } from "lucide-react";
import Sidebar from "@/components/lecturer/Sidebar";
import BentoStats from "@/components/lecturer/BentoStats";
import QuickActions from "@/components/lecturer/QuickActions";
import UpcomingClasses, {
  type UpcomingClass,
} from "@/components/lecturer/UpcomingClasses";
import AllSchedulesModal from "@/components/lecturer/AllSchedulesModal";
import IntakesTree, {
  type Intake,
  type Course,
  type Subject,
} from "@/components/lecturer/IntakesTree";
import AssignmentsList, {
  type Assignment,
} from "@/components/lecturer/AssignmentsList";
import MaterialsManager, {
  type StudyMaterial,
} from "@/components/lecturer/MaterialsManager";
import Loader from "@/components/ui/loader";
import NotificationButton from "@/components/ui/notification-button";

// Mock user type
interface MockUser {
  id: string;
  name: string;
  role: "lecturer" | "student" | "admin";
  accountStatus: "active" | "disabled";
}

// Mock data
const mockUser: MockUser = {
  id: "lect-001",
  name: "Dr. Sarah Johnson",
  role: "lecturer",
  accountStatus: "active",
};

const mockIntakes: Intake[] = [
  {
    id: "intake-1",
    code: "INT-2024-01",
    name: "January 2024 Intake",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    courses: [
      {
        id: "course-1",
        name: "Computer Science Fundamentals",
        code: "CS101",
        subjects: [
          {
            id: "subject-1",
            name: "Programming Basics",
            code: "CS101-A",
            assigned: true,
          },
          {
            id: "subject-2",
            name: "Data Structures",
            code: "CS101-B",
            assigned: true,
          },
          {
            id: "subject-3",
            name: "Algorithms",
            code: "CS101-C",
            assigned: false,
          },
        ],
      },
      {
        id: "course-2",
        name: "Web Development",
        code: "WEB201",
        subjects: [
          {
            id: "subject-4",
            name: "Frontend Development",
            code: "WEB201-A",
            assigned: true,
          },
          {
            id: "subject-5",
            name: "Backend Development",
            code: "WEB201-B",
            assigned: false,
          },
        ],
      },
    ],
  },
  {
    id: "intake-2",
    code: "INT-2024-02",
    name: "March 2024 Intake",
    startDate: "2024-03-01",
    endDate: "2024-08-31",
    courses: [
      {
        id: "course-3",
        name: "Mathematics",
        code: "MATH101",
        subjects: [
          {
            id: "subject-6",
            name: "Calculus I",
            code: "MATH101-A",
            assigned: true,
          },
        ],
      },
    ],
  },
];

const mockUpcomingClasses: UpcomingClass[] = [
  {
    id: "class-1",
    intakeName: "January 2024 Intake",
    courseName: "Computer Science Fundamentals",
    classTitle: "Introduction to Programming - Lecture 5",
    startTime: "2026-02-07 10:00 AM",
    duration: 90,
    status: "scheduled",
    zoomJoinUrl: "https://zoom.us/j/mock-meeting-1",
  },
  {
    id: "class-2",
    intakeName: "January 2024 Intake",
    courseName: "Web Development",
    classTitle: "React Components Deep Dive",
    startTime: "2026-02-08 02:00 PM",
    duration: 120,
    status: "scheduled",
    zoomJoinUrl: "https://zoom.us/j/mock-meeting-2",
  },
  {
    id: "class-3",
    intakeName: "March 2024 Intake",
    courseName: "Mathematics",
    classTitle: "Limits and Continuity",
    startTime: "2026-02-09 09:00 AM",
    duration: 60,
    status: "scheduled",
    zoomJoinUrl: "https://zoom.us/j/mock-meeting-3",
  },
];

const mockAssignments: Assignment[] = [
  {
    id: "assign-1",
    subjectCode: "CS101-A",
    subjectName: "Programming Basics",
    title: "Build a Calculator App",
    dueDate: "2026-02-15",
    pendingCount: 12,
    markedCount: 8,
  },
  {
    id: "assign-2",
    subjectCode: "CS101-B",
    subjectName: "Data Structures",
    title: "Implement Binary Search Tree",
    dueDate: "2026-02-20",
    pendingCount: 5,
    markedCount: 15,
  },
  {
    id: "assign-3",
    subjectCode: "WEB201-A",
    subjectName: "Frontend Development",
    title: "Create Portfolio Website",
    dueDate: "2026-02-25",
    pendingCount: 18,
    markedCount: 2,
  },
];

const mockMaterials: StudyMaterial[] = [
  {
    id: "mat-1",
    title: "Introduction to Python",
    description: "Basic Python programming concepts and syntax",
    type: "document",
    filePlaceholder: "python-intro.pdf",
    canDownload: true,
    visible: true,
    courseSubjectId: "subject-1",
    courseSubjectName: "Programming Basics",
    createdAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "mat-2",
    title: "Data Structures Tutorial",
    description: "Comprehensive guide to data structures",
    type: "youtube-link",
    videoUrl: "https://youtube.com/watch?v=example",
    canDownload: false,
    visible: true,
    courseSubjectId: "subject-2",
    courseSubjectName: "Data Structures",
    createdAt: "2026-01-22T14:30:00Z",
  },
];

const mockAvailableSubjects = [
  { id: "subject-1", name: "Programming Basics (CS101-A)" },
  { id: "subject-2", name: "Data Structures (CS101-B)" },
  { id: "subject-4", name: "Frontend Development (WEB201-A)" },
  { id: "subject-6", name: "Calculus I (MATH101-A)" },
];

function DateTimeCard() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Only start the clock on the client to avoid SSR hydration mismatches
    setNow(new Date());

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex items-center justify-center text-center">
        <p className="text-sm text-gray-400">Loading time...</p>
      </div>
    );
  }

  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timeLabel = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
      <p className="text-5xl font-extrabold text-blue-600 leading-tight mb-3">
        {timeLabel}
      </p>
      <p className="text-lg font-semibold text-gray-800">{dateLabel}</p>
    </div>
  );
}

// Compact date/time bar for mobile header
function MobileDateTimeBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400">
        Loading time...
      </div>
    );
  }

  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timeLabel = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <span className="text-xl font-semibold text-blue-600 leading-tight">
        {timeLabel}
      </span>
      <span className="text-xs font-medium text-gray-700 mt-1">
        {dateLabel}
      </span>
    </div>
  );
}

export default function LecturerDashboard() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<MockUser | null>(mockUser); // Set initial user data
  const [activeTab, setActiveTab] = useState("Dashboard"); // Always start with Dashboard for SSR
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation durations (ms)
  const OPEN_DURATION = 900;
  const CLOSE_DURATION = 1500;

  // Wrapper function to save active tab to localStorage
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      localStorage.setItem("lecturerActiveTab", newTab);
    }
  };

  useEffect(() => {
    // Authentication is handled by setting initial user state
    // In a real app, this would check cookies/session/JWT and redirect if needed
  }, []);

  // Restore saved tab from localStorage after hydration
  useEffect(() => {
    const savedTab = localStorage.getItem("lecturerActiveTab");
    if (savedTab && savedTab !== activeTab) {
      setActiveTab(savedTab);
    }
  }, [activeTab]);

  // Handle notification drawer animation mount/unmount
  useEffect(() => {
    if (showNotifications) {
      setDrawerVisible(true);
      // Small delay to ensure the drawer is mounted before animation starts
      const animationTimeout = setTimeout(() => {
        // This forces a reflow, allowing the animation to play
      }, 10);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return () => clearTimeout(animationTimeout);
    } else if (drawerVisible) {
      timeoutRef.current = setTimeout(
        () => setDrawerVisible(false),
        CLOSE_DURATION,
      );
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showNotifications, drawerVisible]);

  // Role gating
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user || user.role !== "lecturer" || user.accountStatus === "disabled") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
          <div className="flex justify-center mb-4">
            <ShieldX size={64} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access the lecturer dashboard.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    totalIntakes: mockIntakes.length,
    totalCourses: mockIntakes.reduce(
      (sum, intake) => sum + intake.courses.length,
      0,
    ),
    totalSubjects: mockIntakes.reduce(
      (sum, intake) =>
        sum +
        intake.courses.reduce(
          (courseSum: number, course: Course) =>
            courseSum +
            course.subjects.filter((s: Subject) => s.assigned).length,
          0,
        ),
      0,
    ),
    upcomingClasses: mockUpcomingClasses.length,
    assignmentsToMark: mockAssignments.reduce(
      (sum, assignment) => sum + assignment.pendingCount,
      0,
    ),
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <>
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 mb-4 items-stretch">
              <BentoStats stats={stats} />
              {/* Hide big clock card on extra-small screens */}
              <div className="hidden sm:block">
                <DateTimeCard />
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {/* Upcoming Classes - Takes 2 columns */}
              <div className="lg:col-span-2">
                <UpcomingClasses
                  classes={mockUpcomingClasses}
                  onViewAll={() => setIsModalOpen(true)}
                />
              </div>

              {/* Right Column - 2 sections stacked */}
              <div className="space-y-4">
                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Recent Activity
                  </h3>
                  <div className="text-sm text-gray-500">
                    Activity feed will appear here.
                  </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Announcements
                  </h3>
                  <div className="text-sm text-gray-500">
                    Important announcements will appear here.
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case "Intakes":
        return <IntakesTree intakes={mockIntakes} />;
      case "Assignments":
        return <AssignmentsList assignments={mockAssignments} />;
      case "Materials":
        return (
          <MaterialsManager
            initialMaterials={mockMaterials}
            availableSubjects={mockAvailableSubjects}
          />
        );
      default:
        return (
          <>
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
              <BentoStats stats={stats} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {/* Upcoming Classes - Takes 2 columns */}
              <div className="lg:col-span-2">
                <UpcomingClasses
                  classes={mockUpcomingClasses}
                  onViewAll={() => setIsModalOpen(true)}
                />
              </div>

              {/* Right Column - 2 sections stacked */}
              <div className="space-y-4">
                {/* Section 1 - Placeholder */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Recent Activity
                  </h3>
                  <div className="text-xs text-gray-500">
                    Activity feed will appear here
                  </div>
                </div>

                {/* Section 2 - Placeholder */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Announcements
                  </h3>
                  <div className="text-xs text-gray-500">
                    Important announcements will appear here
                  </div>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        lecturerName={user.name}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content Area (no top header) */}
      <div className="flex-1 lg:ml-64">
        <main className="p-4 md:p-6">
          {/* Mobile header with centered title and menu button */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide text-center flex-1">
                ACADEMIX
              </h1>

              {/* Spacer to keep title centered relative to menu button */}
              <div className="w-10" aria-hidden="true" />
            </div>
            <div className="mt-2">
              <MobileDateTimeBar />
            </div>
          </div>

          {renderContent()}
        </main>
      </div>

      {/* Notification Drawer */}
      {drawerVisible && (
        <div
          className={`
            fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-lg z-[70] flex flex-col border-l border-gray-200
            transition-transform transition-opacity translate-x-full opacity-0
            ${
              showNotifications
                ? `duration-[${OPEN_DURATION}ms] !translate-x-0 !opacity-100`
                : `duration-[${CLOSE_DURATION}ms] pointer-events-none`
            }
          `}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 mt-0 pt-6">
            <span className="font-semibold text-lg">Notifications</span>
            <button
              className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={() => setShowNotifications(false)}
              aria-label="Close notifications"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Placeholder for notifications */}
            <div className="text-gray-500 text-center mt-8">
              No notifications yet.
            </div>
          </div>
        </div>
      )}

      {/* All Schedules Modal */}
      {isModalOpen && (
        <AllSchedulesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          classes={mockUpcomingClasses}
        />
      )}
    </div>
  );
}
