"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GradientText from "@/components/ui/GradientText";
import NotificationButton from "@/components/ui/notification-button";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { RouteLink } from "@/components/ui/route-link";

// Mock data - will be replaced with actual API calls
const subjectsData = {
  "sub-1": {
    id: "sub-1",
    name: "Linear Algebra",
    code: "MATH-101-A",
    instructor: "Prof. Sarah Johnson",
    instructorEmail: "sarah.johnson@academix.edu",
    semester: "Semester 1",
    courseId: "1",
    courseName: "Mathematics 101",
    progress: 100,
    grade: "A",
    credits: 3,
    schedule: "Mon, Wed 10:00 AM - 11:30 AM",
    room: "Building A, Room 305",
    description:
      "An introduction to linear algebra covering vector spaces, matrices, determinants, and linear transformations.",
    attendance: {
      present: 28,
      total: 30,
      percentage: 93.3,
    },
    assignments: [
      {
        id: "assign-1",
        title: "Matrix Operations",
        description:
          "Complete the matrix operations problems. Show all your work and explain your reasoning. You must submit a PDF file with your solutions.",
        rules:
          "• All work must be shown\n• Submit as PDF only\n• No late submissions accepted\n• Collaboration is not allowed",
        dueDate: "2024-02-15",
        status: "Submitted",
        grade: "95/100",
        totalMarks: 100,
        submittedDate: "2024-02-14T18:30:00",
        assignmentFile: "matrix-operations-assignment.pdf",
        submittedFile: "john-doe-matrix-solutions.pdf",
        feedback:
          "Excellent work! Your solutions are clear and well-explained. Minor arithmetic error in question 3.",
        isLate: false,
      },
      {
        id: "assign-2",
        title: "Vector Spaces",
        description:
          "Solve the vector space problems and prove the given theorems. Include diagrams where necessary.",
        rules:
          "• Provide formal proofs\n• Include diagrams for visual problems\n• Submit as PDF\n• Due by 11:59 PM",
        dueDate: "2024-02-28",
        status: "Submitted",
        grade: "88/100",
        totalMarks: 100,
        submittedDate: "2024-02-27T20:15:00",
        assignmentFile: "vector-spaces-assignment.pdf",
        submittedFile: "john-doe-vector-solutions.pdf",
        feedback:
          "Good understanding of concepts. Work on theorem proofs - they need more rigor.",
        isLate: false,
      },
      {
        id: "assign-3",
        title: "Eigenvalues and Eigenvectors",
        description:
          "Calculate eigenvalues and eigenvectors for the given matrices. Apply these concepts to real-world problems.",
        rules:
          "• Show step-by-step calculations\n• Include real-world applications\n• Maximum file size: 10MB\n• Allowed formats: PDF, DOCX",
        dueDate: "2024-03-15",
        status: "Not Submitted",
        grade: "-",
        totalMarks: 100,
        submittedDate: null,
        assignmentFile: "eigenvalues-assignment.pdf",
        submittedFile: null,
        feedback: null,
        isLate: false,
      },
    ],
    materials: [
      {
        id: "mat-1",
        title: "Lecture Notes - Week 1",
        type: "PDF",
        uploadDate: "2024-01-15",
      },
      {
        id: "mat-2",
        title: "Practice Problems Set 1",
        type: "PDF",
        uploadDate: "2024-01-20",
      },
      {
        id: "mat-3",
        title: "Midterm Study Guide",
        type: "PDF",
        uploadDate: "2024-02-01",
      },
    ],
    videos: [
      {
        id: "vid-1",
        title: "Introduction to Linear Algebra",
        duration: "45:30",
        uploadDate: "2024-01-15",
        thumbnail: "/video-thumb.jpg",
      },
      {
        id: "vid-2",
        title: "Matrix Operations Tutorial",
        duration: "38:15",
        uploadDate: "2024-01-22",
        thumbnail: "/video-thumb.jpg",
      },
      {
        id: "vid-3",
        title: "Solving Systems of Linear Equations",
        duration: "52:40",
        uploadDate: "2024-02-05",
        thumbnail: "/video-thumb.jpg",
      },
    ],
  },
  "sub-3": {
    id: "sub-3",
    name: "Differential Equations",
    code: "MATH-101-C",
    instructor: "Prof. Emily Davis",
    instructorEmail: "emily.davis@academix.edu",
    semester: "Semester 2",
    courseId: "1",
    courseName: "Mathematics 101",
    progress: 65,
    grade: "In Progress",
    credits: 3,
    schedule: "Fri 9:00 AM - 12:00 PM",
    room: "Building B, Room 210",
    description:
      "Study of differential equations including first and second order equations, systems of differential equations, and applications.",
    attendance: {
      present: 8,
      total: 10,
      percentage: 80.0,
    },
    assignments: [
      {
        id: "assign-4",
        title: "First Order Differential Equations",
        description:
          "Solve the differential equations using various methods. Show complete solutions.",
        rules:
          "• Use appropriate solution methods\n• Verify your solutions\n• Submit by deadline\n• Late penalty: -10% per day",
        dueDate: "2024-04-10",
        status: "Submitted",
        grade: "Pending",
        totalMarks: 100,
        submittedDate: "2024-04-09T15:20:00",
        assignmentFile: "first-order-de-assignment.pdf",
        submittedFile: "john-doe-de-solutions.pdf",
        feedback: null,
        isLate: false,
      },
      {
        id: "assign-5",
        title: "Second Order Linear Equations",
        description:
          "Work through the second order linear differential equations problems.",
        rules:
          "• Show complete working\n• Include auxiliary equations\n• PDF format only\n• No extensions available",
        dueDate: "2024-04-25",
        status: "Not Submitted",
        grade: "-",
        totalMarks: 100,
        submittedDate: null,
        assignmentFile: "second-order-assignment.pdf",
        submittedFile: null,
        feedback: null,
        isLate: false,
      },
    ],
    materials: [
      {
        id: "mat-4",
        title: "Course Syllabus",
        type: "PDF",
        uploadDate: "2024-04-01",
      },
      {
        id: "mat-5",
        title: "Lecture Slides - Introduction",
        type: "PDF",
        uploadDate: "2024-04-05",
      },
    ],
    videos: [
      {
        id: "vid-4",
        title: "First Order Differential Equations Lecture",
        duration: "1:05:20",
        uploadDate: "2024-04-01",
        thumbnail: "/video-thumb.jpg",
      },
      {
        id: "vid-5",
        title: "Solving Separable Equations",
        duration: "42:10",
        uploadDate: "2024-04-08",
        thumbnail: "/video-thumb.jpg",
      },
    ],
  },
};

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const courseId = params.courseId as string;
  const [showNotifications, setShowNotifications] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Assignments, 1: Materials, 2: Videos
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation durations (ms)
  const OPEN_DURATION = 900;
  const CLOSE_DURATION = 1500;

  // Auto-close success modal after 3 seconds
  React.useEffect(() => {
    if (!showSuccessModal) return;
    const t = setTimeout(() => setShowSuccessModal(false), 3000);
    return () => clearTimeout(t);
  }, [showSuccessModal]);

  // Handle assignment submission
  const handleSubmitAssignment = () => {
    if (!uploadedFile || !selectedAssignment) return;

    // Update the assignment status (in real app, this would be an API call)
    const today = new Date();
    const submittedDate = today.toISOString();

    // Simulate submission
    selectedAssignment.status = "Submitted";
    selectedAssignment.grade = "Pending";
    selectedAssignment.submittedDate = submittedDate;
    selectedAssignment.submittedFile = uploadedFile.name;
    selectedAssignment.isLate = new Date(selectedAssignment.dueDate) < today;

    // Close assignment modal and show success
    setShowAssignmentModal(false);
    setSelectedAssignment(null);
    setUploadedFile(null);
    setShowSuccessModal(true);
  };

  // Handle animation mount/unmount
  React.useEffect(() => {
    if (showNotifications) {
      setDrawerVisible(true);
      const animationTimeout = setTimeout(() => {}, 10);
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

  const subject = subjectsData[subjectId as keyof typeof subjectsData];

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Subject Not Found
          </h1>
          <button
            onClick={() =>
              router.push(`/dashboard/student/courses/${courseId}`)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-12 py-4 bg-white shadow">
        <div className="flex items-center">
          <GradientText className="text-2xl font-bold">ACADEMIX</GradientText>
        </div>
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
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                View Profile
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Notification Drawer */}
      {drawerVisible && (
        <div
          className={`fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-lg z-[60] flex flex-col border-l border-gray-200 transition-transform transition-opacity translate-x-full opacity-0 ${
            showNotifications
              ? `duration-[${OPEN_DURATION}ms] !translate-x-0 !opacity-100`
              : `duration-[${CLOSE_DURATION}ms] pointer-events-none`
          }`}
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
            <div className="text-gray-500 text-center mt-8">
              No notifications yet.
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <RouteLink href="/dashboard/student" className="hover:text-gray-900">
            Dashboard
          </RouteLink>
          <span>/</span>
          <RouteLink
            href={`/dashboard/student/courses/${courseId}`}
            className="hover:text-gray-900"
          >
            {subject.courseName}
          </RouteLink>
          <span>/</span>
          <span className="text-gray-900 font-medium">{subject.name}</span>
        </div>

        {/* Subject Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {subject.name}
              </h1>
              <p className="text-sm text-gray-500">Code: {subject.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Instructor
              </h3>
              <p className="text-base font-bold text-gray-900">
                {subject.instructor}
              </p>
              <p className="text-sm text-gray-600">{subject.instructorEmail}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Schedule
              </h3>
              <p className="text-base font-medium text-gray-900">
                {subject.schedule}
              </p>
              <p className="text-sm text-gray-600">{subject.room}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Semester
              </h3>
              <p className="text-base font-bold text-gray-900">
                {subject.semester}
              </p>
            </div>
          </div>

          {subject.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Description
              </h3>
              <p className="text-gray-700">{subject.description}</p>
            </div>
          )}
        </div>

        {/* Tabbed Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Tabs */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab(0)}
              className={`px-6 py-3 rounded-t-lg font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 0
                  ? "bg-white border-b-3 border-indigo-600 text-indigo-700 -mb-[2px]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`px-6 py-3 rounded-t-lg font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 1
                  ? "bg-white border-b-3 border-indigo-600 text-indigo-700 -mb-[2px]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Course Materials
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`px-6 py-3 rounded-t-lg font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 2
                  ? "bg-white border-b-3 border-indigo-600 text-indigo-700 -mb-[2px]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Video Materials
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Assignments Tab */}
            {activeTab === 0 && (
              <div className="space-y-4">
                {subject.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowAssignmentModal(true);
                    }}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Due:{" "}
                        {new Date(assignment.dueDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 md:mt-0">
                      <Badge
                        className={
                          assignment.status === "Submitted"
                            ? "bg-blue-100 text-blue-700"
                            : assignment.status === "Graded"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                        }
                      >
                        {assignment.status}
                      </Badge>
                      {assignment.grade !== "-" && (
                        <span className="text-lg font-bold text-gray-900">
                          {assignment.grade}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Course Materials Tab */}
            {activeTab === 1 && (
              <div className="space-y-3">
                {subject.materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {material.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Uploaded:{" "}
                          {new Date(material.uploadDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            )}

            {/* Video Materials Tab */}
            {activeTab === 2 && (
              <div className="space-y-4">
                {subject.videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {video.duration}
                        </span>
                        <span>
                          Uploaded:{" "}
                          {new Date(video.uploadDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedAssignment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm md:p-4">
          <div className="bg-white md:rounded-xl shadow-2xl max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between z-10">
              <div className="flex-1 pr-2">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 line-clamp-2">
                  {selectedAssignment.title}
                </h2>
                <div className="flex items-center gap-2 md:gap-3 mt-2 flex-wrap">
                  <Badge
                    className={
                      selectedAssignment.status === "Submitted"
                        ? "bg-blue-100 text-blue-700"
                        : selectedAssignment.status === "Graded"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                    }
                  >
                    {selectedAssignment.status}
                  </Badge>
                  {new Date(selectedAssignment.dueDate) < new Date() &&
                    selectedAssignment.status === "Not Submitted" && (
                      <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                    )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedAssignment(null);
                  setUploadedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 flex-shrink-0"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6">
              {/* Due Date and Marks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Due Date
                  </p>
                  <p className="text-sm md:text-base font-semibold text-gray-900">
                    {new Date(selectedAssignment.dueDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Total Marks
                  </p>
                  <p className="text-sm md:text-base font-semibold text-gray-900">
                    {selectedAssignment.totalMarks}
                  </p>
                </div>
                {selectedAssignment.grade !== "-" &&
                  selectedAssignment.grade !== "Pending" && (
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                      <p className="text-xs md:text-sm text-green-600 mb-1">
                        Your Grade
                      </p>
                      <p className="font-bold text-xl md:text-2xl text-green-700">
                        {selectedAssignment.grade}
                      </p>
                    </div>
                  )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-sm md:text-base text-gray-700 whitespace-pre-line">
                  {selectedAssignment.description}
                </p>
              </div>

              {/* Rules */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Rules & Guidelines
                </h3>
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                  <p className="text-sm md:text-base text-gray-700 whitespace-pre-line">
                    {selectedAssignment.rules}
                  </p>
                </div>
              </div>

              {/* Download Assignment File */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">
                  Assignment File
                </h3>
                <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm md:text-base font-semibold text-gray-900 truncate">
                      {selectedAssignment.assignmentFile}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      Click to download
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
              </div>

              {/* Submission Section */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">
                  Your Submission
                </h3>

                {selectedAssignment.status === "Not Submitted" ? (
                  <div className="space-y-3 md:space-y-4">
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadedFile(e.target.files[0]);
                          }
                        }}
                        accept=".pdf,.doc,.docx"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <svg
                          className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-sm md:text-base text-gray-600 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs md:text-sm text-gray-500">
                          PDF, DOC, DOCX (Max 10MB)
                        </p>
                      </label>
                    </div>

                    {uploadedFile && (
                      <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
                        <svg
                          className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base font-semibold text-gray-900 truncate">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="text-red-500 hover:text-red-700"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Late Submission Warning */}
                    {new Date(selectedAssignment.dueDate) < new Date() && (
                      <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <svg
                          className="w-5 h-5 md:w-6 md:h-6 text-orange-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm md:text-base font-semibold text-orange-900">
                            Late Submission
                          </p>
                          <p className="text-xs md:text-sm text-orange-700">
                            This assignment is past due. Late penalty may apply.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      disabled={!uploadedFile}
                      onClick={handleSubmitAssignment}
                      className={`w-full py-3 md:py-3 px-6 rounded-lg text-sm md:text-base font-semibold transition-colors ${
                        uploadedFile
                          ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Submit Assignment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {/* Submitted File */}
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                      <div className="flex items-start md:items-center justify-between mb-3 gap-2">
                        <p className="text-sm md:text-base font-semibold text-green-900">
                          Submitted on{" "}
                          {selectedAssignment.submittedDate &&
                            new Date(
                              selectedAssignment.submittedDate,
                            ).toLocaleString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </p>
                        {selectedAssignment.isLate && (
                          <Badge className="bg-orange-500 text-white">
                            Late Submission
                          </Badge>
                        )}
                      </div>
                      <button className="flex items-center gap-2 md:gap-3 p-3 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors w-full">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm md:text-base font-semibold text-gray-900 truncate">
                            {selectedAssignment.submittedFile}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500">
                            Click to download
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Instructor Feedback */}
                    {selectedAssignment.feedback && (
                      <div>
                        <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
                          Instructor Feedback
                        </h4>
                        <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                          <p className="text-sm md:text-base text-gray-700">
                            {selectedAssignment.feedback}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedAssignment.grade === "Pending" && (
                      <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <svg
                          className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm md:text-base text-yellow-900">
                          Your submission is being reviewed by the instructor.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40"
            aria-modal
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl text-center mx-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-9 h-9 text-green-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <div className="text-lg font-semibold text-gray-800">
                Assignment submitted successfully
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Your submission will be reviewed by the instructor shortly.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
