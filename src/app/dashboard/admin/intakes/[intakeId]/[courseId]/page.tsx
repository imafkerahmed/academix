"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { ModernModal } from "@/components/ui/modern-modal";
import AdminActionBar from "@/components/admin/AdminActionBar";

// --- Mock Data ---
const mockIntakes = [
  {
    id: "1",
    code: "INT/JUL2026",
    start_date: "2026-01-01",
    end_date: "2026-06-30",
  },
  {
    id: "2",
    code: "INT/JUL2025",
    start_date: "2025-07-01",
    end_date: "2025-12-31",
  },
];
const mockCourses = [
  { id: "c1", name: "Mathematics", code: "MATH101" },
  { id: "c2", name: "Physics", code: "PHYS101" },
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

const mockLecturers = [
  "Dianne Russell",
  "Albert Flores",
  "Theresa Webb",
  "Savannah Nguyen",
  "Jenny Wilson",
  "Leslie Alexander",
  "Robert Fox",
  "Esther Howard",
];

const availableSubjects = [
  { name: "Linear Algebra", code: "MATH301" },
  { name: "Discrete Mathematics", code: "CS101" },
  { name: "Differential Equations", code: "MATH302" },
  { name: "Physics I", code: "PHYS101" },
  { name: "Physics II", code: "PHYS102" },
];

const initialSubjects = [
  {
    name: "Algebra",
    code: "MATH101",
    semester: "Semester 1",
    assignedLecturer: "Dianne Russell",
  },
  {
    name: "Calculus",
    code: "MATH102",
    semester: "Semester 1",
    assignedLecturer: "Albert Flores",
  },
  {
    name: "Geometry",
    code: "MATH201",
    semester: "Semester 2",
    assignedLecturer: "Theresa Webb",
  },
];

const initialAssignments = [
  {
    id: "asgn-1",
    title: "Algebra Quiz 1",
    subjectCode: "MATH101",
    semester: "Semester 1",
    dueDate: "2026-03-15",
    status: "Upcoming",
    totalMarks: 100,
    assignmentSheet: "algebra-quiz-1.pdf",
    rules: "• Answer all questions\n• Show working",
    markingLecturer: "Dianne Russell",
  },
];

const materials = [
  { id: "mat-1", title: "Lecture Notes.pdf", uploadDate: "2026-01-15" },
  { id: "mat-2", title: "Syllabus.docx", uploadDate: "2026-01-20" },
];

const videos = [
  {
    id: "vid-1",
    title: "Introduction to Course",
    duration: "45:30",
    uploadDate: "2026-01-15",
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

  const [activeTab, setActiveTab] = useState(0);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showAssignmentDetailModal, setShowAssignmentDetailModal] =
    useState(false);

  // Form states
  const [editCourse, setEditCourse] = useState({
    name: course?.name || "",
    code: course?.code || "",
    start_date: courseIntake?.start_date || "",
    end_date: courseIntake?.end_date || "",
  });

  const [courseSubjects, setCourseSubjects] = useState(initialSubjects);
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [selectedSubjectsInModal, setSelectedSubjectsInModal] = useState<
    string[]
  >([]);
  const [subjectToAssign, setSubjectToAssign] = useState<any>(null);
  const [lecturerSearchQuery, setLecturerSearchQuery] = useState("");

  const [courseAssignments, setCourseAssignments] =
    useState(initialAssignments);
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
    markingLecturer: mockLecturers[0],
    assignmentSheet: null,
  });

  if (!intake || !course || !courseIntake) {
    return (
      <div className="p-8 text-center text-gray-500">
        Course or Intake not found.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              TOTAL STUDENTS
            </span>
            <span className="text-2xl font-black text-indigo-600 uppercase tracking-tighter">
              128
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
        {activeTab === 0 && <StudentsList />}
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
        title="Edit Course Details"
        subtitle="Modify the core identification and schedule for this course."
        avatarChar="C"
        avatarColor="bg-orange-500"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowEditModal(false);
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={editCourse.code}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, code: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editCourse.start_date}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, start_date: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                End Date
              </label>
              <input
                type="date"
                value={editCourse.end_date}
                onChange={(e) =>
                  setEditCourse({ ...editCourse, end_date: e.target.value })
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold transition-all text-gray-900"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
            <button
              type="submit"
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all uppercase tracking-widest"
            >
              SAVE CHANGES
            </button>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
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
              {["Semester 1", "Semester 2"].map((sem) => (
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
              {availableSubjects.map((subj) => (
                <button
                  key={subj.code}
                  onClick={() =>
                    setSelectedSubjectsInModal((prev) =>
                      prev.includes(subj.name)
                        ? prev.filter((s) => s !== subj.name)
                        : [...prev, subj.name],
                    )
                  }
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    selectedSubjectsInModal.includes(subj.name)
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-50 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-gray-900">{subj.name}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {subj.code}
                    </span>
                  </div>
                  {selectedSubjectsInModal.includes(subj.name) && (
                    <Check size={18} className="text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
            <button
              onClick={() => {
                const count = selectedSubjectsInModal.length;
                if (count > 0) {
                  toast.success(
                    `Added ${count} subjects to ${selectedSemester}`,
                  );
                  setShowAddSubjectModal(false);
                  setSelectedSubjectsInModal([]);
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
            {mockLecturers
              .filter((l) =>
                l.toLowerCase().includes(lecturerSearchQuery.toLowerCase()),
              )
              .map((lecturer) => (
                <button
                  key={lecturer}
                  onClick={() => {
                    toast.success(
                      `${lecturer} assigned to ${subjectToAssign?.name}`,
                    );
                    setShowLecturerModal(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-white hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {lecturer.charAt(0)}
                  </div>
                  <span className="font-bold text-gray-900">{lecturer}</span>
                </button>
              ))}
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
                      {mockLecturers.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
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
    </div>
  );
}

// --- Sub-Components ---

function StudentsList() {
  const students = [
    {
      name: "Alice Johnson",
      reg: "REG1001",
      date: "2026-01-05",
      status: "Active",
    },
    { name: "Bob Smith", reg: "REG1002", date: "2026-01-12", status: "Active" },
    {
      name: "Charlie Davis",
      reg: "REG1003",
      date: "2026-01-15",
      status: "Deferred",
    },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
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
            {students.map((s, i) => (
              <tr
                key={i}
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
                    className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.status === "Active" ? "bg-green-500 text-white" : "bg-orange-500 text-white"}`}
                  >
                    {s.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubjectsTab({ groupedSubjects, onAdd, onAssign }: any) {
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
      {Object.entries(groupedSubjects).map(([sem, subjects]: any) => (
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
                <Badge className="bg-white text-gray-400 border border-gray-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {subj.code}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
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
  const mats = [
    {
      title: "Course Introduction.pdf",
      type: "document",
      date: "Jan 12, 2026",
    },
    { title: "Weekly Seminar Recap.mp4", type: "video", date: "Jan 15, 2026" },
    { title: "Calculus Deep Dive.pdf", type: "document", date: "Jan 18, 2026" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mats.map((m, i) => (
        <div
          key={i}
          className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm group hover:shadow-xl hover:translate-y-[-4px] transition-all"
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ring-4 ring-opacity-50 ${m.type === "video" ? "bg-amber-100 text-amber-600 ring-amber-50" : "bg-red-100 text-red-600 ring-red-50"}`}
          >
            {m.type === "video" ? <Video size={24} /> : <Download size={24} />}
          </div>
          <h4 className="font-bold text-gray-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">
            {m.title}
          </h4>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {m.date}
            </span>
            <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
