"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Edit } from "lucide-react";

// --- Mock Data (reuse or extend as needed) ---
const mockIntakes = [
  {
    id: "1",
    code: "INT/JUL2026",
    start_date: "2026-01-01",
    end_date: "2026-06-30",
    created: "2025-12-01",
  },
  {
    id: "2",
    code: "INT/JUL2025",
    start_date: "2025-07-01",
    end_date: "2025-12-31",
    created: "2025-06-01",
  },
];
const mockCourses = [
  { id: "c1", name: "Mathematics", code: "MATH101", created: "2025-01-01" },
  { id: "c2", name: "Physics", code: "PHYS101", created: "2025-01-01" },
];
const mockCourseIntakes = [
  {
    id: "ci1",
    course: "c1",
    intake: "1",
    start_date: "2026-01-01",
    end_date: "2026-06-30",
  },
  {
    id: "ci2",
    course: "c2",
    intake: "1",
    start_date: "2026-01-01",
    end_date: "2026-06-30",
  },
];

// --- Helper Functions from Student Page ---
const getYouTubeVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getLetterGrade = (grade: string | null): string => {
  if (!grade || grade === "-" || grade === "Pending") return grade || "-";
  const fractionMatch = grade.match(/(\d+)\/(\d+)/);
  if (fractionMatch) {
    const percentage =
      (parseInt(fractionMatch[1]) / parseInt(fractionMatch[2])) * 100;
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  }
  return grade;
};

