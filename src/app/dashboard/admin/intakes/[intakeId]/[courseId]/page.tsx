"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  BookOpen,
  Layers,
  Users,
  Video,
  Plus,
  Filter,
  User,
  Check,
  ArrowRight,
  ArrowLeft,
  Download,
  Info,
  Loader2,
  ChevronDown,
  FileText,
  Youtube,
  Film,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Upload,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { ModernModal } from "@/components/ui/modern-modal";
import { DashboardBreadcrumbs } from "@/components/dashboard/shared/DashboardBreadcrumbs";
import { EnrollExistingStudentModal } from "@/components/admin/EnrollExistingStudentModal";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import pb from "@/lib/pocketbase";
import { RecordModel } from "pocketbase";

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
  is_semester_based: boolean;
  semester_count: number | null;
  course_status: string;
}

interface Fee {
  id: string;
  course_intake: string;
  course_fee: number;
  registration_fee: number;
  duration: number;
}

interface UserRecord {
  id: string;
  name: string;
  username: string;
  role: string;
  avatar?: string;
  userId?: string;
  email?: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface CourseSubject {
  id: string;
  name: string;
  code: string;
  semester: string;
  assignedLecturer: string;
  credits: number;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  dueDate: string;
  semester: string;
  totalMarks?: number | string;
  markingLecturer?: string;
  rules?: string;
  [key: string]: unknown; // To handle expanded data flexibility
}

interface EnrollmentRecord {
  id: string;
  created: string;
  course_intake: string;
  registration_number: string;
  enrollement_status: string;
  enrollment_date: string;
  expand?: {
    student?: UserRecord & { collectionId: string };
  };
}

interface Material {
  id: string;
  title: string;
  description: string;
  type: "document" | "youtube-link" | "video-link" | "video-upload";
  video_url: string;
  file: string;
  visible: boolean;
  can_download: boolean;
  course_subject: string | string[];
  created: string;
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
  const [intake, setIntake] = useState<Intake | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseIntake, setCourseIntake] = useState<CourseIntake | null>(null);
  const [fees, setFees] = useState<Fee | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [allLecturers, setAllLecturers] = useState<UserRecord[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

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

  const fetchData = useCallback(async () => {
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
      setIntake(intakeRecord as unknown as Intake);
      setCourse(courseRecord as unknown as Course);
      setCourseIntake(courseIntakeRecord as unknown as CourseIntake);

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
      setFees(feesRecord as unknown as Fee);

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

        const formattedSubjects: CourseSubject[] = (subjectsData as unknown as Array<RecordModel & { expand?: { subject?: Subject | Subject[]; lecturer?: UserRecord } }>).map((cs) => {
          const subjects = Array.isArray(cs.expand?.subject)
            ? cs.expand.subject
            : cs.expand?.subject
              ? [cs.expand.subject]
              : [];

          return {
            id: cs.id,
            name: (subjects as Subject[]).map((s) => s.name).join(", ") || "No Subject",
            code: (subjects as Subject[]).map((s) => s.code).join(", ") || "N/A",
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
        setAllLecturers(lecturersData as unknown as UserRecord[]);

        // Fetch all available subjects for the add subject modal
        const allAvailableSubjects = await pb
          .collection("subjects")
          .getFullList({
            sort: "name",
          });
        setAvailableSubjects(allAvailableSubjects as unknown as Subject[]);
      }
    } catch (error: unknown) {
      console.error("Error fetching course details:", error);
      const err = error as { status?: number };
      toast.error("Failed to load course details");
      if (err?.status === 404)
        router.push(`/dashboard/admin/intakes/${intakeId}`);
    } finally {
      setLoading(false);
    }
  }, [intakeId, courseId, router]); // Added router to exhaustive-deps

  useEffect(() => {
    if (intakeId && courseId) fetchData();
  }, [intakeId, courseId, fetchData]);

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
      setCourse({
        ...course,
        name: editCourse.name,
        code: editCourse.code,
      } as Course);
      setCourseIntake({
        ...courseIntake,
        start_date: editCourse.start_date,
        end_date: editCourse.end_date,
        is_semester_based: editCourse.isSemesterBased,
        semester_count: editCourse.isSemesterBased
          ? editCourse.semesterCount
          : null,
      } as CourseIntake);
      setFees({
        ...fees,
        course_fee: parseFloat(editCourse.course_fee) || 0,
        registration_fee: parseFloat(editCourse.registration_fee) || 0,
      } as Fee);

      toast.success("Course updated successfully");
      setShowEditModal(false);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Error saving course:", err);
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

  const [courseSubjects, setCourseSubjects] = useState<CourseSubject[]>([]);
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [selectedSubjectsInModal, setSelectedSubjectsInModal] = useState<
    { id: string; credits: number }[]
  >([]);
  const [subjectToAssign, setSubjectToAssign] = useState<CourseSubject | null>(
    null,
  );
  const [lecturerSearchQuery, setLecturerSearchQuery] = useState("");

  const [courseAssignments] = useState<Assignment[]>([]);
  const [selectedAdminAssignment, setSelectedAdminAssignment] =
    useState<Assignment | null>(null);
  const [assignmentModalSemester, setAssignmentModalSemester] =
    useState("Semester 1");
  const [assignmentModalSubject, setAssignmentModalSubject] = useState<
    string | null
  >(null);
  const [assignmentModalStage, setAssignmentModalStage] = useState(1);

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
            Please double check all fields before saving. You can&apos;t undo once confirmed.
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

  const groupedSubjects = courseSubjects.reduce<Record<string, CourseSubject[]>>(
    (acc, subj) => {
      if (!acc[subj.semester]) acc[subj.semester] = [];
      acc[subj.semester].push(subj);
      return acc;
    },
    {},
  );

  const groupedAssignments = courseAssignments.reduce<
    Record<string, Assignment[]>
  >((acc, asgn) => {
    if (!acc[asgn.semester]) acc[asgn.semester] = [];
    acc[asgn.semester].push(asgn);
    return acc;
  }, {}); // Removed courseIntakeId from exhaustive-deps

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8 font-sans">
      <DashboardBreadcrumbs
        homeHref="/dashboard/admin"
        homeLabel="Dashboard"
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
            courseEndDate={courseIntake?.end_date}
            onAdd={() => setShowAddStudentModal(true)}
            refreshKey={studentsRefreshKey}
          />
        )}
        {activeTab === 1 && (
          <SubjectsTab
            groupedSubjects={groupedSubjects}
            onAdd={() => setShowAddSubjectModal(true)}
            onAssign={(subj: CourseSubject) => {
              setSubjectToAssign(subj);
              setShowLecturerModal(true);
            }}
          />
        )}
        {activeTab === 2 && (
          <AssignmentsTab
            groupedAssignments={groupedAssignments}
            onAdd={() => setShowAddAssignmentModal(true)}
            onView={(asgn: Assignment) => {
              setSelectedAdminAssignment(asgn);
              setShowAssignmentDetailModal(true);
            }}
            router={router}
          />
        )}
        {activeTab === 3 && (
          <MaterialsTab
            courseSubjects={courseSubjects}
            courseIntakeId={courseIntake?.id}
          />
        )}
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
              className="w-full py-2 font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
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
                      if (subjectToAssign) {
                        await pb
                          .collection("course_subjects")
                          .update(subjectToAssign.id, {
                            lecturer: lecturer.id,
                          });

                        // Update local state
                        setCourseSubjects((prev) =>
                          prev.map((s) =>
                            s.id === (subjectToAssign as CourseSubject).id
                              ? { ...s, assignedLecturer: lecturer.name }
                              : s,
                          ),
                        );
                      }

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
                  {lecturer.avatar ? (
                    <Image
                      src={pb.files.getURL(lecturer, lecturer.avatar, {
                        thumb: "100x100",
                      })}
                      alt={lecturer.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-100 group-hover:ring-indigo-400 transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {lecturer.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">
                      {lecturer.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {lecturer.userId || lecturer.email}
                    </span>
                  </div>
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
            {["#f9fafb", "#f3f4f6"].map((color) => (
              <div
                key={color}
                className="h-1 flex-1 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
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
                    (subj: CourseSubject) => (
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
        courseIntakeId={courseIntake?.id || ""}
      />
    </div>
  );
}

// --- Sub-Components ---

function StudentsList({
  courseIntakeId,
  courseEndDate,
  onAdd,
  refreshKey,
}: {
  courseIntakeId: string | undefined;
  courseEndDate: string | undefined;
  onAdd: () => void;
  refreshKey: number;
}) {
  const router = useRouter();
  const [students, setStudents] = React.useState<
    { id: string; studentId: string; reg: string; name: string; avatar: string; collectionId: string; date: string; status: string; }[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  const fetchEnrolledStudents = React.useCallback(async () => {
    if (!courseIntakeId) return;

    try {
      setLoading(true);
      const enrollments = await pb.collection("enrollments").getFullList<RecordModel & { expand?: { student?: UserRecord } }>({
        filter: `course_intake="${courseIntakeId}"`,
        expand: "student",
        sort: "-created",
      });

      // Auto-complete: if course is over, batch-update any "enrolled" students to "completed"
      const courseOver = courseEndDate
        ? new Date() > new Date(courseEndDate)
        : false;
      if (courseOver) {
        const toComplete = (enrollments as unknown as EnrollmentRecord[]).filter(
          (e) => e.enrollement_status === "enrolled",
        );
        if (toComplete.length > 0) {
          await Promise.all(
            toComplete.map((e) =>
              pb.collection("enrollments").update(e.id, {
                enrollement_status: "completed",
              }),
            ),
          );
        }
      }

      const formattedStudents = (enrollments as unknown as EnrollmentRecord[]).map((enrollment) => {
        const student = enrollment.expand?.student;
        // If course is over and status was "enrolled", reflect as "completed"
        const status = enrollment.enrollement_status;
        const effectiveStatus =
          courseOver && status === "enrolled"
            ? "completed"
            : status || "enrolled";
        return {
          id: enrollment.id,
          studentId: student?.id || "",
          reg: enrollment.registration_number || "N/A",
          name: student?.name || "Unknown",
          avatar: student?.avatar || "",
          collectionId: student?.collectionId || "",
          date: new Date(
            enrollment.enrollment_date || enrollment.created,
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          status: effectiveStatus,
        };
      });

      setStudents(formattedStudents);
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
      toast.error("Failed to load enrolled students");
    } finally {
      setLoading(false);
    }
  }, [courseIntakeId, courseEndDate]);

  React.useEffect(() => {
    fetchEnrolledStudents();
  }, [fetchEnrolledStudents, refreshKey]);

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
              Click &quot;ADD STUDENT&quot; to enroll students in this course
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-10 py-6 text-left">Student</th>
                  <th className="px-10 py-6 text-left">Reg No</th>
                  <th className="px-10 py-6 text-left">Enrolled</th>
                  <th className="px-10 py-6 text-center">Status</th>
                  <th className="px-10 py-6 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => {
                      if (s.studentId)
                        router.push(`/dashboard/admin/students/${s.studentId}`);
                    }}
                    className="group hover:bg-indigo-50/30 transition-all cursor-pointer"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        {s.avatar ? (
                          <Image
                            src={pb.files.getURL(
                              {
                                id: s.studentId,
                                collectionId: s.collectionId,
                              } as unknown as RecordModel,
                              s.avatar,
                              { thumb: "100x100" },
                            )}
                            alt={s.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-indigo-300 transition-all"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {s.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
                        {s.reg}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-sm text-gray-500 font-bold">
                      {s.date}
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div
                        className="relative inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={s.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            const prev = s.status;
                            // Optimistic update
                            setStudents((curr) =>
                              curr.map((st) =>
                                st.id === s.id
                                  ? { ...st, status: newStatus }
                                  : st,
                              ),
                            );
                            try {
                              await pb.collection("enrollments").update(s.id, {
                                enrollement_status: newStatus,
                              });
                              toast.success(`Status updated to ${newStatus}`);
                            } catch (err) {
                              console.error("Error updating status:", err);
                              toast.error("Failed to update status");
                              // Revert
                              setStudents((curr) =>
                                curr.map((st) =>
                                  st.id === s.id ? { ...st, status: prev } : st,
                                ),
                              );
                            }
                          }}
                          className={`appearance-none cursor-pointer pl-4 pr-8 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 transition-all ${
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
                          <option value="enrolled">Enrolled</option>
                          <option value="dropped-out">Dropped Out</option>
                          <option value="expelled">Expelled</option>
                          <option value="completed">Completed</option>
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
                        />
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <ArrowRight
                        size={16}
                        className="text-gray-300 group-hover:text-indigo-600 transition-colors"
                      />
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

function SubjectsTab({
  groupedSubjects,
  onAdd,
  onAssign,
}: {
  groupedSubjects: Record<string, CourseSubject[]>;
  onAdd: () => void;
  onAssign: (subj: CourseSubject) => void;
}) {
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
        sortedSemesters.map(([sem, subjects]) => (
          <div
            key={sem}
            className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm"
          >
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-600 rounded-full" /> {sem}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((subj, i) => (
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

function AssignmentsTab({
  groupedAssignments,
  onAdd,
  onView,
  router,
}: {
  groupedAssignments: Record<string, Assignment[]>;
  onAdd: () => void;
  onView: (asgn: Assignment) => void;
  router: ReturnType<typeof useRouter>;
}) {
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
      {Object.entries(groupedAssignments).map(([sem, assignments]) => (
        <div
          key={sem}
          className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm"
        >
          <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-3">
            <div className="w-2 h-8 bg-indigo-600 rounded-full" /> {sem}
          </h3>
          <div className="space-y-3">
            {assignments.map((asgn, i) => (
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

function MaterialsTab({
  courseSubjects,
  courseIntakeId,
}: {
  courseSubjects: CourseSubject[];
  courseIntakeId: string | undefined;
}) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Preview
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const defaultForm = {
    title: "",
    description: "",
    type: "document" as
      | "document"
      | "youtube-link"
      | "video-link"
      | "video-upload",
    videoUrl: "",
    canDownload: true,
    visible: true,
    courseSubjectId: "",
    file: null as File | null,
  };
  const [formData, setFormData] = useState(defaultForm);

  // Fetch materials from PocketBase
  const fetchMaterials = React.useCallback(async () => {
    if (!courseSubjects.length) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const materialsData = await pb.collection("study_materials").getFullList({
        filter: `course_subject.course_intake = "${courseIntakeId}"`,
        sort: "-created",
      });
      setMaterials(materialsData as unknown as Material[]);
    } catch (err: unknown) {
      console.error("Error fetching materials:", err);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [courseSubjects, courseIntakeId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Reset form & close modal
  const resetForm = () => {
    setFormData(defaultForm);
    setShowModal(false);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Subject lookup
  const subjectMap = React.useMemo(() => {
    const map: Record<string, CourseSubject> = {};
    courseSubjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [courseSubjects]);

  // Create or update material
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.courseSubjectId) {
      toast.error("Please select a subject");
      return;
    }
    if (
      (formData.type === "youtube-link" || formData.type === "video-link") &&
      !formData.videoUrl.trim()
    ) {
      toast.error("Video URL is required for this type");
      return;
    }
    if (
      (formData.type === "document" || formData.type === "video-upload") &&
      !editingId &&
      !formData.file
    ) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("description", formData.description);
      data.append("type", formData.type);
      data.append("can_download", String(formData.canDownload));
      data.append("visible", String(formData.visible));
      data.append("course_subject", formData.courseSubjectId);

      if (formData.type === "youtube-link" || formData.type === "video-link") {
        data.append("video_url", formData.videoUrl.trim());
      }
      if (formData.file) {
        data.append("file", formData.file);
      }

      if (editingId) {
        await pb.collection("study_materials").update(editingId, data);
        toast.success("Material updated");
      } else {
        await pb.collection("study_materials").create(data);
        toast.success("Material added");
      }

      resetForm();
      await fetchMaterials();
    } catch (error: unknown) {
      console.error("Error saving material:", error);
      toast.error(
        editingId ? "Failed to update material" : "Failed to add material",
      );
    } finally {
      setSaving(false);
    }
  };

  // Start editing
  const startEdit = (mat: Material) => {
    setEditingId(mat.id);
    setFormData({
      title: mat.title || "",
      description: mat.description || "",
      type: mat.type || "document",
      videoUrl: mat.video_url || "",
      canDownload: mat.can_download ?? true,
      visible: mat.visible ?? true,
      courseSubjectId:
        Array.isArray(mat.course_subject) && mat.course_subject.length > 0
          ? mat.course_subject[0]
          : (mat.course_subject as string) || "",
      file: null,
    });
    setShowModal(true);
  };

  // Toggle visibility
  const toggleVisibility = async (mat: Material) => {
    const newVal = !mat.visible;
    setMaterials((prev) =>
      prev.map((m) => (m.id === mat.id ? { ...m, visible: newVal } : m)),
    );
    try {
      await pb
        .collection("study_materials")
        .update(mat.id, { visible: newVal });
    } catch {
      setMaterials((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, visible: !newVal } : m)),
      );
      toast.error("Failed to toggle visibility");
    }
  };

  // Toggle download
  const toggleDownload = async (mat: Material) => {
    const newVal = !mat.can_download;
    setMaterials((prev) =>
      prev.map((m) => (m.id === mat.id ? { ...m, can_download: newVal } : m)),
    );
    try {
      await pb
        .collection("study_materials")
        .update(mat.id, { can_download: newVal });
    } catch {
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === mat.id ? { ...m, can_download: !newVal } : m,
        ),
      );
      toast.error("Failed to toggle download");
    }
  };

  // Delete material
  const handleDelete = async (mat: Material) => {
    if (!window.confirm(`Delete "${mat.title}"? This cannot be undone.`))
      return;
    try {
      await pb.collection("study_materials").delete(mat.id);
      setMaterials((prev) => prev.filter((m) => m.id !== mat.id));
      toast.success("Material deleted");
    } catch {
      toast.error("Failed to delete material");
    }
  };

  // Type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText size={18} className="text-blue-600" />;
      case "youtube-link":
        return <Youtube size={18} className="text-red-600" />;
      case "video-link":
        return <Video size={18} className="text-purple-600" />;
      case "video-upload":
        return <Film size={18} className="text-green-600" />;
      default:
        return <FileText size={18} className="text-gray-600" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case "document":
        return "bg-blue-50 border-blue-100";
      case "youtube-link":
        return "bg-red-50 border-red-100";
      case "video-link":
        return "bg-purple-50 border-purple-100";
      case "video-upload":
        return "bg-green-50 border-green-100";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };

  // File URL from PocketBase
  const getFileUrl = (record: Material) => {
    if (!record.file) return null;
    return pb.files.getURL(record as unknown as RecordModel, record.file as string);
  };

  // Type categories for accordion content
  const typeCategories = [
    {
      key: "document",
      label: "Documents",
      icon: <FileText size={16} className="text-blue-600" />,
      color: "text-blue-600",
    },
    {
      key: "youtube-link",
      label: "YouTube Links",
      icon: <Youtube size={16} className="text-red-600" />,
      color: "text-red-600",
    },
    {
      key: "video-link",
      label: "Video Links",
      icon: <Video size={16} className="text-purple-600" />,
      color: "text-purple-600",
    },
    {
      key: "video-upload",
      label: "Video Uploads",
      icon: <Film size={16} className="text-green-600" />,
      color: "text-green-600",
    },
  ];

  // Group materials by subject, filtered by search
  const materialsBySubject = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result: Record<string, Material[]> = {};
    courseSubjects.forEach((s) => {
      result[s.id] = [];
    });
    materials.forEach((mat) => {
      const csId = Array.isArray(mat.course_subject)
        ? mat.course_subject[0]
        : mat.course_subject;
      if (!csId || !result[csId]) return;
      if (q && !mat.title?.toLowerCase().includes(q)) return;
      result[csId].push(mat);
    });
    return result;
  }, [materials, courseSubjects, searchQuery]);

  // Material card renderer
  const renderMaterialCard = (mat: Material) => {
    return (
      <div
        key={mat.id}
        className={`flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-md group cursor-pointer ${
          !mat.visible
            ? "bg-gray-50/80 border-gray-200 opacity-70"
            : "bg-white border-gray-100 hover:border-indigo-100"
        }`}
        onClick={() => setPreviewMaterial(mat)}
      >
        {/* Type icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${getTypeBg(mat.type)}`}
        >
          {getTypeIcon(mat.type)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
              {mat.title}
            </h4>
            {!mat.visible && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                Hidden
              </span>
            )}
          </div>
          {mat.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {mat.description.replace(/<[^>]*>/g, "")}
            </p>
          )}
          <span className="text-[10px] text-gray-400">
            {new Date(mat.created).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleVisibility(mat)}
            className={`p-2 rounded-lg border transition ${
              mat.visible
                ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
            }`}
            title={mat.visible ? "Visible" : "Hidden"}
          >
            {mat.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={() => toggleDownload(mat)}
            className={`p-2 rounded-lg border transition ${
              mat.can_download
                ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
            }`}
            title={mat.can_download ? "Download On" : "Download Off"}
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => startEdit(mat)}
            className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 hover:bg-orange-100 transition"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleDelete(mat)}
            className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  // YouTube embed URL helper
  const getYoutubeEmbedUrl = (url: string) => {
    try {
      const u = new URL(url);
      let videoId = "";
      if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.slice(1);
      } else {
        videoId = u.searchParams.get("v") || "";
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
      return null;
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!courseSubjects.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen size={48} className="text-gray-300 mb-4" />
        <h3 className="text-xl font-black text-gray-400 mb-2">
          No Subjects Yet
        </h3>
        <p className="text-sm text-gray-400">
          Add subjects to this course before uploading materials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search + Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials..."
            className="pl-8 pr-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
          />
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(defaultForm);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 shrink-0"
        >
          <Plus size={18} /> ADD MATERIAL
        </button>
      </div>

      {/* Subject Accordion */}
      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Video size={48} className="text-gray-300 mb-4" />
          <h3 className="text-xl font-black text-gray-400 mb-2">
            No Materials Yet
          </h3>
          <p className="text-sm text-gray-400">
            Click &quot;Add Material&quot; to upload documents, videos, or
            links.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {courseSubjects.map((subj) => {
            const subjMats = materialsBySubject[subj.id] || [];
            const docCount = subjMats.filter(
              (m: Material) => m.type === "document",
            ).length;
            const vidCount = subjMats.filter(
              (m: Material) =>
                m.type === "youtube-link" ||
                m.type === "video-link" ||
                m.type === "video-upload",
            ).length;
            const totalCount = subjMats.length;

            // Figure out which tabs have content
            const availableTabs = typeCategories.filter((cat) =>
              subjMats.some((m: Material) => m.type === cat.key),
            );
            const defaultTab =
              availableTabs.length > 0 ? availableTabs[0].key : "document";

            return (
              <AccordionItem
                key={subj.id}
                value={subj.id}
                className="bg-white rounded-2xl border border-gray-100 px-6 overflow-hidden shadow-sm data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="py-5 hover:no-underline">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen size={18} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="font-bold text-gray-900 truncate">
                        {subj.name}
                      </div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {subj.code}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto mr-4">
                      {docCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                          <FileText size={12} /> {docCount}
                        </span>
                      )}
                      {vidCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-lg">
                          <Film size={12} /> {vidCount}
                        </span>
                      )}
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        {totalCount} item{totalCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  {totalCount === 0 ? (
                    <div className="text-sm text-gray-400 italic py-4 text-center">
                      No materials for this subject yet.
                    </div>
                  ) : (
                    <Tabs defaultValue={defaultTab} className="w-full">
                      <TabsList className="mb-4 bg-gray-100/80 rounded-xl p-1 gap-1">
                        {typeCategories.map((cat) => {
                          const count = subjMats.filter(
                            (m: Material) => m.type === cat.key,
                          ).length;
                          if (count === 0) return null;
                          return (
                            <TabsTrigger
                              key={cat.key}
                              value={cat.key}
                              className="rounded-lg px-3 py-1.5 text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                              {cat.icon}
                              {cat.label}
                              <span className="text-[10px] font-bold opacity-50">
                                {count}
                              </span>
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                      {typeCategories.map((cat) => {
                        const catMats = subjMats.filter(
                          (m: Material) => m.type === cat.key,
                        );
                        if (catMats.length === 0) return null;
                        return (
                          <TabsContent key={cat.key} value={cat.key}>
                            <div className="space-y-2">
                              {catMats.map((mat: Material) =>
                                renderMaterialCard(mat),
                              )}
                            </div>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Add / Edit Modal */}
      <ModernModal
        open={showModal}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
        title={editingId ? "Edit Material" : "Add New Material"}
        subtitle={
          editingId
            ? "Update the material details below."
            : "Upload a document, video, or add a link."
        }
        avatarChar={editingId ? "E" : "M"}
        avatarColor={editingId ? "bg-orange-500" : "bg-indigo-600"}
      >
        <div className="space-y-5 pt-2">
          {/* Title */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="Enter material title"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Subject *
            </label>
            <select
              value={formData.courseSubjectId}
              onChange={(e) =>
                setFormData({ ...formData, courseSubjectId: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">Select a subject</option>
              {courseSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    key: "document",
                    label: "Document",
                    icon: <FileText size={16} />,
                    color: "border-blue-300 bg-blue-50 text-blue-700",
                  },
                  {
                    key: "youtube-link",
                    label: "YouTube",
                    icon: <Youtube size={16} />,
                    color: "border-red-300 bg-red-50 text-red-700",
                  },
                  {
                    key: "video-link",
                    label: "Video Link",
                    icon: <Video size={16} />,
                    color: "border-purple-300 bg-purple-50 text-purple-700",
                  },
                  {
                    key: "video-upload",
                    label: "Video Upload",
                    icon: <Film size={16} />,
                    color: "border-green-300 bg-green-50 text-green-700",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: opt.key,
                      file: null,
                      videoUrl: "",
                    })
                  }
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    formData.type === opt.key
                      ? opt.color + " ring-2 ring-offset-1 ring-indigo-300"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional: Video URL */}
          {(formData.type === "youtube-link" ||
            formData.type === "video-link") && (
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                Video URL *
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="https://..."
              />
            </div>
          )}

          {/* Conditional: File Upload */}
          {(formData.type === "document" ||
            formData.type === "video-upload") && (
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                File {editingId ? "(leave empty to keep current)" : "*"}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  formData.type === "document"
                    ? ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                    : "video/*"
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    file: e.target.files?.[0] || null,
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          )}

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) =>
                  setFormData({ ...formData, visible: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                Visible to Students
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.canDownload}
                onChange={(e) =>
                  setFormData({ ...formData, canDownload: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                Allow Download
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {editingId ? "Update Material" : "Add Material"}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </ModernModal>

      {/* Preview Modal */}
      <ModernModal
        open={!!previewMaterial}
        onOpenChange={(open) => {
          if (!open) setPreviewMaterial(null);
        }}
        title={previewMaterial?.title || "Preview"}
        subtitle={
          previewMaterial
            ? `${previewMaterial.type.replace(/-/g, " ").toUpperCase()} • ${new Date(previewMaterial.created).toLocaleDateString()}`
            : ""
        }
        avatarChar="P"
        avatarColor="bg-violet-600"
        className="sm:max-w-2xl"
      >
        {previewMaterial &&
          (() => {
            const mat = previewMaterial;
            const fileUrl = getFileUrl(mat);
            const subj =
              subjectMap[
                Array.isArray(mat.course_subject)
                  ? mat.course_subject[0]
                  : mat.course_subject
              ];
            const embedUrl =
              mat.type === "youtube-link" && mat.video_url
                ? getYoutubeEmbedUrl(mat.video_url)
                : null;
            const isPdf =
              mat.type === "document" &&
              mat.file &&
              typeof mat.file === "string" &&
              mat.file.toLowerCase().endsWith(".pdf");

            return (
              <div className="space-y-5 pt-1">
                {/* Subject badge */}
                {subj && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {subj.name} ({subj.code})
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border ${getTypeBg(mat.type)}`}
                    >
                      {getTypeIcon(mat.type)}
                    </div>
                  </div>
                )}

                {/* Preview area */}
                {embedUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-video">
                    <iframe
                      src={embedUrl}
                      title={mat.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )}

                {mat.type === "video-link" && mat.video_url && !embedUrl && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
                    <Video size={32} className="text-purple-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">
                      External video link
                    </p>
                    <a
                      href={mat.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition"
                    >
                      <ExternalLink size={14} /> Open Video
                    </a>
                  </div>
                )}

                {mat.type === "video-upload" && fileUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black">
                    <video
                      controls
                      className="w-full max-h-[400px]"
                      src={fileUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {isPdf && fileUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                    <iframe
                      src={fileUrl}
                      title={mat.title}
                      className="w-full h-[400px]"
                    />
                  </div>
                )}

                {mat.type === "document" && !isPdf && fileUrl && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
                    <FileText size={32} className="text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1 font-medium">
                      {mat.file}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      Preview not available for this file type.
                    </p>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                    >
                      <Download size={14} /> Download File
                    </a>
                  </div>
                )}

                {/* Description */}
                {mat.description && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Description
                    </h4>
                    <div
                      className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: mat.description }}
                    />
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                      mat.visible
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-gray-100 text-gray-400 border-gray-200"
                    }`}
                  >
                    {mat.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    {mat.visible ? "Visible" : "Hidden"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                      mat.can_download
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : "bg-gray-100 text-gray-400 border-gray-200"
                    }`}
                  >
                    <Download size={13} />
                    {mat.can_download ? "Downloadable" : "No Download"}
                  </span>
                </div>

                {/* Actions row */}
                <div className="flex gap-3 pt-2">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                    >
                      <Download size={15} /> Download
                    </a>
                  )}
                  {mat.video_url && (
                    <a
                      href={mat.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition"
                    >
                      <ExternalLink size={15} /> Open Link
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setPreviewMaterial(null);
                      startEdit(mat);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold border border-orange-100 hover:bg-orange-100 transition"
                  >
                    <Edit size={15} /> Edit
                  </button>
                </div>
              </div>
            );
          })()}
      </ModernModal>
    </div>
  );
}
