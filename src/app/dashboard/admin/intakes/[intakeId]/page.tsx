"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import AdminActionBar from "@/components/admin/AdminActionBar";
import { Plus } from "lucide-react";

// --- Types ---
interface Intake {
  id: string;
  code: string;
  start_date: string;
  end_date: string;
  created: string;
}
interface Course {
  id: string;
  name: string;
  code: string;
  created: string;
}
interface CourseIntake {
  id: string;
  course: string;
  intake: string;
  start_date: string;
  end_date: string;
}

// --- Mock Data ---
const mockIntakes: Intake[] = [
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
const mockCourses: Course[] = [
  { id: "c1", name: "Mathematics", code: "MATH101", created: "2025-01-01" },
  { id: "c2", name: "Physics", code: "PHYS101", created: "2025-01-01" },
];
const mockCourseIntakes: CourseIntake[] = [
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
  {
    id: "ci3",
    course: "c2",
    intake: "2",
    start_date: "2025-07-01",
    end_date: "2025-12-31",
  },
];

// --- Utility Functions ---
function getStatus(intake: Intake) {
  const today = new Date();
  const start = new Date(intake.start_date);
  const end = new Date(intake.end_date);
  if (today < start) return "upcoming";
  if (today > end) return "completed";
  return "active";
}
function formatDate(date: string) {
  // Always outputs YYYY-MM-DD
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function StatusBadge({ status }: { status: string }) {
  const color =
    status === "active"
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

// --- Intake Details Page ---
export default function IntakeDetailsPage() {
  const params = useParams();
  const intakeId = typeof params?.intakeId === "string" ? params.intakeId : "";

  // Find intake
  const intake = mockIntakes.find((i) => i.id === intakeId);

  // Find all courseIntakes for this intake
  const courseIntakes = mockCourseIntakes.filter(
    (ci) => ci.intake === intakeId,
  );

  // Find course details for each courseIntake
  const courses = courseIntakes.map((ci) => ({
    ...ci,
    courseDetails: mockCourses.find((c) => c.id === ci.course),
  }));

  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  if (!intake) {
    return (
      <div className="p-8 text-center text-gray-500">Intake not found.</div>
    );
  }

  const filteredCourses = courses.filter(
    (ci) =>
      ci.courseDetails &&
      (ci.courseDetails.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        ci.courseDetails.code
          .toLowerCase()
          .includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans">
      {/* Intake Details Card */}
      <div className="bg-white rounded-2xl shadow p-8 mb-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {intake.code}
            </div>
            <div className="text-gray-500 text-base mt-1">
              Intake ID: {intake.id}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-500 text-white font-semibold text-sm shadow-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {getStatus(intake).toUpperCase()}
            </span>

            {/* Edit Button */}
            <button
              className="ml-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow transition-colors"
              onClick={() => alert("Edit Intake (implement modal or route)")}
            >
              MODIFY
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Student Count Card */}
          <div className="flex flex-col bg-gray-50 rounded-xl p-4">
            <span className="text-xs font-semibold text-gray-500 mb-1">
              STUDENT COUNT
            </span>
            <span className="text-lg font-bold text-gray-900">
              {/* Replace 0 with actual count when available */}0
            </span>
          </div>
          <div className="flex flex-col bg-gray-50 rounded-xl p-4">
            <span className="text-xs font-semibold text-gray-500 mb-1">
              START DATE
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatDate(intake.start_date)}
            </span>
          </div>
          <div className="flex flex-col bg-gray-50 rounded-xl p-4">
            <span className="text-xs font-semibold text-gray-500 mb-1">
              END DATE
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatDate(intake.end_date)}
            </span>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="space-y-4">
        <div className="w-full max-w-3xl">
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search courses..."
            action={
              <Button
                type="button"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-4 rounded-lg transition-colors h-14"
                onClick={() =>
                  alert("Create Course (implement modal or route)")
                }
              >
                <Plus size={20} />
                CREATE COURSE
              </Button>
            }
          />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider bg-white">
                  Course Name
                </th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider bg-white">
                  Course Code
                </th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider bg-white">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider bg-white">
                  End Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-gray-400 bg-gray-50"
                  >
                    No courses found for this intake.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((ci, idx) =>
                  ci.courseDetails ? (
                    <tr
                      key={ci.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {ci.courseDetails.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {ci.courseDetails.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatDate(ci.start_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatDate(ci.end_date)}
                      </td>
                    </tr>
                  ) : null,
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
