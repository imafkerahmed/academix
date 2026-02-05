"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GradientText from "@/components/ui/GradientText";
import NotificationButton from "@/components/ui/notification-button";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// Mock data - will be replaced with actual API calls
const coursesData = {
  "1": {
    id: "1",
    name: "Mathematics 101",
    registrationNumber: "REG-2024-001",
    description: "Intro to Algebra and Calculus",
    courseStatus: "Ongoing",
    certificateStatus: "Not Issued",
    intakeCode: "INT/JUL/2024",
    startDate: "2024-01-15",
    endDate: "2024-05-30",
    subjects: [
      {
        id: "sub-1",
        name: "Linear Algebra",
        code: "MATH-101-A",
        instructor: "Prof. Sarah Johnson",
        schedule: "Mon, Wed 10:00 AM - 11:30 AM",
        progress: 65,
      },
      {
        id: "sub-2",
        name: "Calculus I",
        code: "MATH-101-B",
        instructor: "Dr. Michael Brown",
        schedule: "Tue, Thu 2:00 PM - 3:30 PM",
        progress: 48,
      },
      {
        id: "sub-3",
        name: "Differential Equations",
        code: "MATH-101-C",
        instructor: "Prof. Emily Davis",
        schedule: "Fri 9:00 AM - 12:00 PM",
        progress: 30,
      },
    ],
  },
  "2": {
    id: "2",
    name: "Physics 201",
    registrationNumber: "REG-2024-002",
    description: "Mechanics and Thermodynamics",
    courseStatus: "Completed",
    certificateStatus: "Issued",
    intakeCode: "INT/SEP/2023",
    intakeName: "INTAKE SEPTEMBER 2023",
    startDate: "2023-09-01",
    endDate: "2023-12-20",
    subjects: [
      {
        id: "sub-4",
        name: "Classical Mechanics",
        code: "PHYS-201-A",
        instructor: "Dr. Robert Wilson",
        schedule: "Mon, Wed 1:00 PM - 2:30 PM",
        progress: 100,
      },
      {
        id: "sub-5",
        name: "Thermodynamics",
        code: "PHYS-201-B",
        instructor: "Prof. Lisa Anderson",
        schedule: "Tue, Thu 10:00 AM - 11:30 AM",
        progress: 100,
      },
    ],
  },
};

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [showNotifications, setShowNotifications] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation durations (ms)
  const OPEN_DURATION = 900;
  const CLOSE_DURATION = 1500;

  // Handle animation mount/unmount
  React.useEffect(() => {
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

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const course = coursesData[courseId as keyof typeof coursesData];

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Course Not Found
          </h1>
          <button
            onClick={() => router.push("/dashboard/student")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-12 py-4 bg-white shadow">
        {/* Left: Title */}
        <div className="flex items-center">
          <GradientText className="text-2xl font-bold ml-0 md:ml-8">
            ACADEMIX
          </GradientText>
        </div>
        {/* Right: Notification Button and Profile Icon */}
        <div className="flex items-center gap-2 md:gap-4 mr-0 md:mr-8 relative">
          <NotificationButton
            onClick={() => setShowNotifications(true)}
            aria-label="Show notifications"
          />
          <button
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setShowLogout((prev) => !prev)}
            aria-label="Account menu"
          >
            <AccountCircleIcon style={{ fontSize: 32, color: "black" }} />
          </button>
          {showLogout && (
            <div className="absolute right-0 top-14 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50 animate-dropdown">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setShowLogout(false);
                  router.push("/dashboard/student");
                }}
              >
                View Profile
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                onClick={() => {
                  setShowLogout(false);
                  // Add your logout logic here
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      {/* Notification Drawer */}
      {drawerVisible && (
        <div
          className={`
            fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-lg z-[60] flex flex-col border-l border-gray-200
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
              onClick={handleCloseNotifications}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard/student")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Course Title and Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.name}
              </h1>
              <p className="text-sm text-gray-500">
                Registration: {course.registrationNumber}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap items-start">
              {/* Course Status Badge */}
              <div
                className={`px-5 py-2.5 rounded-full font-bold text-sm shadow-md flex items-center gap-2 ${
                  course.courseStatus.toLowerCase() === "ongoing"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                    : course.courseStatus.toLowerCase() === "completed"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                      : "bg-gray-500 text-white"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {course.courseStatus.toLowerCase() === "ongoing" ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  )}
                </svg>
                <span className="uppercase tracking-wide">
                  {course.courseStatus}
                </span>
              </div>

              {/* Certificate Status Badge */}
              <div
                className={`px-5 py-2.5 rounded-lg font-bold text-sm shadow-md border-2 flex items-center gap-2 ${
                  course.certificateStatus.toLowerCase() === "issued"
                    ? "bg-green-50 text-green-700 border-green-500"
                    : "bg-red-50 text-red-700 border-red-500"
                }`}
              >
                {course.certificateStatus.toLowerCase() === "issued" && (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                )}
                <span className="uppercase tracking-wide">
                  {course.certificateStatus.toLowerCase() === "issued"
                    ? "Certificate Issued"
                    : "Certificate Not Issued"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Intake
              </h3>
              <p className="text-base font-bold text-gray-900">
                {course.intakeCode}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Start Date
              </h3>
              <p className="text-base font-medium text-gray-900">
                {new Date(course.startDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                End Date
              </h3>
              <p className="text-base font-medium text-gray-900">
                {new Date(course.endDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {course.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Description
              </h3>
              <p className="text-gray-700">{course.description}</p>
            </div>
          )}
        </div>

        {/* Subjects Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Enrolled Subjects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.subjects.map((subject) => (
              <Card
                key={subject.id}
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {subject.code}
                    </Badge>
                  </div>
                  <CardDescription className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>{subject.instructor}</span>
                    </div>
                  </CardDescription>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{subject.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          subject.progress === 100
                            ? "bg-green-500"
                            : subject.progress >= 50
                              ? "bg-blue-500"
                              : "bg-orange-500"
                        }`}
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