const getGradeBadgeColor = (letterGrade: string): string => {
  switch (letterGrade) {
    case "A":
      return "bg-green-500 text-white";
    case "B":
      return "bg-blue-500 text-white";
    case "C":
      return "bg-yellow-500 text-white";
    case "D":
      return "bg-orange-500 text-white";
    case "F":
      return "bg-red-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

// --- Utility Functions ---
function calculateStatus(start_date: string, end_date: string) {
  const today = new Date();
  const start = new Date(start_date);
  const end = new Date(end_date);
  if (today < start) return "upcoming";
  if (today > end) return "completed";
  return "ongoing";
}
function formatDate(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function StatusBadge({ status }: { status: string }) {
  const color =
    status === "ongoing"
      ? "bg-green-100 text-green-700"
      : status === "upcoming"
        ? "bg-blue-100 text-blue-700"
        : "bg-gray-200 text-gray-700";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}
      style={{ minWidth: 80, display: "inline-block", textAlign: "center" }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// --- Course Details Page ---
export default function CourseDetailsPage() {
  const params = useParams();
  const intakeId = typeof params?.intakeId === "string" ? params.intakeId : "";
  const courseId = typeof params?.courseId === "string" ? params.courseId : "";
  const router = useRouter();

  // Find intake and course
  const intake = mockIntakes.find((i) => i.id === intakeId);
  const course = mockCourses.find((c) => c.id === courseId);
  const courseIntake = mockCourseIntakes.find(
    (ci) => ci.intake === intakeId && ci.course === courseId,
  );

  // Modal state for editing course
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCourse, setEditCourse] = useState({
    name: course?.name || "",
    code: course?.code || "",
    start_date: courseIntake?.start_date || "",
    end_date: courseIntake?.end_date || "",
  });

  if (!intake || !course || !courseIntake) {
    return (
      <div className="p-8 text-center text-gray-500">
        Course or Intake not found.
      </div>
    );
  }

  // Tab state
  const tabList = [
    { label: "Students" },
    { label: "Subject" },
    { label: "Assignments" },
    { label: "Study Materials" },
    { label: "Video Materials" },
  ];
  const [activeTab, setActiveTab] = useState(0);

  // New state for tab content modals
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Mock content for each tab
  const students = [
    {
      name: "Alice Johnson",
      regNumber: "REG-2026-001",
      enrolledDate: "2026-01-05",
      status: "Active",
    },
    {
      name: "Bob Smith",
      regNumber: "REG-2026-002",
      enrolledDate: "2026-01-06",
      status: "Active",
    },
    {
      name: "Charlie Lee",
      regNumber: "REG-2026-003",
      enrolledDate: "2026-01-10",
      status: "Pending",
    },
  ];
  const subjects = [
    { name: "Algebra" },
    { name: "Calculus" },
    { name: "Geometry" },
    { name: "Statistics" },
  ];
  const assignments = [
    {
      id: "assign-1",
      title: "Matrix Operations",
      status: "Graded",
      grade: "95/100",
      dueDate: "2026-02-15",
    },
    {
      id: "assign-2",
      title: "Linear Equations",
      status: "Submitted",
      grade: "Pending",
      dueDate: "2026-02-28",
    },
    {
      id: "assign-3",
      title: "Probability Quiz",
      status: "Missing",
      grade: "-",
      dueDate: "2026-03-10",
    },
  ];
  const materials = [
    { id: "mat-1", title: "Lecture Notes.pdf", uploadDate: "2026-01-15" },
    { id: "mat-2", title: "Syllabus.docx", uploadDate: "2026-01-20" },
    { id: "mat-3", title: "Reference Book.epub", uploadDate: "2026-02-01" },
  ];
  const videos = [
    {
      id: "vid-1",
      title: "Introduction to Course",
      duration: "45:30",
      uploadDate: "2026-01-15",
    },
    {
      id: "vid-2",
      title: "Matrix Operations Tutorial",
      duration: "38:15",
      uploadDate: "2026-01-22",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans">
      {/* Course Details Card */}
      <div className="bg-white rounded-2xl shadow p-8 mb-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {course.name}
            </div>
            <div className="text-gray-500 text-base mt-1">{course.code}</div>
            <div className="text-gray-400 text-sm mt-1">
              Intake: {intake.code}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <StatusBadge
              status={calculateStatus(
                courseIntake.start_date,
                courseIntake.end_date,
              )}
            />
            <button
              className="ml-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow transition-colors"
              onClick={() => setShowEditModal(true)}
            >
              <Edit size={16} className="inline mr-1" /> EDIT
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col bg-gray-50 rounded-xl p-4">
            <span className="text-xs font-semibold text-gray-500 mb-1">
              START DATE
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatDate(courseIntake.start_date)}
            </span>
          </div>
          <div className="flex flex-col bg-gray-50 rounded-xl p-4">
            <span className="text-xs font-semibold text-gray-500 mb-1">
              END DATE
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatDate(courseIntake.end_date)}
            </span>
          </div>
          <div className="flex flex-col bg-gray-50 rounded-xl p-4">
            <span className="text-xs font-semibold text-gray-500 mb-1">
              ENROLLED STUDENTS
            </span>
            <span className="text-lg font-bold text-gray-900">0</span>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 border-b border-gray-200">
          {tabList.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-6 py-3 rounded-t-lg font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === idx
                  ? "bg-white border-b-3 border-indigo-600 text-indigo-700 -mb-[2px]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Students Tab */}
          {activeTab === 0 && (
            <div className="overflow-x-auto">
              <div className="text-lg font-semibold mb-6">
                Enrolled Students
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 pl-2 w-12">#</th>
                    <th className="pb-3">Registration Number</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Enrolled Date</th>
                    <th className="pb-3 pr-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="py-4 pl-2 text-sm text-gray-500 font-medium">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {s.regNumber}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {s.name.charAt(0)}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {new Date(s.enrolledDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                        })}
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <Badge
                          className={
                            s.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Subject Tab */}
          {activeTab === 1 && (
            <div>
              <div className="text-lg font-semibold mb-4">Subjects</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {subjects.map((subj, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100 flex items-center"
                  >
                    <span className="text-blue-600 font-semibold text-base">
                      {subj.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 2 && (
            <div className="space-y-4">
              {assignments.map((assignment) => (
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
                  <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-0">
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
                    {assignment.grade !== "-" &&
                      assignment.grade !== "Pending" && (
                        <>
                          <Badge
                            className={`${getGradeBadgeColor(getLetterGrade(assignment.grade))} text-base md:text-lg font-bold px-3 py-1`}
                          >
                            {getLetterGrade(assignment.grade)}
                          </Badge>
                          <span className="text-sm md:text-base font-semibold text-gray-600">
                            {assignment.grade}
                          </span>
                        </>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Study Materials Tab */}
          {activeTab === 3 && (
            <div className="space-y-3">
              {materials.map((material) => (
                <div
                  key={material.id}
                  onClick={() => {
                    setSelectedMaterial(material);
                    setShowMaterialModal(true);
                  }}
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
          {activeTab === 4 && (
            <div className="space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => {
                    setSelectedVideo(video);
                    setShowVideoModal(true);
                  }}
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

      {/* Edit Course Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Course Details</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowEditModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  value={editCourse.name}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={editCourse.code}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editCourse.start_date}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={editCourse.end_date}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
