"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import AdminActionBar from "@/components/admin/AdminActionBar";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";
import {
  Plus,
  Filter,
  Calendar,
  Edit,
  Check,
  BookOpen,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  intakeStatus?: string;
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
interface CourseTemplate {
  id: string;
  course_code: string;
  course_name: string;
  course_description?: string;
}

// --- Utility Functions ---
function calculateStatus(start_date: string, end_date: string) {
  const today = new Date();
  const start = new Date(start_date);
  const end = new Date(end_date);
  if (today < start) return "upcoming";
  if (today > end) return "completed";
  return "ongoing";
}

// Get the actual status (disabled takes priority, otherwise calculated)
function getActualStatus(intake: {
  start_date: string;
  end_date: string;
  intakeStatus?: string;
}) {
  if (intake.intakeStatus === "disabled") return "disabled";
  return calculateStatus(intake.start_date, intake.end_date);
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
  const router = useRouter();

  // State management
  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState<Intake | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Course management state
  const [courseTemplates, setCourseTemplates] = useState<any[]>([]);
  const [templateForm, setTemplateForm] = useState({
    templateId: "",
    code: "",
    name: "",
    start_date: "",
    end_date: "",
    isSemesterBased: false,
    semesterCount: 1,
    course_fee: "",
    registration_fee: "",
    duration: "",
  });

  // Modal state for modifying intake
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [editIntake, setEditIntake] = useState({
    code: "",
    start_date: "",
    end_date: "",
  });

  // Modal state for creating a course
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch intake data
  useEffect(() => {
    if (intakeId) {
      fetchIntakeData();
    }
  }, [intakeId]);

  async function fetchIntakeData() {
    try {
      setLoading(true);
      const intakeRecord = await pb.collection("intakes").getOne(intakeId);
      setIntake(intakeRecord as unknown as Intake);

      // Fetch templates and course-intakes for this intake
      const [templatesData, courseIntakesData] = await Promise.all([
        pb.collection("course_templates").getFullList(),
        pb.collection("course_intakes").getFullList({
          filter: `intake="${intakeId}"`,
          expand: "course",
        }),
      ]);

      setCourseTemplates(templatesData);
      setCourses(courseIntakesData);
    } catch (error: any) {
      console.error("Error fetching intake:", error);
      toast.error("Failed to load intake details");
      if (error?.status === 404) {
        router.push("/dashboard/admin/intakes");
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Loading intake details...
          </p>
        </div>
      </div>
    );
  }

  if (!intake) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Intake Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            The intake you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/dashboard/admin/intakes")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Back to Intakes
          </button>
        </div>
      </div>
    );
  }

  const filteredCourses = courses.filter((ci) => {
    const courseStatus = calculateStatus(ci.start_date, ci.end_date);
    const matchesStatus =
      statusFilter === "all" || courseStatus === statusFilter;
    return (
      ci.expand?.course &&
      matchesStatus &&
      (ci.expand.course.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        ci.expand.course.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

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
    if (!intake) return;
    setEditIntake({
      code: intake.code,
      start_date: intake.start_date ? formatDate(intake.start_date) : "",
      end_date: intake.end_date ? formatDate(intake.end_date) : "",
    });
    setShowModifyModal(true);
  }

  async function handleModifyIntake(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intake) return;

    try {
      // Calculate status automatically based on dates
      const calculatedStatus = calculateStatus(
        editIntake.start_date,
        editIntake.end_date,
      );

      const data = {
        code: editIntake.code,
        start_date: editIntake.start_date,
        end_date: editIntake.end_date,
        intakeStatus:
          intake.intakeStatus === "disabled" ? "disabled" : calculatedStatus,
      };

      await pb.collection("intakes").update(intake.id, data);
      toast.success("Intake updated successfully!");
      setShowModifyModal(false);

      // Refresh data
      fetchIntakeData();
    } catch (error: any) {
      console.error("Error updating intake:", error);
      toast.error(error?.message || "Failed to update intake");
    }
  }

  async function handleToggleDisabled() {
    if (!intake) return;

    try {
      const newStatus =
        intake.intakeStatus === "disabled"
          ? calculateStatus(intake.start_date, intake.end_date)
          : "disabled";

      await pb.collection("intakes").update(intake.id, {
        intakeStatus: newStatus,
      });

      toast.success(
        newStatus === "disabled"
          ? "Intake disabled successfully!"
          : "Intake enabled successfully!",
      );

      // Refresh data
      fetchIntakeData();
    } catch (error: any) {
      console.error("Error toggling intake status:", error);
      toast.error(error?.message || "Failed to toggle intake status");
    }
  }

  // Helper: Generate course code with intake's date context
  function generateCourseCodeForIntake(templateCode: string): string {
    if (!intake) return templateCode;
    const intakeDate = new Date(intake.start_date);
    const month = intakeDate
      .toLocaleString("en-US", { month: "long" })
      .toUpperCase();
    const year = intakeDate.getFullYear();
    return `${templateCode}/${month}/${year}`;
  }

  function handleOpenCreateModal() {
    setTemplateForm({
      templateId: "",
      code: "",
      name: "",
      start_date: "",
      end_date: "",
      isSemesterBased: false,
      semesterCount: 1,
      course_fee: "",
      registration_fee: "",
      duration: "",
    });
    setShowCreateModal(true);
  }

  async function handleCreateFromTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      if (
        !templateForm.templateId ||
        !templateForm.code ||
        !templateForm.start_date ||
        !templateForm.end_date
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      // Create the course record
      const newCourseRecord = await pb.collection("courses").create({
        code: templateForm.code.toUpperCase(),
        name: templateForm.name,
        status: "active",
      });

      // Calculate status
      const courseStatus = calculateStatus(
        templateForm.start_date,
        templateForm.end_date,
      );

      // Create course-intake
      const newCourseIntake = await pb.collection("course_intakes").create(
        {
          course: newCourseRecord.id,
          intake: intakeId,
          start_date: templateForm.start_date,
          end_date: templateForm.end_date,
          is_semester_based: templateForm.isSemesterBased,
          semester_count: templateForm.isSemesterBased
            ? templateForm.semesterCount || 1
            : null,
          course_status: courseStatus,
        },
        { expand: "course" },
      );

      // Create fee record
      await pb.collection("course_intake_fees").create({
        course_intake: newCourseIntake.id,
        registration_fee: parseFloat(templateForm.registration_fee) || 0,
        course_fee: parseFloat(templateForm.course_fee) || 0,
        duration: parseInt(templateForm.duration) || 0,
      });

      toast.success("Course-intake created successfully!");
      setShowCreateModal(false);
      fetchIntakeData();
    } catch (error: any) {
      console.error("Error creating course-intake from template:", error);
      toast.error(error?.message || "Failed to create course-intake");
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans">
      <AdminBreadcrumbs
        items={[
          { label: "Intakes", href: "/dashboard/admin/intakes" },
          { label: intake.code },
        ]}
      />
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
          <div className="flex gap-4 items-center flex-wrap">
            <span
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs tracking-widest shadow-sm ${
                getActualStatus(intake) === "disabled"
                  ? "bg-red-500 text-white"
                  : getActualStatus(intake) === "ongoing"
                    ? "bg-green-500 text-white"
                    : getActualStatus(intake) === "completed"
                      ? "bg-gray-500 text-white"
                      : "bg-yellow-500 text-white"
              }`}
            >
              {getActualStatus(intake).toUpperCase()}
            </span>

            <button
              className={`px-6 py-2.5 rounded-2xl font-black text-xs tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                intake.intakeStatus === "disabled"
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-green-100"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-red-100"
              }`}
              onClick={handleToggleDisabled}
            >
              {intake.intakeStatus === "disabled" ? (
                <>
                  <Unlock size={14} />
                  ENABLE
                </>
              ) : (
                <>
                  <Lock size={14} />
                  DISABLE
                </>
              )}
            </button>

            <button
              className="px-6 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs tracking-widest shadow-lg shadow-orange-100 transition-all active:scale-95 flex items-center gap-2"
              onClick={handleOpenModifyModal}
            >
              <Edit size={14} />
              MODIFY
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:bg-white transition-all">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              INTAKE STATUS
            </span>
            <span
              className={`text-lg font-black uppercase ${
                getActualStatus(intake) === "disabled"
                  ? "text-red-600"
                  : getActualStatus(intake) === "ongoing"
                    ? "text-green-600"
                    : getActualStatus(intake) === "completed"
                      ? "text-gray-600"
                      : "text-yellow-600"
              }`}
            >
              {getActualStatus(intake)}
            </span>
          </div>
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
              action={undefined}
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
                        if (ci.expand?.course) {
                          router.push(
                            `/dashboard/admin/intakes/${intakeId}/${ci.expand.course.id}`,
                          );
                        }
                      }}
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {ci.expand?.course?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                          {ci.expand?.course?.code}
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
        subtitle="Select a template, set dates, semester and fees."
        avatarChar="C"
        avatarColor="bg-indigo-600"
      >
        <form onSubmit={handleCreateFromTemplate} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
              Template
            </label>
            <select
              value={templateForm.templateId}
              onChange={(e) => {
                const tpl = courseTemplates.find(
                  (t) => t.id === e.target.value,
                );
                if (tpl) {
                  setTemplateForm((prev) => ({
                    ...prev,
                    templateId: e.target.value,
                    code: tpl.course_code
                      ? generateCourseCodeForIntake(tpl.course_code)
                      : "",
                    name: tpl.course_name,
                  }));
                } else {
                  setTemplateForm((prev) => ({
                    ...prev,
                    templateId: "",
                    code: "",
                    name: "",
                  }));
                }
              }}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900 appearance-none"
              required
            >
              <option value="">-- Select a template --</option>
              {courseTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.course_code ? `[${t.course_code}] ` : ""}
                  {t.course_name}
                </option>
              ))}
            </select>
          </div>

          {templateForm.templateId && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={templateForm.code}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900 uppercase"
                  placeholder="e.g. BBM/MARCH/2026"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Course Name
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  readOnly
                  className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-600"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Start Date
              </label>
              <input
                type="date"
                value={templateForm.start_date}
                onChange={(e) => {
                  const start = e.target.value;
                  const end = templateForm.end_date;
                  const months =
                    start && end
                      ? Math.max(
                          0,
                          (new Date(end).getFullYear() -
                            new Date(start).getFullYear()) *
                            12 +
                            (new Date(end).getMonth() -
                              new Date(start).getMonth()),
                        )
                      : "";
                  setTemplateForm((prev) => ({
                    ...prev,
                    start_date: start,
                    duration: String(months),
                  }));
                }}
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
                value={templateForm.end_date}
                onChange={(e) => {
                  const end = e.target.value;
                  const start = templateForm.start_date;
                  const months =
                    start && end
                      ? Math.max(
                          0,
                          (new Date(end).getFullYear() -
                            new Date(start).getFullYear()) *
                            12 +
                            (new Date(end).getMonth() -
                              new Date(start).getMonth()),
                        )
                      : "";
                  setTemplateForm((prev) => ({
                    ...prev,
                    end_date: end,
                    duration: String(months),
                  }));
                }}
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
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none shadow-sm ${templateForm.isSemesterBased ? "bg-indigo-600 ring-4 ring-indigo-50" : "bg-gray-300"}`}
              onClick={() =>
                setTemplateForm((prev) => ({
                  ...prev,
                  isSemesterBased: !prev.isSemesterBased,
                  semesterCount: 1,
                }))
              }
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all shadow-md ${templateForm.isSemesterBased ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {templateForm.isSemesterBased && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Number of Semesters
              </label>
              <input
                type="number"
                min={1}
                max={4}
                value={templateForm.semesterCount || 1}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    semesterCount: Math.max(
                      1,
                      Math.min(4, Number(e.target.value)),
                    ),
                  }))
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-gray-900"
                required
              />
            </div>
          )}

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
                  value={templateForm.course_fee}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
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
                  value={templateForm.registration_fee}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
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
              Duration (months)
            </label>
            <input
              type="number"
              readOnly
              value={templateForm.duration}
              placeholder="Auto-calculated from dates"
              className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-600 cursor-default"
            />
          </div>

          <div className="pt-6 border-t border-gray-50">
            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Check size={18} />
              CREATE COURSE-INTAKE
            </button>
          </div>
        </form>
      </ModernModal>
    </div>
  );
}
