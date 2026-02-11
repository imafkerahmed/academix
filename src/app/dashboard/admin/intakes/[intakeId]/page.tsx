"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import AdminActionBar from "@/components/admin/AdminActionBar";
import { Plus, Filter } from "lucide-react";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

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
function calculateStatus(start_date: string, end_date: string) {
  const today = new Date();
  const start = new Date(start_date);
  const end = new Date(end_date);
  if (today < start) return "upcoming";
  if (today > end) return "completed";
  return "ongoing";
}
function formatDate(date: string) {
  // Always outputs YYYY-MM-DD
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
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state for modifying intake
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [editIntake, setEditIntake] = useState({
    code: intake?.code || "",
    start_date: intake?.start_date || "",
    end_date: intake?.end_date || "",
  });

  // Modal state for creating a course
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    courseId: "",
    start_date: "",
    end_date: "",
    isSemesterBased: false,
    course_fee: "",
    registration_fee: "",
    duration: "",
  });

  if (!intake) {
    return (
      <div className="p-8 text-center text-gray-500">Intake not found.</div>
    );
  }

  const filteredCourses = courses.filter((ci) => {
    const courseStatus = calculateStatus(ci.start_date, ci.end_date);
    const matchesStatus =
      statusFilter === "all" || courseStatus === statusFilter;
    return (
      ci.courseDetails &&
      matchesStatus &&
      (ci.courseDetails.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        ci.courseDetails.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCourses.length / rowsPerPage),
  );
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  function handleOpenModifyModal() {
    setEditIntake({
      code: intake?.code || "",
      start_date: intake?.start_date || "",
      end_date: intake?.end_date || "",
    });
    setShowModifyModal(true);
  }

  function handleModifyIntake(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Here you would update the intake in your data source
    // For now, just close the modal
    setShowModifyModal(false);
  }

  function handleOpenCreateModal() {
    setNewCourse({
      courseId: "",
      start_date: "",
      end_date: "",
      isSemesterBased: false,
      course_fee: "",
      registration_fee: "",
      duration: "",
    });
    setShowCreateModal(true);
  }

  function handleCreateCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Here you would create the course intake and fees in your backend
    setShowCreateModal(false);
  }

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
              {calculateStatus(
                intake.start_date,
                intake.end_date,
              ).toUpperCase()}
            </span>

            {/* Edit Button */}
            <button
              className="ml-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow transition-colors"
              onClick={handleOpenModifyModal}
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
              <div className="flex gap-2 items-center">
                <div className="flex gap-2 items-center mr-2">
                  <Filter size={20} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <Button
                  type="button"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-4 rounded-lg transition-colors h-14"
                  onClick={handleOpenCreateModal}
                >
                  <Plus size={20} />
                  CREATE COURSE
                </Button>
              </div>
            }
          >
            {/* Status filter buttons here */}
          </AdminActionBar>
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
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider bg-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-gray-400 bg-gray-50"
                  >
                    No courses found for this intake.
                  </td>
                </tr>
              ) : (
                paginatedCourses.map((ci, idx) =>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={calculateStatus(ci.start_date, ci.end_date)}
                        />
                      </td>
                    </tr>
                  ) : null,
                )
              )}
            </tbody>
          </table>
          {/* Pagination Bar: right-aligned */}
          <div className="w-full flex justify-end px-4 py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : 0}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                    aria-disabled={currentPage === totalPages}
                    tabIndex={currentPage === totalPages ? -1 : 0}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
        {/* Modify Intake Modal */}
        {showModifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Modify Intake</h2>
              <form onSubmit={handleModifyIntake} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Intake Code
                  </label>
                  <input
                    type="text"
                    value={editIntake.code}
                    onChange={(e) =>
                      setEditIntake({ ...editIntake, code: e.target.value })
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
                    value={editIntake.start_date}
                    onChange={(e) =>
                      setEditIntake({
                        ...editIntake,
                        start_date: e.target.value,
                      })
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
                    value={editIntake.end_date}
                    onChange={(e) =>
                      setEditIntake({ ...editIntake, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-200"
                    onClick={() => setShowModifyModal(false)}
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
        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              {/* X Close Button */}
              <button
                type="button"
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4">Create Course Intake</h2>
              <CreateCourseModalContent
                newCourse={newCourse}
                setNewCourse={setNewCourse}
                setShowCreateModal={setShowCreateModal}
                handleCreateCourse={handleCreateCourse}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Place this component inside the same file, outside your main component:
function CreateCourseModalContent({
  newCourse,
  setNewCourse,
  setShowCreateModal,
  handleCreateCourse,
}: {
  newCourse: any;
  setNewCourse: React.Dispatch<React.SetStateAction<any>>;
  setShowCreateModal: (v: boolean) => void;
  handleCreateCourse: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [step, setStep] = useState(1);

  return (
    <form
      onSubmit={(e) => {
        if (step === 1) {
          e.preventDefault();
          setStep(2);
        } else {
          handleCreateCourse(e);
        }
      }}
      className="space-y-4"
    >
      {step === 1 && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Course
            </label>
            <select
              value={newCourse.courseId}
              onChange={(e) =>
                setNewCourse((prev: any) => ({
                  ...prev,
                  courseId: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">-- Select --</option>
              {mockCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={newCourse.start_date}
              onChange={(e) =>
                setNewCourse((prev: any) => ({
                  ...prev,
                  start_date: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={newCourse.end_date}
              onChange={(e) =>
                setNewCourse((prev: any) => ({
                  ...prev,
                  end_date: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                newCourse.isSemesterBased ? "bg-indigo-600" : "bg-gray-300"
              }`}
              onClick={() =>
                setNewCourse((prev: any) => ({
                  ...prev,
                  isSemesterBased: !prev.isSemesterBased,
                  semesterCount: 1,
                }))
              }
              aria-pressed={newCourse.isSemesterBased}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  newCourse.isSemesterBased ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm select-none">Semester Based</span>
          </div>
          {newCourse.isSemesterBased && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Semesters (max 4)
              </label>
              <input
                type="number"
                min={1}
                max={4}
                value={newCourse.semesterCount || 1}
                onChange={(e) => {
                  let val = Math.max(1, Math.min(4, Number(e.target.value)));
                  setNewCourse((prev: any) => ({
                    ...prev,
                    semesterCount: val,
                  }));
                }}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 text-white"
            >
              Next
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Course Fee</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newCourse.course_fee}
              onChange={(e) =>
                setNewCourse((prev: any) => ({
                  ...prev,
                  course_fee: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Registration Fee
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newCourse.registration_fee}
              onChange={(e) =>
                setNewCourse((prev: any) => ({
                  ...prev,
                  registration_fee: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Duration (months)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={newCourse.duration}
              onChange={(e) =>
                setNewCourse((prev: any) => ({
                  ...prev,
                  duration: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="flex justify-between gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 text-white"
            >
              Create
            </button>
          </div>
        </>
      )}
    </form>
  );
}
