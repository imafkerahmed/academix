"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Edit } from "lucide-react";
import { toast } from "sonner";

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

  // Mock content for each tab
  const [students, setStudents] = useState([
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
  ]);

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
    {
      name: "Statistics",
      code: "MATH202",
      semester: "Semester 2",
      assignedLecturer: "Savannah Nguyen",
    },
    {
      name: "Trigonometry",
      code: "MATH203",
      semester: "Semester 2",
      assignedLecturer: "Jenny Wilson",
    },
  ];

  const availableSubjects = [
    { name: "Linear Algebra", code: "MATH301" },
    { name: "Discrete Mathematics", code: "CS101" },
    { name: "Differential Equations", code: "MATH302" },
    { name: "Physics I", code: "PHYS101" },
    { name: "Physics II", code: "PHYS102" },
    { name: "Organic Chemistry", code: "CHEM201" },
    { name: "Biochemistry", code: "BIOL201" },
    { name: "Microeconomics", code: "ECON101" },
    { name: "Macroeconomics", code: "ECON102" },
    { name: "Microbiology", code: "BIOL301" },
    { name: "Genetics", code: "BIOL302" },
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
    {
      id: "asgn-2",
      title: "Calculus Assignment 1",
      subjectCode: "MATH102",
      semester: "Semester 1",
      dueDate: "2026-03-20",
      status: "Upcoming",
      totalMarks: 50,
      assignmentSheet: "calculus-asgn-1.pdf",
      rules: "• Late submissions penalized\n• PDF only",
      markingLecturer: "Albert Flores",
    },
    {
      id: "asgn-3",
      title: "Geometry Homework",
      subjectCode: "MATH201",
      semester: "Semester 2",
      dueDate: "2026-04-10",
      status: "Upcoming",
      totalMarks: 20,
      assignmentSheet: "geometry-hw.pdf",
      rules: "• Manual drawings accepted",
      markingLecturer: "Theresa Webb",
    },
  ];

  const availableAssignments = [
    {
      id: "lib-1",
      title: "Linear Algebra Project",
      subjectCode: "MATH301",
      totalMarks: 100,
      rules: "Group project. Max 4 members.",
    },
    {
      id: "lib-2",
      title: "Discrete Mathematics Quiz",
      subjectCode: "CS101",
      totalMarks: 20,
      rules: "MCQ based quiz.",
    },
    {
      id: "lib-3",
      title: "Physics Lab Report",
      subjectCode: "PHYS101",
      totalMarks: 30,
      rules: "Submit lab notes along with report.",
    },
    {
      id: "lib-4",
      title: "Organic Chemistry Quiz",
      subjectCode: "CHEM201",
      totalMarks: 15,
      rules: "Basic naming quiz.",
    },
    {
      id: "lib-5",
      title: "Microeconomics Essay",
      subjectCode: "ECON101",
      totalMarks: 100,
      rules: "Minimum 2000 words.",
    },
    {
      id: "lib-6",
      title: "Genetics Research Paper",
      subjectCode: "BIOL302",
      totalMarks: 100,
      rules: "Case study required.",
    },
  ];

  const [courseSubjects, setCourseSubjects] = useState(initialSubjects);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectsInModal, setSelectedSubjectsInModal] = useState<
    string[]
  >([]);

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

  const [lecturerSearchQuery, setLecturerSearchQuery] = useState("");
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [subjectToAssign, setSubjectToAssign] = useState<any>(null);

  // Assignment Management State
  const [courseAssignments, setCourseAssignments] =
    useState(initialAssignments);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showAdminAssignmentDetailModal, setShowAdminAssignmentDetailModal] =
    useState(false);
  const [selectedAdminAssignment, setSelectedAdminAssignment] =
    useState<any>(null);
  const [selectedAssignmentModalSemester, setSelectedAssignmentModalSemester] =
    useState("Semester 1");
  const [selectedAssignmentModalSubject, setSelectedAssignmentModalSubject] =
    useState<string | null>(null);
  const [disabledAssignments, setDisabledAssignments] = useState<string[]>([]);

  // Stage: 1 (Select Sem/Sub), 2 (Create Form)
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

  const [expandedSemesters, setExpandedSemesters] = useState<string[]>([
    "Semester 1",
  ]);
  const [disabledSemesters, setDisabledSemesters] = useState<string[]>([]);
  const [disabledSubjects, setDisabledSubjects] = useState<string[]>([]);

  // Load disabled states from localStorage
  React.useEffect(() => {
    const savedSemesters = localStorage.getItem(
      `disabled_semesters_${courseId}`,
    );
    if (savedSemesters) {
      setDisabledSemesters(JSON.parse(savedSemesters));
    }
    const savedSubjects = localStorage.getItem(`disabled_subjects_${courseId}`);
    if (savedSubjects) {
      setDisabledSubjects(JSON.parse(savedSubjects));
    }
    const savedAssignments = localStorage.getItem(
      `disabled_assignments_${courseId}`,
    );
    if (savedAssignments) {
      setDisabledAssignments(JSON.parse(savedAssignments));
    }
  }, [courseId]);

  const toggleSemesterEnablement = (semester: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't expand/collapse when clicking the toggle
    setDisabledSemesters((prev) => {
      const next = prev.includes(semester)
        ? prev.filter((s) => s !== semester)
        : [...prev, semester];
      localStorage.setItem(
        `disabled_semesters_${courseId}`,
        JSON.stringify(next),
      );
      return next;
    });
  };

  const toggleSubjectEnablement = (
    subjectCode: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setDisabledSubjects((prev) => {
      const next = prev.includes(subjectCode)
        ? prev.filter((s) => s !== subjectCode)
        : [...prev, subjectCode];
      localStorage.setItem(
        `disabled_subjects_${courseId}`,
        JSON.stringify(next),
      );
      return next;
    });
  };

  const toggleSemester = (semester: string) => {
    setExpandedSemesters((prev) =>
      prev.includes(semester)
        ? prev.filter((s) => s !== semester)
        : [...prev, semester],
    );
  };

  const toggleAssignmentEnablement = (
    assignmentId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setDisabledAssignments((prev) => {
      const next = prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId];
      localStorage.setItem(
        `disabled_assignments_${courseId}`,
        JSON.stringify(next),
      );
      return next;
    });
  };

  const updateSubjectLecturer = (subjectCode: string, lecturerName: string) => {
    setCourseSubjects((prev) =>
      prev.map((s) =>
        s.code === subjectCode ? { ...s, assignedLecturer: lecturerName } : s,
      ),
    );
    setShowLecturerModal(false);
    setSubjectToAssign(null);
    setLecturerSearchQuery("");
    toast.success(`Lecturer updated to ${lecturerName}`);
  };

  const handleAddSubjects = () => {
    if (selectedSubjectsInModal.length === 0) return;

    const subjectsToAdd = availableSubjects.filter((s) =>
      selectedSubjectsInModal.includes(s.name),
    );

    setCourseSubjects((prev) => [
      ...prev,
      ...subjectsToAdd.map((s) => ({
        ...s,
        semester: selectedSemester,
        assignedLecturer: "Not Assigned",
      })),
    ]);

    const count = selectedSubjectsInModal.length;
    toast.success(
      `Successfully added ${count} subject${count > 1 ? "s" : ""} to ${selectedSemester}`,
    );

    setShowAddModal(false);
    setSelectedSubjectsInModal([]);
    setSearchQuery("");
  };

  const toggleSubjectSelection = (subjectName: string) => {
    setSelectedSubjectsInModal((prev) =>
      prev.includes(subjectName)
        ? prev.filter((s) => s !== subjectName)
        : [...prev, subjectName],
    );
  };

  const handleGoToConfig = () => {
    if (selectedAssignmentModalSemester && selectedAssignmentModalSubject) {
      setAssignmentModalStage(2);
    }
  };

  const handleAddAssignments = () => {
    if (!assignmentForm.title || !selectedAssignmentModalSubject) return;

    const newAsgn = {
      id: "asgn-" + Date.now(),
      ...assignmentForm,
      subjectCode: selectedAssignmentModalSubject,
      semester: selectedAssignmentModalSemester,
      status: "Upcoming",
      assignmentSheet: assignmentForm.assignmentSheet
        ? assignmentForm.assignmentSheet.name
        : assignmentForm.title.toLowerCase().replace(/\s+/g, "-") + ".pdf",
    };

    setCourseAssignments((prev) => [...prev, newAsgn]);

    toast.success(`Successfully created assignment: ${assignmentForm.title}`);

    setShowAddAssignmentModal(false);
    setSelectedAssignmentModalSubject(null);
    setAssignmentModalStage(1);
    setAssignmentForm({
      title: "",
      totalMarks: 100,
      rules: "",
      unlockDate: "2026-05-01",
      dueDate: "2026-06-01",
      markingLecturer: mockLecturers[0],
      assignmentSheet: null,
    });
  };

  // Grouping subjects by semester
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

  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

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
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-semibold">Subject Structure</div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
                >
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  ADD SUBJECT
                </button>
              </div>

              {Object.keys(groupedSubjects).map((semester) => (
                <div
                  key={semester}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                >
                  <div
                    onClick={() => toggleSemester(semester)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSemester(semester);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <svg
                          className={`w-5 h-5 text-indigo-600 transition-transform duration-200 ${
                            expandedSemesters.includes(semester)
                              ? "rotate-180"
                              : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-gray-900">
                          {semester}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            disabledSemesters.includes(semester)
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        >
                          {disabledSemesters.includes(semester)
                            ? "Disabled"
                            : "Enabled"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
                        <button
                          onClick={(e) => toggleSemesterEnablement(semester, e)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            !disabledSemesters.includes(semester)
                              ? "bg-indigo-600"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              !disabledSemesters.includes(semester)
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700">
                        {groupedSubjects[semester].length} Subjects
                      </Badge>
                    </div>
                  </div>

                  {expandedSemesters.includes(semester) && (
                    <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50/30">
                      <div className="space-y-2 mt-4">
                        {groupedSubjects[semester].map(
                          (subj: any, i: number) => (
                            <div
                              key={i}
                              className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-all ${
                                disabledSubjects.includes(subj.code)
                                  ? "border-gray-100 opacity-60 bg-gray-50/50"
                                  : "border-gray-100 shadow-sm hover:border-indigo-100"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <Badge className="bg-gray-100 text-gray-500 font-bold text-[10px] px-2 py-0.5">
                                  {subj.code}
                                </Badge>
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900">
                                    {subj.name}
                                  </span>
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSubjectToAssign(subj);
                                        setShowLecturerModal(true);
                                      }}
                                      className="text-xs text-gray-500 flex items-center gap-1 hover:text-indigo-600 transition-colors group/lecturer"
                                    >
                                      <svg
                                        className="w-3 h-3"
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
                                      <span
                                        className={
                                          subj.assignedLecturer ===
                                          "Not Assigned"
                                            ? "text-orange-500 font-medium"
                                            : ""
                                        }
                                      >
                                        {subj.assignedLecturer}
                                      </span>
                                      <Edit className="w-2.5 h-2.5 opacity-0 group-hover/lecturer:opacity-100 transition-opacity" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-[10px] font-bold uppercase ${
                                    disabledSubjects.includes(subj.code)
                                      ? "text-red-400"
                                      : "text-green-500"
                                  }`}
                                >
                                  {disabledSubjects.includes(subj.code)
                                    ? "Disabled"
                                    : "Active"}
                                </span>
                                <button
                                  onClick={(e) =>
                                    toggleSubjectEnablement(subj.code, e)
                                  }
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                    !disabledSubjects.includes(subj.code)
                                      ? "bg-indigo-600"
                                      : "bg-gray-300"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                      !disabledSubjects.includes(subj.code)
                                        ? "translate-x-5"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-semibold">Assignments</div>
                <button
                  onClick={() => setShowAddAssignmentModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                >
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  ADD ASSIGNMENT
                </button>
              </div>

              {Object.keys(groupedAssignments).length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-bold">
                    No assignments yet
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Start by adding assignments to your semesters.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedAssignments)
                    .sort()
                    .map((semester) => (
                      <div
                        key={semester}
                        className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm"
                      >
                        <div
                          className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                          onClick={() => toggleSemester(semester)}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                                expandedSemesters.includes(semester)
                                  ? "bg-indigo-600 text-white"
                                  : "bg-indigo-50 text-indigo-600"
                              }`}
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
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold text-gray-900">
                                  {semester}
                                </h3>
                                <button
                                  onClick={(e) =>
                                    toggleSemesterEnablement(semester, e)
                                  }
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                    !disabledSemesters.includes(semester)
                                      ? "bg-indigo-600"
                                      : "bg-gray-300"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                      !disabledSemesters.includes(semester)
                                        ? "translate-x-5"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </div>
                              <Badge className="bg-indigo-100 text-indigo-700">
                                {groupedAssignments[semester].length}{" "}
                                Assignments
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {expandedSemesters.includes(semester) && (
                          <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50/30">
                            <div className="space-y-2 mt-4">
                              {groupedAssignments[semester].map(
                                (asgn: any, i: number) => (
                                  <div
                                    key={i}
                                    className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-all ${
                                      disabledAssignments.includes(asgn.id)
                                        ? "border-gray-100 opacity-60 bg-gray-50/50"
                                        : "border-gray-100 shadow-sm hover:border-indigo-100"
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <Badge className="bg-gray-100 text-gray-500 font-bold text-[10px] px-2 py-0.5">
                                        {asgn.subjectCode}
                                      </Badge>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {asgn.title}
                                          </span>
                                          {asgn.assignmentSheet && (
                                            <span className="px-1.5 py-0.5 bg-green-50 text-[8px] font-black text-green-600 rounded-md flex items-center gap-1 border border-green-100">
                                              <svg
                                                className="w-2 h-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={3}
                                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                              </svg>
                                              SHEET
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
                                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <svg
                                              className="w-3 h-3 text-indigo-400"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                              />
                                            </svg>
                                            Due: {asgn.dueDate}
                                          </span>
                                          <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
                                            <svg
                                              className="w-3 h-3 text-amber-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                              />
                                            </svg>
                                            {asgn.totalMarks} Marks
                                          </span>
                                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <svg
                                              className="w-3 h-3 text-purple-400"
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
                                            {asgn.markingLecturer ||
                                              "Unassigned"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <button
                                        onClick={() =>
                                          router.push(
                                            `/dashboard/admin/assignments/${asgn.id}`,
                                          )
                                        }
                                        className="p-2 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-all group/btn flex items-center gap-2"
                                      >
                                        <span className="text-[10px] font-bold whitespace-nowrap">
                                          Submissions
                                        </span>
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
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedAdminAssignment(asgn);
                                          setShowAdminAssignmentDetailModal(
                                            true,
                                          );
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-all group/btn flex items-center gap-2"
                                      >
                                        <span className="text-[10px] font-bold">
                                          Details
                                        </span>
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
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                      </button>
                                      <div className="flex items-center gap-4">
                                        <span
                                          className={`text-[10px] font-bold uppercase ${
                                            disabledAssignments.includes(
                                              asgn.id,
                                            )
                                              ? "text-red-400"
                                              : "text-green-500"
                                          }`}
                                        >
                                          {disabledAssignments.includes(asgn.id)
                                            ? "Disabled"
                                            : "Active"}
                                        </span>
                                        <button
                                          onClick={(e) =>
                                            toggleAssignmentEnablement(
                                              asgn.id,
                                              e,
                                            )
                                          }
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                            !disabledAssignments.includes(
                                              asgn.id,
                                            )
                                              ? "bg-indigo-600"
                                              : "bg-gray-300"
                                          }`}
                                        >
                                          <span
                                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                              !disabledAssignments.includes(
                                                asgn.id,
                                              )
                                                ? "translate-x-5"
                                                : "translate-x-1"
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
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

      {/* Admin Assignment Detail Modal */}
      {showAdminAssignmentDetailModal && selectedAdminAssignment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setShowAdminAssignmentDetailModal(false)}
          />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
              <div>
                <h2 className="text-xl font-black text-gray-900 leading-tight">
                  Assignment Details
                </h2>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {selectedAdminAssignment.subjectCode}
                </p>
              </div>
              <button
                onClick={() => setShowAdminAssignmentDetailModal(false)}
                className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-all shadow-sm"
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

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">
                  Title
                </label>
                <p className="text-lg font-bold text-gray-900">
                  {selectedAdminAssignment.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">
                    Total Marks
                  </label>
                  <p className="text-sm font-bold border-2 border-indigo-100 rounded-2xl px-4 py-2 text-indigo-600 bg-indigo-50 inline-block">
                    {selectedAdminAssignment.totalMarks}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">
                    Unlock Date
                  </label>
                  <p className="text-sm font-bold text-gray-900 bg-gray-50 rounded-2xl px-4 py-2 inline-block">
                    {selectedAdminAssignment.unlockDate}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">
                    Due Date
                  </label>
                  <p className="text-sm font-bold text-gray-900 bg-gray-50 rounded-2xl px-4 py-2 inline-block">
                    {selectedAdminAssignment.dueDate}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">
                  Marking Lecturer
                </label>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <svg
                      className="w-5 h-5 text-indigo-600"
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
                  </div>
                  <span className="font-bold text-gray-900">
                    {selectedAdminAssignment.markingLecturer || "Not Assigned"}
                  </span>
                </div>
              </div>

              {selectedAdminAssignment.rules && (
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">
                    Rules & Regulations
                  </label>
                  <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100/50 text-sm text-amber-900 font-medium whitespace-pre-line leading-relaxed shadow-sm">
                    {selectedAdminAssignment.rules}
                  </div>
                </div>
              )}

              {selectedAdminAssignment.assignmentSheet && (
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">
                    Assignment Sheet
                  </label>
                  <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-3xl border border-green-100/50 group hover:bg-green-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-green-100 flex items-center justify-center shadow-sm">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-green-900 truncate max-w-[200px]">
                        {selectedAdminAssignment.assignmentSheet}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100">
              <button
                onClick={() => setShowAdminAssignmentDetailModal(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95 uppercase tracking-widest"
              >
                CLOSE VIEW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                Add New Subject
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="p-6 space-y-6">
              {/* Semester Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Select Semester
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(groupedSubjects).map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setSelectedSemester(sem)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        selectedSemester === sem
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                          : "border-gray-100 bg-white text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Search */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Search Subject
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-100 border-2 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>

                <div className="mt-4 max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {availableSubjects
                    .filter(
                      (s) =>
                        !courseSubjects.some((cs) => cs.code === s.code) &&
                        (s.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                          s.code
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())),
                    )
                    .map((subj) => (
                      <button
                        key={subj.code}
                        onClick={() => toggleSubjectSelection(subj.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                          selectedSubjectsInModal.includes(subj.name)
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                            : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                              selectedSubjectsInModal.includes(subj.name)
                                ? "bg-indigo-600 border-indigo-600"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {selectedSubjectsInModal.includes(subj.name) && (
                              <svg
                                className="w-3.5 h-3.5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`font-semibold ${
                                selectedSubjectsInModal.includes(subj.name)
                                  ? "text-indigo-900"
                                  : "text-gray-800"
                              }`}
                            >
                              {subj.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                              {subj.code}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  {availableSubjects.filter(
                    (s) =>
                      !courseSubjects.some((cs) => cs.code === s.code) &&
                      (s.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                        s.code
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())),
                  ).length > 0 && (
                    <div className="pt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                      Click to toggle selection
                    </div>
                  )}
                  {availableSubjects.filter(
                    (s) =>
                      !courseSubjects.some((cs) => cs.code === s.code) &&
                      (s.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                        s.code
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())),
                  ).length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      No new subjects found matching your search.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
              <button
                onClick={handleAddSubjects}
                disabled={selectedSubjectsInModal.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  selectedSubjectsInModal.length > 0
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-300 text-white cursor-not-allowed grayscale"
                }`}
              >
                ADD{" "}
                {selectedSubjectsInModal.length > 0
                  ? selectedSubjectsInModal.length
                  : ""}{" "}
                SUBJECT{selectedSubjectsInModal.length !== 1 ? "S" : ""}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedSubjectsInModal([]);
                }}
                className="w-full py-2 rounded-xl font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Lecturer Selection Modal */}
      {showLecturerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white">
              <h2 className="text-2xl font-bold">Assign Lecturer</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Assign a lecturer to{" "}
                <span className="font-bold text-white uppercase tracking-wider">
                  {subjectToAssign?.name}
                </span>{" "}
                ({subjectToAssign?.code})
              </p>
              <button
                onClick={() => {
                  setShowLecturerModal(false);
                  setLecturerSearchQuery("");
                }}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close modal"
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

            <div className="p-6 space-y-6">
              {/* Lecturer Search */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Search Lecturer
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={lecturerSearchQuery}
                    onChange={(e) => setLecturerSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-100 border-2 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>

                <div className="mt-4 max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {mockLecturers
                    .filter((l) =>
                      l
                        .toLowerCase()
                        .includes(lecturerSearchQuery.toLowerCase()),
                    )
                    .map((lecturer) => (
                      <button
                        key={lecturer}
                        onClick={() =>
                          updateSubjectLecturer(subjectToAssign?.code, lecturer)
                        }
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                          subjectToAssign?.assignedLecturer === lecturer
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                            : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                              subjectToAssign?.assignedLecturer === lecturer
                                ? "bg-indigo-600 border-indigo-600"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {subjectToAssign?.assignedLecturer === lecturer && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span
                            className={`font-semibold ${
                              subjectToAssign?.assignedLecturer === lecturer
                                ? "text-indigo-900"
                                : "text-gray-800"
                            }`}
                          >
                            {lecturer}
                          </span>
                        </div>
                      </button>
                    ))}
                  {mockLecturers.filter((l) =>
                    l.toLowerCase().includes(lecturerSearchQuery.toLowerCase()),
                  ).length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      No lecturers found matching your search.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowLecturerModal(false);
                  setLecturerSearchQuery("");
                }}
                className="w-full py-2 rounded-xl font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Assignment Modal */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white relative">
              <h2 className="text-3xl font-bold">
                {assignmentModalStage === 2
                  ? "Create Assignment"
                  : "Add Assignment"}
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                {assignmentModalStage === 1
                  ? "Select a semester and subject."
                  : "Fill in the assignment details."}
              </p>
              <button
                onClick={() => {
                  setShowAddAssignmentModal(false);
                  setSelectedAssignmentModalSubject(null);
                  setAssignmentModalStage(1);
                }}
                className="absolute top-8 right-8 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {assignmentModalStage === 1 && (
                <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                  {/* Semester Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      1. Select Semester
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.keys(groupedSubjects).map((sem) => (
                        <button
                          key={sem}
                          onClick={() => {
                            setSelectedAssignmentModalSemester(sem);
                            setSelectedAssignmentModalSubject(null);
                          }}
                          className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-between ${
                            selectedAssignmentModalSemester === sem
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                              : "border-gray-50 bg-gray-50/50 text-gray-500 hover:border-gray-200"
                          }`}
                        >
                          {sem}
                          {selectedAssignmentModalSemester === sem && (
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      2. Select Subject
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {groupedSubjects[selectedAssignmentModalSemester]?.map(
                        (subj: any) => (
                          <button
                            key={subj.code}
                            onClick={() =>
                              setSelectedAssignmentModalSubject(subj.code)
                            }
                            className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-between ${
                              selectedAssignmentModalSubject === subj.code
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                                : "border-gray-50 bg-gray-50/50 text-gray-500 hover:border-gray-200"
                            }`}
                          >
                            <div className="flex flex-col items-start text-left">
                              <span>{subj.name}</span>
                              <span className="text-[10px] opacity-60">
                                {subj.code}
                              </span>
                            </div>
                            {selectedAssignmentModalSubject === subj.code && (
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}

              {assignmentModalStage === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h4 className="font-black text-indigo-600 uppercase text-xs tracking-widest">
                        Assignment General Info
                      </h4>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                        Assignment Title
                      </label>
                      <input
                        type="text"
                        value={assignmentForm.title}
                        onChange={(e) =>
                          setAssignmentForm((prev: any) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="e.g., Midterm Project"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                          Total Marks
                        </label>
                        <input
                          type="number"
                          value={assignmentForm.totalMarks}
                          onChange={(e) =>
                            setAssignmentForm((prev: any) => ({
                              ...prev,
                              totalMarks: parseInt(e.target.value),
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                          Marking Lecturer
                        </label>
                        <select
                          value={assignmentForm.markingLecturer}
                          onChange={(e) =>
                            setAssignmentForm((prev: any) => ({
                              ...prev,
                              markingLecturer: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                        >
                          {mockLecturers.map((lec) => (
                            <option key={lec} value={lec}>
                              {lec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                          Unlock Date
                        </label>
                        <input
                          type="date"
                          value={assignmentForm.unlockDate}
                          onChange={(e) =>
                            setAssignmentForm((prev: any) => ({
                              ...prev,
                              unlockDate: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={assignmentForm.dueDate}
                          onChange={(e) =>
                            setAssignmentForm((prev: any) => ({
                              ...prev,
                              dueDate: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                        Assignment Sheet
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id="asgn-sheet-new"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAssignmentForm((prev: any) => ({
                                ...prev,
                                assignmentSheet: file,
                              }));
                            }
                          }}
                        />
                        <label
                          htmlFor="asgn-sheet-new"
                          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-sm font-bold text-gray-600"
                        >
                          <svg
                            className="w-4 h-4 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          {assignmentForm.assignmentSheet
                            ? assignmentForm.assignmentSheet.name
                            : "Upload PDF"}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                      Rules & Regulations
                    </label>
                    <textarea
                      rows={3}
                      value={assignmentForm.rules}
                      onChange={(e) =>
                        setAssignmentForm((prev: any) => ({
                          ...prev,
                          rules: e.target.value,
                        }))
                      }
                      placeholder="Add rules for this assignment..."
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
              {assignmentModalStage === 1 && (
                <button
                  onClick={() => setAssignmentModalStage(2)}
                  disabled={!selectedAssignmentModalSubject}
                  className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                    selectedAssignmentModalSubject
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                      : "bg-gray-300 text-white cursor-not-allowed grayscale"
                  }`}
                >
                  NEXT
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
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}

              {assignmentModalStage === 2 && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setAssignmentModalStage(1)}
                    className="flex-1 py-4 rounded-2xl font-bold text-sm bg-white border-2 border-gray-100 text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    BACK
                  </button>
                  <button
                    onClick={handleAddAssignments}
                    disabled={!assignmentForm.title}
                    className={`flex-[2] py-4 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                      assignmentForm.title
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                        : "bg-gray-300 text-white cursor-not-allowed grayscale"
                    }`}
                  >
                    CREATE ASSIGNMENT
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setShowAddAssignmentModal(false);
                  setSelectedAssignmentModalSubject(null);
                  setAssignmentModalStage(1);
                  setAssignmentForm({
                    title: "",
                    totalMarks: 100,
                    rules: "",
                    dueDate: "2026-06-01",
                    markingLecturer: mockLecturers[0],
                    assignmentSheet: null,
                  });
                }}
                className="w-full py-2 rounded-xl font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
