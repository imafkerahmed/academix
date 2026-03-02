"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Edit,
  BookOpen,
  Layers,
  Users,
  Video,
  Plus,
  Filter,
  User,
  Calendar,
  Check,
  ArrowRight,
  ArrowLeft,
  Download,
  Info,
  Loader2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { ModernModal } from "@/components/ui/modern-modal";
import AdminActionBar from "@/components/admin/AdminActionBar";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import { EnrollExistingStudentModal } from "@/components/admin/EnrollExistingStudentModal";
import pb from "@/lib/pocketbase";

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

// --- Course Details Page ---
export default function CourseDetailsPage() {
  const params = useParams();
  const intakeId = typeof params?.intakeId === "string" ? params.intakeId : "";
  const courseId = typeof params?.courseId === "string" ? params.courseId : "";
  const router = useRouter();

  // Real data state
  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [courseIntake, setCourseIntake] = useState<any>(null);
  const [fees, setFees] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [allLecturers, setAllLecturers] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  // Edit form state (matching create course modal structure)
  const [editCourse, setEditCourse] = useState({
    name: "",
    code: "",
    start_date: "",
    end_date: "",
    isSemesterBased: false,
    semesterCount: 1,
    course_fee: "",
    registration_fee: "",
    duration: "",
  });

  useEffect(() => {
    if (intakeId && courseId) fetchData();
  }, [intakeId, courseId]);

  async function fetchData() {
    try {
      setLoading(true);
      const [intakeRecord, courseRecord, courseIntakesData] = await Promise.all(
        [
          pb.collection("intakes").getOne(intakeId),
          pb.collection("courses").getOne(courseId),
          pb.collection("course_intakes").getFullList({
            filter: `intake="${intakeId}"&&course="${courseId}"`,
          }),
        ],
      );

      const courseIntakeRecord = courseIntakesData[0] ?? null;
      setIntake(intakeRecord);
      setCourse(courseRecord);
      setCourseIntake(courseIntakeRecord);

      // Fetch fees using course_intake relation
      let feesRecord = null;
      if (courseIntakeRecord?.id) {
        const feesData = await pb
          .collection("course_intake_fees")
          .getFullList({
            filter: `course_intake="${courseIntakeRecord.id}"`,
          })
          .catch(() => []);
        feesRecord = feesData[0] ?? null;
      }
      setFees(feesRecord);

      // Populate edit form with current data
      const startDate = courseIntakeRecord?.start_date
        ? formatDate(courseIntakeRecord.start_date)
        : "";
      const endDate = courseIntakeRecord?.end_date
        ? formatDate(courseIntakeRecord.end_date)
        : "";

      // Calculate duration
      let duration = "";
      if (startDate && endDate) {
        const months =
          (new Date(endDate).getFullYear() -
            new Date(startDate).getFullYear()) *
            12 +
          (new Date(endDate).getMonth() - new Date(startDate).getMonth());
        duration = String(Math.max(0, months));
      }

      setEditCourse({
        name: courseRecord.name,
        code: courseRecord.code,
        start_date: startDate,
        end_date: endDate,
        isSemesterBased: courseIntakeRecord?.is_semester_based || false,
        semesterCount: courseIntakeRecord?.semester_count || 1,
        course_fee: feesRecord?.course_fee ? String(feesRecord.course_fee) : "",
        registration_fee: feesRecord?.registration_fee
          ? String(feesRecord.registration_fee)
          : "",
        duration: duration,
      });

      // Fetch subjects and lecturers
      if (courseIntakeRecord?.id) {
        const subjectsData = await pb
          .collection("course_subjects")
          .getFullList({
            filter: `course_intake="${courseIntakeRecord.id}"`,
            expand: "subject,lecturer",
            sort: "semester,created",
          });

        const formattedSubjects = subjectsData.map((cs: any) => {
          const subjects = Array.isArray(cs.expand?.subject)
            ? cs.expand.subject
            : cs.expand?.subject
              ? [cs.expand.subject]
              : [];

          return {
            id: cs.id,
            name: subjects.map((s: any) => s.name).join(", ") || "No Subject",
            code: subjects.map((s: any) => s.code).join(", ") || "N/A",
            semester: cs.semester || "Semester 1",
            assignedLecturer: cs.expand?.lecturer?.name || "Not Assigned",
            credits: cs.credits || 0,
          };
        });

        setCourseSubjects(formattedSubjects);

        // Fetch all lecturers for the assignment modal
        const lecturersData = await pb.collection("users").getFullList({
          filter: 'role="lecturer"',
          sort: "name",
        });
        setAllLecturers(lecturersData);

        // Fetch all available subjects for the add subject modal
        const allAvailableSubjects = await pb
          .collection("subjects")
          .getFullList({
            sort: "name",
          });
        setAvailableSubjects(allAvailableSubjects);
      }
    } catch (error: any) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to load course details");
      if (error?.status === 404)
        router.push(`/dashboard/admin/intakes/${intakeId}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEditCourse(e: React.FormEvent) {
    e.preventDefault();
    try {
      setEditLoading(true);

      // Update course
      await pb.collection("courses").update(courseId, {
        name: editCourse.name,
        code: editCourse.code,
      });

      // Update course intake
      if (courseIntake?.id) {
        await pb.collection("course_intakes").update(courseIntake.id, {
          start_date: editCourse.start_date,
          end_date: editCourse.end_date,
          is_semester_based: editCourse.isSemesterBased,
          semester_count: editCourse.isSemesterBased
            ? editCourse.semesterCount
            : null,
        });
      }

      // Update or create fees
      if (courseIntake?.id) {
        if (fees?.id) {
          // Update existing fees
          await pb.collection("course_intake_fees").update(fees.id, {
            course_fee: parseFloat(editCourse.course_fee) || 0,
            registration_fee: parseFloat(editCourse.registration_fee) || 0,
          });
        } else {
          // Create new fees record
          await pb.collection("course_intake_fees").create({
            course_intake: courseIntake.id,
            course_fee: parseFloat(editCourse.course_fee) || 0,
            registration_fee: parseFloat(editCourse.registration_fee) || 0,
          });
        }
      }

      // Update local state
      setCourse({ ...course, name: editCourse.name, code: editCourse.code });
      setCourseIntake({
        ...courseIntake,
        start_date: editCourse.start_date,
        end_date: editCourse.end_date,
        is_semester_based: editCourse.isSemesterBased,
        semester_count: editCourse.isSemesterBased
          ? editCourse.semesterCount
          : null,
      });
      setFees({
        ...fees,
        course_fee: parseFloat(editCourse.course_fee) || 0,
        registration_fee: parseFloat(editCourse.registration_fee) || 0,
      });

      toast.success("Course updated successfully");
      setShowEditModal(false);
    } catch (error: any) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course changes");
    } finally {
      setEditLoading(false);
    }
  }

  const [activeTab, setActiveTab] = useState(0);
  const [studentsRefreshKey, setStudentsRefreshKey] = useState(0);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showAssignmentDetailModal, setShowAssignmentDetailModal] =
    useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  const [courseSubjects, setCourseSubjects] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [selectedSubjectsInModal, setSelectedSubjectsInModal] = useState<
    { id: string; credits: number }[]
  >([]);
  const [subjectToAssign, setSubjectToAssign] = useState<any>(null);
  const [lecturerSearchQuery, setLecturerSearchQuery] = useState("");

  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [selectedAdminAssignment, setSelectedAdminAssignment] =
    useState<any>(null);
  const [assignmentModalSemester, setAssignmentModalSemester] =
    useState("Semester 1");
  const [assignmentModalSubject, setAssignmentModalSubject] = useState<
    string | null
  >(null);
  const [assignmentModalStage, setAssignmentModalStage] = useState(1);
  const [assignmentForm, setAssignmentForm] = useState<any>({
    title: "",
    totalMarks: 100,
    rules: "",
    unlockDate: "2026-05-01",
    dueDate: "2026-06-01",
    markingLecturer: "",
    assignmentSheet: null,
  });

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Loading course details...
          </p>
        </div>
      </div>
    );
  }

  if (!intake || !course || !courseIntake) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Course Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            This course or intake could not be found.
          </p>
          <button
            onClick={() => router.push(`/dashboard/admin/intakes/${intakeId}`)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Back to Intake
          </button>
        </div>
      </div>
    );
  }

  const tabList = [
    { label: "Students", icon: Users },
    { label: "Subjects", icon: BookOpen },
    { label: "Assignments", icon: Layers },
    { label: "Materials", icon: Video },
  ];

  const groupedSubjects = courseSubjects.reduce((acc: any, subj) => {
    if (!acc[subj.semester]) acc[subj.semester] = [];
    acc[subj.semester].push(subj);
    return acc;
  }, {});

  const groupedAssignments = courseAssignments.reduce((acc: any, asgn) => {
    if (!acc[asgn.semester]) acc[asgn.semester] = [];
    acc[asgn.semester].push(asgn);
    return acc;
  }, {});

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans">
      <AdminBreadcrumbs
        items={[
          { label: "Intakes", href: "/dashboard/admin/intakes" },
          {
            label: intake?.code || "Intake",
            href: intake ? `/dashboard/admin/intakes/${intake.id}` : undefined,
          },
          { label: course?.name || "Course" },
        ]}
      />
      {/* Header Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 mb-8 flex flex-col gap-8 transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-4 ring-indigo-50">
              <BookOpen size={40} />
            </div>
            <div>
              <div className="text-4xl font-black text-gray-900 tracking-tight">
                {course.name}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-gray-400 text-sm font-black uppercase tracking-widest">
                  {course.code}
                </span>
                <span className="text-gray-200">•</span>
                <span className="text-indigo-500 text-sm font-black uppercase tracking-widest">
                  {intake.code}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <button
              className="px-8 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-95 flex items-center gap-2"
              onClick={() => setShowEditModal(true)}
            >
              <Edit size={16} />
              EDIT COURSE
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col bg-gray-50/50 border border-gray-100 rounded-3xl p-6 hover:bg-white transition-all group">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">
              START DATE
            </span>
            <span className="text-xl font-bold text-gray-900">
              {formatDate(courseIntake.start_date)}
            </span>
          </div>
          <div className="flex flex-col bg-gray-50/50 border border-gray-100 rounded-3xl p-6 hover:bg-white transition-all group">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">
              END DATE
            </span>
            <span className="text-xl font-bold text-gray-900">
              {formatDate(courseIntake.end_date)}
            </span>
          </div>
          <div className="flex flex-col bg-gray-50/50 border border-gray-100 rounded-3xl p-6 hover:bg-white transition-all group">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">
              COURSE FEE
            </span>
            <span className="text-xl font-bold text-gray-900">
              LKR {(fees?.course_fee || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col bg-gray-50/50 border border-gray-100 rounded-3xl p-6 hover:bg-white transition-all group">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">
              REGISTRATION FEE
            </span>
            <span className="text-xl font-bold text-gray-900">
              LKR {(fees?.registration_fee || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-2 mb-8 inline-flex gap-1 overflow-x-auto max-w-full">
        {tabList.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all whitespace-nowrap ${
              activeTab === idx
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            <tab.icon size={18} />
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 0 && (
          <StudentsList
            courseIntakeId={courseIntake?.id}
            onAdd={() => setShowAddStudentModal(true)}
            refreshKey={studentsRefreshKey}
          />
        )}
        {activeTab === 1 && (
          <SubjectsTab
            groupedSubjects={groupedSubjects}
            onAdd={() => setShowAddSubjectModal(true)}
            onAssign={(subj: any) => {
              setSubjectToAssign(subj);
              setShowLecturerModal(true);
            }}
          />
        )}
        {activeTab === 2 && (
          <AssignmentsTab
            groupedAssignments={groupedAssignments}
            onAdd={() => setShowAddAssignmentModal(true)}
            onView={(asgn: any) => {
              setSelectedAdminAssignment(asgn);
              setShowAssignmentDetailModal(true);
            }}
            router={router}
          />
        )}
        {activeTab === 3 && <MaterialsTab />}
      </div>

      {/* --- MODALS --- */}

      {/* Edit Course Modal */}
      <ModernModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Edit Course Intake"
        subtitle="Modify course details, dates, semester and fees."
        avatarChar="E"
        avatarColor="bg-orange-500"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEditCourse(e);
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Course Code
              </label>
              <input
                type="text"
                value={editCourse.code}
                onChange={(e) =>
                  setEditCourse({ ...editCourse, code: e.target.value })
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                placeholder="e.g. BBM/MARCH/2026"
                required
                disabled={editLoading}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Course Name
              </label>
              <input
                type="text"
                value={editCourse.name}
                onChange={(e) =>
                  setEditCourse({ ...editCourse, name: e.target.value })
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                required
                disabled={editLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Start Date
              </label>
              <input
                type="date"
                value={editCourse.start_date}
                onChange={(e) => {
                  const start = e.target.value;
                  const end = editCourse.end_date;
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
                  setEditCourse((prev) => ({
                    ...prev,
                    start_date: start,
                    duration: String(months),
                  }));
                }}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                required
                disabled={editLoading}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                End Date
              </label>
              <input
                type="date"
                value={editCourse.end_date}
                onChange={(e) => {
                  const end = e.target.value;
                  const start = editCourse.start_date;
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
                  setEditCourse((prev) => ({
                    ...prev,
                    end_date: end,
                    duration: String(months),
                  }));
                }}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                required
                disabled={editLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 group transition-all hover:border-orange-100">
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
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none shadow-sm ${editCourse.isSemesterBased ? "bg-orange-600 ring-4 ring-orange-50" : "bg-gray-300"}`}
              onClick={() =>
                setEditCourse((prev) => ({
                  ...prev,
                  isSemesterBased: !prev.isSemesterBased,
                  semesterCount: 1,
                }))
              }
              disabled={editLoading}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all shadow-md ${editCourse.isSemesterBased ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {editCourse.isSemesterBased && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Number of Semesters
              </label>
              <input
                type="number"
                min={1}
                max={4}
                value={editCourse.semesterCount || 1}
                onChange={(e) =>
                  setEditCourse((prev) => ({
                    ...prev,
                    semesterCount: Math.max(
                      1,
                      Math.min(4, Number(e.target.value)),
                    ),
                  }))
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                required
                disabled={editLoading}
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
                  LKR
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={editCourse.course_fee}
                  onChange={(e) =>
                    setEditCourse((prev) => ({
                      ...prev,
                      course_fee: e.target.value,
                    }))
                  }
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                  required
                  disabled={editLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Registration Fee
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                  LKR
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={editCourse.registration_fee}
                  onChange={(e) =>
                    setEditCourse((prev) => ({
                      ...prev,
                      registration_fee: e.target.value,
                    }))
                  }
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                  required
                  disabled={editLoading}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
              Duration (months)
            </label>
            <input
              type="text"
              value={editCourse.duration}
              readOnly
              className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-600 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
            <button
              type="submit"
              disabled={editLoading}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {editLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  SAVING...
                </>
              ) : (
                <>
                  <Check size={16} />
                  SAVE CHANGES
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              disabled={editLoading}
              className="w-full py-2 font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest disabled:opacity-50"
            >
              CANCEL
            </button>
          </div>
        </form>
      </ModernModal>

      {/* Add Subject Modal */}
      <ModernModal
        open={showAddSubjectModal}
        onOpenChange={setShowAddSubjectModal}
        title="Add New Subject"
        subtitle="Select a semester and subjects to link with this course."
        avatarChar="S"
        avatarColor="bg-indigo-600"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
              Target Semester
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Array.from(
                { length: courseIntake?.semester_count || 1 },
                (_, i) => `Semester ${i + 1}`,
              ).map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-4 py-3 rounded-2xl text-xs font-black tracking-widest border-2 transition-all ${
                    selectedSemester === sem
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-50 bg-gray-50/50 text-gray-400"
                  }`}
                >
                  {sem.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
              Search & Select
            </label>
            <div className="relative mb-4">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={subjectSearchQuery}
                onChange={(e) => setSubjectSearchQuery(e.target.value)}
                placeholder="Find subjects..."
                className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
              />
            </div>
            <div className="max-h-52 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {availableSubjects
                .filter(
                  (s) =>
                    s.name
                      .toLowerCase()
                      .includes(subjectSearchQuery.toLowerCase()) ||
                    s.code
                      .toLowerCase()
                      .includes(subjectSearchQuery.toLowerCase()),
                )
                .map((subj) => (
                  <div
                    key={subj.id}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      selectedSubjectsInModal.some((s) => s.id === subj.id)
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-50 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setSelectedSubjectsInModal((prev) =>
                          prev.some((s) => s.id === subj.id)
                            ? prev.filter((s) => s.id !== subj.id)
                            : [...prev, { id: subj.id, credits: 3 }],
                        )
                      }
                      className="flex-1 flex flex-col items-start text-left"
                    >
                      <span className="font-bold text-gray-900">
                        {subj.name}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {subj.code}
                      </span>
                    </button>
                    {selectedSubjectsInModal.some((s) => s.id === subj.id) && (
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end mr-2">
                          <label className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">
                            Credits
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={
                              selectedSubjectsInModal.find(
                                (s) => s.id === subj.id,
                              )?.credits || 3
                            }
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setSelectedSubjectsInModal((prev) =>
                                prev.map((s) =>
                                  s.id === subj.id ? { ...s, credits: val } : s,
                                ),
                              );
                            }}
                            className="w-16 px-2 py-1 bg-white border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-center"
                          />
                        </div>
                        <Check size={18} className="text-indigo-600" />
                      </div>
                    )}
                  </div>
                ))}
              {availableSubjects.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm font-bold">
                  No subjects available
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
            <button
              onClick={async () => {
                try {
                  const selectedSubjects = selectedSubjectsInModal;
                  if (selectedSubjects.length === 0) return;

                  // Create course_subjects records for each selected subject
                  await Promise.all(
                    selectedSubjects.map((s) =>
                      pb.collection("course_subjects").create({
                        course_intake: courseIntake.id,
                        subject: s.id,
                        semester: selectedSemester,
                        credits: s.credits,
                      }),
                    ),
                  );

                  // Re-fetch data to update the UI
                  fetchData();

                  toast.success(
                    `Added ${selectedSubjects.length} subjects to ${selectedSemester}`,
                  );
                  setShowAddSubjectModal(false);
                  setSelectedSubjectsInModal([]);
                } catch (error) {
                  console.error("Error adding subjects:", error);
                  toast.error("Failed to add subjects");
                }
              }}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest disabled:opacity-50"
              disabled={selectedSubjectsInModal.length === 0}
            >
              ADD {selectedSubjectsInModal.length || ""} SUBJECTS
            </button>
            <button
              onClick={() => setShowAddSubjectModal(false)}
              className="w-full py-2 font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
            >
              CANCEL
            </button>
          </div>
        </div>
      </ModernModal>

      {/* Lecturer Modal */}
      <ModernModal
        open={showLecturerModal}
        onOpenChange={setShowLecturerModal}
        title="Assign Lecturer"
        subtitle={`Select an instructor for ${subjectToAssign?.name}`}
        avatarChar="L"
        avatarColor="bg-violet-600"
      >
        <div className="space-y-6">
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={lecturerSearchQuery}
              onChange={(e) => setLecturerSearchQuery(e.target.value)}
              placeholder="Find lecturers..."
              className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
            />
          </div>
          <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {allLecturers
              .filter((l) =>
                l.name
                  .toLowerCase()
                  .includes(lecturerSearchQuery.toLowerCase()),
              )
              .map((lecturer) => (
                <button
                  key={lecturer.id}
                  onClick={async () => {
                    try {
                      await pb
                        .collection("course_subjects")
                        .update(subjectToAssign.id, {
                          lecturer: lecturer.id,
                        });

                      // Update local state
                      setCourseSubjects((prev) =>
                        prev.map((s) =>
                          s.id === subjectToAssign.id
                            ? { ...s, assignedLecturer: lecturer.name }
                            : s,
                        ),
                      );

                      toast.success(
                        `${lecturer.name} assigned to ${subjectToAssign?.name}`,
                      );
                      setShowLecturerModal(false);
                    } catch (error) {
                      console.error("Error assigning lecturer:", error);
                      toast.error("Failed to assign lecturer");
                    }
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-white hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {lecturer.name.charAt(0)}
                  </div>
                  <span className="font-bold text-gray-900">
                    {lecturer.name}
                  </span>
                </button>
              ))}
            {allLecturers.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm font-bold">
                No lecturers available
              </div>
            )}
          </div>
          <button
            onClick={() => setShowLecturerModal(false)}
            className="w-full py-2 font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
          >
            CANCEL
          </button>
        </div>
      </ModernModal>

      {/* Add Assignment Modal (Multi-Stage) */}
      <ModernModal
        open={showAddAssignmentModal}
        onOpenChange={setShowAddAssignmentModal}
        title={
          assignmentModalStage === 1 ? "New Assignment" : "Configure Assignment"
        }
        subtitle={
          assignmentModalStage === 1
            ? "Select course components."
            : "Set requirements and deadlines."
        }
        avatarChar="A"
        avatarColor="bg-indigo-600"
      >
        <div className="space-y-6">
          <div className="flex gap-2 mb-4">
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${assignmentModalStage >= 1 ? "bg-indigo-600" : "bg-gray-100"}`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${assignmentModalStage === 2 ? "bg-indigo-600" : "bg-gray-100"}`}
            />
          </div>

          {assignmentModalStage === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Semester
                </label>
                <select
                  value={assignmentModalSemester}
                  onChange={(e) => setAssignmentModalSemester(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl font-bold text-sm"
                >
                  {Object.keys(groupedSubjects).map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Subject
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {groupedSubjects[assignmentModalSemester]?.map(
                    (subj: any) => (
                      <button
                        key={subj.code}
                        onClick={() => setAssignmentModalSubject(subj.code)}
                        className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                          assignmentModalSubject === subj.code
                            ? "border-indigo-600 bg-indigo-50 shadow-sm"
                            : "border-gray-50 bg-white"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">
                            {subj.name}
                          </span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {subj.code}
                          </span>
                        </div>
                        {assignmentModalSubject === subj.code && (
                          <Check size={18} className="text-indigo-600" />
                        )}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <button
                onClick={() => setAssignmentModalStage(2)}
                disabled={!assignmentModalSubject}
                className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
              >
                NEXT STEP <ArrowRight size={18} />
              </button>
            </div>
          )}

          {assignmentModalStage === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Assignment Title"
                    className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl font-bold text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      defaultValue={100}
                      className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                      Lecturer
                    </label>
                    <select className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl font-bold text-sm">
                      <option value="">-- No lecturers available --</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                      Unlock
                    </label>
                    <input
                      type="date"
                      className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl font-bold text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Instructions
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-5 py-4 bg-gray-100 border-none rounded-3xl font-medium text-sm resize-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex flex-col gap-3">
                <button
                  onClick={() => {
                    toast.success("Assignment created!");
                    setShowAddAssignmentModal(false);
                    setAssignmentModalStage(1);
                  }}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <Check size={18} /> CREATE NOW
                </button>
                <button
                  onClick={() => setAssignmentModalStage(1)}
                  className="w-full py-3 font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> BACK
                </button>
              </div>
            </div>
          )}
        </div>
      </ModernModal>

      {/* Admin Assignment Detail Modal */}
      <ModernModal
        open={showAssignmentDetailModal}
        onOpenChange={setShowAssignmentDetailModal}
        title="Assignment Details"
        subtitle={selectedAdminAssignment?.subjectCode || "Overview"}
        avatarChar="i"
        avatarColor="bg-indigo-600"
      >
        <div className="space-y-8">
          <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-sm">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">
              Title
            </label>
            <h3 className="text-xl font-bold text-gray-900">
              {selectedAdminAssignment?.title}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Total Marks
              </label>
              <Badge className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black">
                {selectedAdminAssignment?.totalMarks}
              </Badge>
            </div>
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Semester
              </label>
              <span className="font-bold text-gray-900">
                {selectedAdminAssignment?.semester}
              </span>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
              Allocated Lecturer
            </label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
                <User size={24} />
              </div>
              <div>
                <div className="font-bold text-gray-900">
                  {selectedAdminAssignment?.markingLecturer}
                </div>
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  Marking In-Charge
                </div>
              </div>
            </div>
          </div>

          {selectedAdminAssignment?.rules && (
            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
              <label className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">
                <Info size={14} /> Guidelines
              </label>
              <p className="text-sm font-medium text-amber-900 opacity-80 leading-relaxed whitespace-pre-line">
                {selectedAdminAssignment.rules}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() =>
                router.push(
                  `/dashboard/admin/assignments/${selectedAdminAssignment?.id}`,
                )
              }
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              VIEW SUBMISSIONS <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setShowAssignmentDetailModal(false)}
              className="w-full py-2 font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
            >
              CLOSE PREVIEW
            </button>
          </div>
        </div>
      </ModernModal>

      {/* Add Student to Course Modal */}
      <EnrollExistingStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => {
          setShowAddStudentModal(false);
          setStudentsRefreshKey((prev) => prev + 1); // Trigger refresh
        }}
        intakeId={intakeId}
        courseIntakeId={courseIntake?.id || ""}
      />
    </div>
  );
}

// --- Sub-Components ---

function StudentsList({
  courseIntakeId,
  onAdd,
  refreshKey,
}: {
  courseIntakeId?: string;
  onAdd?: () => void;
  refreshKey?: number;
}) {
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (courseIntakeId) {
      fetchEnrolledStudents();
    }
  }, [courseIntakeId, refreshKey]);

  async function fetchEnrolledStudents() {
    if (!courseIntakeId) return;

    try {
      setLoading(true);
      const enrollments = await pb.collection("enrollments").getFullList({
        filter: `course_intake="${courseIntakeId}"`,
        expand: "student",
        sort: "-created",
      });

      const formattedStudents = enrollments.map((enrollment: any) => ({
        id: enrollment.id,
        reg: enrollment.registration_number || "N/A",
        name: enrollment.expand?.student?.name || "Unknown",
        date: new Date(
          enrollment.enrollment_date || enrollment.created,
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        status: enrollment.enrollement_status || "enrolled",
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
      toast.error("Failed to load enrolled students");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
            Enrolled Students
          </h3>
          <p className="text-xs font-medium text-gray-500 mt-1">
            {loading
              ? "Loading..."
              : `${students.length} student${students.length !== 1 ? "s" : ""} in this course`}
          </p>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={18} /> ADD STUDENT
          </button>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={48} className="text-gray-300 mb-4" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              No students enrolled yet
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Click "ADD STUDENT" to enroll students in this course
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-10 py-6 text-left">Reg No</th>
                  <th className="px-10 py-6 text-left">Student Name</th>
                  <th className="px-10 py-6 text-left">Enrolled</th>
                  <th className="px-10 py-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="group hover:bg-indigo-50/30 transition-all cursor-pointer"
                  >
                    <td className="px-10 py-6">
                      <span className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
                        {s.reg}
                      </span>
                    </td>
                    <td className="px-10 py-6 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {s.name}
                    </td>
                    <td className="px-10 py-6 text-sm text-gray-500 font-bold">
                      {s.date}
                    </td>
                    <td className="px-10 py-6 text-center">
                      <Badge
                        className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          s.status === "enrolled"
                            ? "bg-green-500 text-white"
                            : s.status === "completed"
                              ? "bg-blue-500 text-white"
                              : s.status === "dropped-out"
                                ? "bg-orange-500 text-white"
                                : s.status === "expelled"
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-400 text-white"
                        }`}
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
      </div>
    </div>
  );
}

function SubjectsTab({ groupedSubjects, onAdd, onAssign }: any) {
  // Sort semesters numerically/alphabetically
  const sortedSemesters = Object.entries(groupedSubjects).sort(([a], [b]) => {
    // Attempt to extract numbers for sorting (e.g. "Semester 1", "Semester 10")
    const numA = parseInt(a.replace(/^\D+/g, ""));
    const numB = parseInt(b.replace(/^\D+/g, ""));
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={18} /> ADD SUBJECT
        </button>
      </div>
      {sortedSemesters.length > 0 ? (
        sortedSemesters.map(([sem, subjects]: any) => (
          <div
            key={sem}
            className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm"
          >
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-600 rounded-full" /> {sem}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((subj: any, i: number) => (
                <div
                  key={i}
                  className="p-6 bg-gray-50/50 border border-gray-100 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                      {subj.name}
                    </span>
                    <div
                      onClick={() => onAssign(subj)}
                      className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-400 group-hover:text-indigo-400 transition-colors cursor-pointer hover:underline"
                    >
                      <User size={12} /> {subj.assignedLecturer}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-white text-gray-400 border border-gray-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      {subj.code}
                    </Badge>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                        Credits:
                      </span>
                      <span className="text-xs font-black text-indigo-600">
                        {subj.credits}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            No subjects assigned to this course yet
          </p>
        </div>
      )}
    </div>
  );
}

function AssignmentsTab({ groupedAssignments, onAdd, onView, router }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={18} /> ADD ASSIGNMENT
        </button>
      </div>
      {Object.entries(groupedAssignments).map(([sem, assignments]: any) => (
        <div
          key={sem}
          className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm"
        >
          <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-3">
            <div className="w-2 h-8 bg-indigo-600 rounded-full" /> {sem}
          </h3>
          <div className="space-y-3">
            {assignments.map((asgn: any, i: number) => (
              <div
                key={i}
                className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gray-50/50 border border-gray-100 rounded-3xl hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100">
                    <Layers size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {asgn.title}
                    </span>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      {asgn.subjectCode}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Deadline
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {asgn.dueDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(asgn)}
                      className="p-3 bg-white border border-gray-100 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      <Info size={18} />
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/admin/assignments/${asgn.id}`)
                      }
                      className="p-3 bg-white border border-gray-100 rounded-xl text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MaterialsTab() {
  const subjects: any[] = [];
  const [materials, setMaterials] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    type: string;
    subjectId: string;
    file: string | null;
    videoUrl: string;
  }>({
    title: "",
    type: "document",
    subjectId: "",
    file: null,
    videoUrl: "",
  });

  interface Material {
    id: string;
    title: string;
    type: "document" | "video";
    subjectId: string;
    date: string;
    file?: string | null;
    videoUrl?: string;
  }

  interface MaterialFormData {
    title: string;
    type: "document" | "video";
    subjectId: string;
    file: string | null;
    videoUrl: string;
  }

  const handleAddMaterial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title || !formData.subjectId) return;
    console.log("Adding material:", formData);
    setMaterials([
      {
        id: `mat-${Date.now()}`,
        title: formData.title,
        type: formData.type,
        subjectId: formData.subjectId,
        date: new Date().toISOString().slice(0, 10),
        file: formData.type === "document" ? formData.file : undefined,
        videoUrl: formData.type === "video" ? formData.videoUrl : undefined,
      } as Material,
      ...materials,
    ]);
    setShowAddForm(false);
    setFormData({
      title: "",
      type: "document",
      subjectId: subjects[0]?.id || "",
      file: null,
      videoUrl: "",
    });
  };

  // Group materials by subject and type
  const grouped = subjects.map((subject) => ({
    ...subject,
    documents: materials.filter(
      (m) => m.subjectId === subject.id && m.type === "document",
    ),
    videos: materials.filter(
      (m) => m.subjectId === subject.id && m.type === "video",
    ),
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "Cancel" : "+ Add Material"}
        </button>
      </div>
      {showAddForm && (
        <form
          className="bg-white border border-gray-100 rounded-2xl p-6 mb-6"
          onSubmit={handleAddMaterial}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter material title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) =>
                  setFormData({ ...formData, subjectId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {subjects.length === 0 ? (
                  <option value="">No subjects available</option>
                ) : (
                  subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="document">Document (.pdf, .docx, .pptx)</option>
                <option value="video">Video (YouTube or local)</option>
              </select>
            </div>
            {formData.type === "video" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Video URL (YouTube or local)
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://youtube.com/... or local video URL"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Document File (mock)
                </label>
                <input
                  type="text"
                  value={formData.file || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, file: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="file-name.pdf"
                  required
                />
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Add Material
            </button>
          </div>
        </form>
      )}
      {grouped.map((subject) => (
        <div
          key={subject.id}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {subject.name}
          </h3>
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Documents</h4>
            {subject.documents.length === 0 ? (
              <div className="text-gray-400 text-sm mb-2">
                No documents uploaded.
              </div>
            ) : (
              <ul className="space-y-2">
                {subject.documents.map((doc: any) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <span className="font-medium text-gray-900">
                      {doc.title}
                    </span>
                    <span className="text-xs text-gray-400">{doc.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Videos</h4>
            {subject.videos.length === 0 ? (
              <div className="text-gray-400 text-sm mb-2">
                No videos uploaded.
              </div>
            ) : (
              <ul className="space-y-2">
                {subject.videos.map((vid: any) => (
                  <li
                    key={vid.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <span className="font-medium text-gray-900">
                      {vid.title}
                    </span>
                    <a
                      href={vid.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      View Video
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
