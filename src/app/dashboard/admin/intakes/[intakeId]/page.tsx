"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import AdminActionBar from "@/components/admin/AdminActionBar";
import {
  Plus,
  Filter,
  Calendar,
  Edit,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { ModernModal } from "@/components/ui/modern-modal";

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
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${color}`}
      style={{ minWidth: 80, display: "inline-block", textAlign: "center" }}
    >
      {status}
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
    setShowCreateModal(false);
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans">
      {/* Intake Details Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col gap-8 transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <Calendar size={32} />
            </div>
            <div>
              <div className="text-4xl font-black text-gray-900 tracking-tight">
                {intake.code}
              </div>
              <div className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">
                ID: {intake.id}
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <span
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs tracking-widest shadow-sm ${
                calculateStatus(intake.start_date, intake.end_date) ===
                "ongoing"
                  ? "bg-green-500 text-white"
                  : calculateStatus(intake.start_date, intake.end_date) ===
                      "upcoming"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-500 text-white"
              }`}
            >
              {calculateStatus(
                intake.start_date,
                intake.end_date,
              ).toUpperCase()}
            </span>

            <button
              className="px-6 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs tracking-widest shadow-lg shadow-orange-100 transition-all active:scale-95 flex items-center gap-2"
              onClick={handleOpenModifyModal}
            >
              <Edit size={14} />
              MODIFY
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:bg-white transition-all">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              STUDENT COUNT
            </span>
            <span className="text-2xl font-black text-indigo-600">0</span>
          </div>
          <div className="flex flex-col bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:bg-white transition-all">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              START DATE
            </span>
            <span className="text-xl font-bold text-gray-900">
              {formatDate(intake.start_date)}
            </span>
          </div>
          <div className="flex flex-col bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:bg-white transition-all">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              END DATE
            </span>
            <span className="text-xl font-bold text-gray-900">
              {formatDate(intake.end_date)}
            </span>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full md:max-w-xl">
            <AdminActionBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search courses by name or code..."
              action={null}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm">
              <Filter size={16} className="text-indigo-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm font-bold text-gray-600 outline-none bg-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="ongoing">Ongoing</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
              <Plus size={18} />
              CREATE COURSE
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-8 py-5 text-left">Course Name</th>
                  <th className="px-8 py-5 text-left">Code</th>
                  <th className="px-8 py-5 text-left">Time Period</th>
                  <th className="px-8 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20 bg-gray-50/30">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                          <BookOpen size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                          No courses found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCourses.map((ci) => (
                    <tr
                      key={ci.id}
                      className="group hover:bg-indigo-50/30 transition-all cursor-pointer"
                      onClick={() => {
                        if (ci.courseDetails) {
                          router.push(
                            `/dashboard/admin/intakes/${intakeId}/${ci.courseDetails.id}`,
                          );
                        }
                      }}
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {ci.courseDetails?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                          {ci.courseDetails?.code}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                          <span>{formatDate(ci.start_date)}</span>
                          <span className="text-gray-300">→</span>
                          <span>{formatDate(ci.end_date)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <StatusBadge
                          status={calculateStatus(ci.start_date, ci.end_date)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-5 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
            <p className="text-xs font-bold text-gray-400">
              SHOWING {paginatedCourses.length} OF {filteredCourses.length}{" "}
              COURSES
            </p>
            <Pagination className="w-auto">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={`rounded-xl border-none hover:bg-white hover:shadow-sm transition-all ${currentPage === 1 ? "opacity-30 pointer-events-none" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={`rounded-xl border-none hover:bg-white hover:shadow-sm transition-all ${currentPage === totalPages ? "opacity-30 pointer-events-none" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      {/* Modify Intake Modal */}
      <ModernModal
        open={showModifyModal}
        onOpenChange={setShowModifyModal}
        title="Modify Intake"
        subtitle="Update the schedule or code for this intake."
        avatarChar="E"
        avatarColor="bg-orange-500"
      >
        <form onSubmit={handleModifyIntake} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Intake Code
              </label>
              <input
                type="text"
                value={editIntake.code}
                onChange={(e) =>
                  setEditIntake({ ...editIntake, code: e.target.value })
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editIntake.start_date}
                  onChange={(e) =>
                    setEditIntake({ ...editIntake, start_date: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={editIntake.end_date}
                  onChange={(e) =>
                    setEditIntake({ ...editIntake, end_date: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
            <button
              type="submit"
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95 uppercase tracking-widest"
            >
              SAVE CHANGES
            </button>
            <button
              type="button"
              onClick={() => setShowModifyModal(false)}
              className="w-full py-2 rounded-xl font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
            >
              CANCEL
            </button>
          </div>
        </form>
      </ModernModal>

      {/* Create Course Modal */}
      <ModernModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create Course Intake"
        subtitle="Associate a course with this intake period."
        avatarChar="C"
        avatarColor="bg-indigo-600"
      >
        <CreateCourseModalContent
          newCourse={newCourse}
          setNewCourse={setNewCourse}
          setShowCreateModal={setShowCreateModal}
          handleCreateCourse={handleCreateCourse}
        />
      </ModernModal>
    </div>
  );
}

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
    <div className="space-y-6">
      {/* Progress Track */}
      <div className="flex items-center gap-3 px-1 mb-8">
        <div
          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? "bg-indigo-600" : "bg-gray-100"}`}
        />
        <div
          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? "bg-indigo-600" : "bg-gray-100"}`}
        />
      </div>

      <form
        onSubmit={(e) => {
          if (step === 1) {
            e.preventDefault();
            setStep(2);
          } else {
            handleCreateCourse(e);
          }
        }}
        className="space-y-6"
      >
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
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
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900 appearance-none"
                required
              >
                <option value="">-- Choose a course --</option>
                {mockCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newCourse.start_date}
                  onChange={(e) =>
                    setNewCourse((prev: any) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newCourse.end_date}
                  onChange={(e) =>
                    setNewCourse((prev: any) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 group transition-all hover:border-indigo-100">
              <div className="flex flex-col">
                <span className="text-sm font-black text-gray-700 uppercase tracking-wide">
                  Semester Based
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Enable for multi-semester courses
                </span>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none shadow-sm ${
                  newCourse.isSemesterBased
                    ? "bg-indigo-600 ring-4 ring-indigo-50"
                    : "bg-gray-300"
                }`}
                onClick={() =>
                  setNewCourse((prev: any) => ({
                    ...prev,
                    isSemesterBased: !prev.isSemesterBased,
                    semesterCount: 1,
                  }))
                }
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all shadow-md ${
                    newCourse.isSemesterBased
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {newCourse.isSemesterBased && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Number of Semesters
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
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900"
                  required
                />
              </div>
            )}
            <div className="pt-6 border-t border-gray-50">
              <button
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                NEXT STEP
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Course Fee
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newCourse.course_fee}
                    onChange={(e) =>
                      setNewCourse((prev: any) => ({
                        ...prev,
                        course_fee: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Registration Fee
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newCourse.registration_fee}
                    onChange={(e) =>
                      setNewCourse((prev: any) => ({
                        ...prev,
                        registration_fee: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900"
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Duration (days)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 180"
                value={newCourse.duration}
                onChange={(e) =>
                  setNewCourse((prev: any) => ({
                    ...prev,
                    duration: e.target.value,
                  }))
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900"
                required
              />
            </div>
            <div className="pt-10 flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Check size={18} />
                CONFIRM & CREATE
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3 rounded-2xl font-black text-xs text-gray-400 hover:text-gray-600 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <ArrowLeft size={14} />
                BACK TO DETAILS
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
