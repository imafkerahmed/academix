"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModernModal } from "@/components/ui/modern-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  status: "submitted" | "not_submitted" | "marked";
  submittedAt?: string;
  marks?: number;
  grade?: string;
  feedback?: string;
  filePlaceholder?: string;
  fileUrl?: string;
  canResubmit?: boolean;
}

interface AssignmentDetails {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  courseName: string;
  intakeName: string;
  dueDate: string;
  maxMarks: number;
  description?: string;
  assignmentSheetName?: string;
  assignmentSheetUrl?: string;
  submissions: Submission[];
}

// Mock data consistency for Admin
const mockAssignments: AssignmentDetails[] = [
  {
    id: "asgn-1",
    title: "Midterm Project",
    subjectCode: "CS101",
    subjectName: "Introduction to Programming",
    courseName: "Computer Science Fundamentals",
    intakeName: "January 2024 Intake",
    dueDate: "2026-06-01",
    maxMarks: 100,
    description: "Final project for the first half of the semester.",
    assignmentSheetName: "midterm-project.pdf",
    assignmentSheetUrl: "/Afker%20Ahmed%20Qatar%20cv%20copy.pdf",
    submissions: [
      {
        id: "sub-1",
        studentName: "Alice Johnson",
        studentId: "S001",
        status: "submitted",
        submittedAt: "2026-05-28 14:20",
        marks: 92,
        grade: "A-",
        feedback: "Great job, minor improvements suggested on error handling.",
        filePlaceholder: "Alice_Midterm.pdf",
        fileUrl: "/Afker%20Ahmed%20Qatar%20cv%20copy.pdf",
      },
      {
        id: "sub-2",
        studentName: "Brian Lee",
        studentId: "S002",
        status: "submitted",
        submittedAt: "2026-05-30 09:05",
        filePlaceholder: "brian-project.zip",
      },
      {
        id: "sub-3",
        studentName: "Carla Mendes",
        studentId: "S003",
        status: "not_submitted",
      },
      {
        id: "sub-4",
        studentName: "David Kim",
        studentId: "S004",
        status: "marked",
        submittedAt: "2026-05-29 16:45",
        marks: 85,
        grade: "B+",
        feedback: "Good structure, consider improving UI.",
        filePlaceholder: "david-project.zip",
      },
    ],
  },
];

function getStatusBadgeClasses(status: Submission["status"]) {
  switch (status) {
    case "submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "marked":
      return "bg-green-50 text-green-700 border-green-200";
    case "not_submitted":
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function getGradeFromMarks(marks: number, maxMarks: number): string {
  if (!Number.isFinite(marks) || maxMarks <= 0) return "";
  const percentage = (marks / maxMarks) * 100;

  if (percentage >= 85) return "A";
  if (percentage >= 75) return "B";
  if (percentage >= 55) return "C";
  if (percentage >= 36) return "S";
  return "F";
}

function getEffectiveGrade(
  marks: number,
  assignment: AssignmentDetails,
  submission: Submission,
): string {
  const base = getGradeFromMarks(marks, assignment.maxMarks);

  const dueDateString = assignment.dueDate;
  let isLate = false;
  if (submission.submittedAt) {
    const submitted = new Date(submission.submittedAt);
    const due = new Date(dueDateString);
    if (!Number.isNaN(submitted.getTime()) && !Number.isNaN(due.getTime())) {
      isLate = submitted.getTime() > due.getTime();
    }
  }

  const isResubmission = !!submission.canResubmit && base !== "F";

  if ((isLate || isResubmission) && base !== "F") {
    return "S";
  }

  return base;
}

export default function AdminAssignmentSubmissionsPage() {
  const params = useParams<{ assignmentId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = params?.assignmentId;

  const initialAssignment = useMemo(
    () =>
      mockAssignments.find((a) => a.id === assignmentId) ?? mockAssignments[0],
    [assignmentId],
  );

  const [assignment, setAssignment] = useState<AssignmentDetails | null>(
    initialAssignment,
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(searchParams?.get("submissionId") ?? null);
  const [filter, setFilter] = useState<
    "submitted" | "not_submitted" | "marked" | "resubmission"
  >("submitted");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobileMarkingModalOpen, setIsMobileMarkingModalOpen] =
    useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedSubmissionId) {
      params.set("submissionId", selectedSubmissionId);
      router.replace(`?${params.toString()}`, { scroll: false });
    } else {
      params.delete("submissionId");
      router.replace(
        selectedSubmissionId === null
          ? window.location.pathname
          : `?${params.toString()}`,
        { scroll: false },
      );
    }
  }, [selectedSubmissionId, router]);

  const stats = useMemo(() => {
    if (!assignment)
      return { total: 0, submitted: 0, notSubmitted: 0, marked: 0 };
    const total = assignment.submissions.length;
    const submitted = assignment.submissions.filter(
      (s) => s.status === "submitted" || s.status === "marked",
    ).length;
    const marked = assignment.submissions.filter(
      (s) => s.status === "marked",
    ).length;
    const notSubmitted = assignment.submissions.filter(
      (s) => s.status === "not_submitted",
    ).length;

    return { total, submitted, notSubmitted, marked };
  }, [assignment]);

  const handleExportMarksheet = () => {
    if (!assignment) return;

    const headers = [
      "Student Name",
      "Student ID",
      "Status",
      "Submitted At",
      "Marks",
      "Grade",
      "Can Resubmit",
    ];

    const rows = assignment.submissions.map((s) => [
      s.studentName,
      s.studentId,
      s.status.replace("_", " "),
      s.submittedAt ?? "",
      s.marks != null ? String(s.marks) : "",
      s.grade ?? "",
      s.canResubmit ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((field) => {
            const value = field.replace(/"/g, '""');
            return `"${value}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeTitle = assignment.title.replace(/[^a-z0-9]+/gi, "-");
    link.download = `${safeTitle || "marksheet"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredSubmissions = useMemo(() => {
    if (!assignment) return [];
    if (filter === "resubmission") {
      return assignment.submissions.filter((s) => s.canResubmit);
    }
    return assignment.submissions.filter((s) => s.status === filter);
  }, [assignment, filter]);

  const selectedSubmission = assignment?.submissions.find(
    (s) => s.id === selectedSubmissionId,
  );

  const [marksInput, setMarksInput] = useState<string>(
    selectedSubmission?.marks != null ? String(selectedSubmission.marks) : "",
  );
  const [gradeInput, setGradeInput] = useState<string>(
    selectedSubmission?.grade ?? "",
  );
  const [feedbackInput, setFeedbackInput] = useState<string>(
    selectedSubmission?.feedback ?? "",
  );

  React.useEffect(() => {
    setGradeInput(selectedSubmission?.grade ?? "");
    setFeedbackInput(selectedSubmission?.feedback ?? "");
    setMarksInput(
      selectedSubmission?.marks != null ? String(selectedSubmission.marks) : "",
    );
  }, [selectedSubmission?.id]);

  const hasValidMarks = React.useMemo(() => {
    if (!assignment) return false;
    const raw = marksInput.trim();
    if (!raw) return false;
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return false;
    if (numeric < 0) return false;
    if (numeric > assignment.maxMarks) return false;
    return true;
  }, [marksInput, assignment]);

  const gradePercentageLabel = React.useMemo(() => {
    if (!assignment) return "0.0%";
    const numeric = Number(marksInput);
    if (!Number.isFinite(numeric) || assignment.maxMarks <= 0) return "0.0%";
    const pct = (numeric / assignment.maxMarks) * 100;
    return `${pct.toFixed(1)}%`;
  }, [marksInput, assignment]);

  const handleSave = (grade: string, feedback: string) => {
    if (!selectedSubmission) return;
    if (!hasValidMarks) return;

    setAssignment((prev) => {
      if (!prev) return prev;
      const numericMarks = Number(marksInput);
      const safeMarks = Number.isFinite(numericMarks)
        ? numericMarks
        : undefined;
      const autoGrade =
        safeMarks != null
          ? getEffectiveGrade(safeMarks, prev, selectedSubmission)
          : grade || undefined;
      const isFail = autoGrade === "F";
      const updated = prev.submissions.map((s) =>
        s.id === selectedSubmission.id
          ? {
              ...s,
              marks: safeMarks,
              grade: autoGrade || undefined,
              feedback: feedback || undefined,
              status: "marked" as const,
              canResubmit: isFail,
            }
          : s,
      );
      return { ...prev, submissions: updated };
    });
  };

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center border border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Assignment not found
          </h1>
          <Button onClick={() => router.back()}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-2 md:px-6 md:py-3 pt-8 relative">
      <div className="max-w-6xl mx-auto space-y-4">
        <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{assignment.title}</DialogTitle>
              <DialogDescription>
                {assignment.subjectCode} · {assignment.subjectName} · Due:{" "}
                {assignment.dueDate}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 border rounded-md overflow-hidden bg-gray-50">
                {assignment.assignmentSheetUrl ? (
                  <iframe
                    src={assignment.assignmentSheetUrl}
                    className="w-full h-full border-0"
                    title="Assignment sheet"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">
                    Preview not available
                  </div>
                )}
              </div>
              <div className="border rounded-md bg-white p-4 text-sm text-gray-700 space-y-2">
                <h3 className="font-semibold text-gray-900 text-base">
                  Instructions
                </h3>
                <p>{assignment.description}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mt-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-sm"
              onClick={() => router.back()}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">
                {assignment.title}
              </h1>
              <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                {assignment.subjectCode} — {assignment.subjectName}
              </p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                {assignment.courseName} · Intake: {assignment.intakeName}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            onClick={handleExportMarksheet}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Marks
          </Button>
        </div>

        {/* Stats & Filters */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Total Students
              </p>
              <p className="text-lg font-black text-gray-900">{stats.total}</p>
            </div>
            <div className="h-8 w-px bg-gray-100 hidden md:block" />
            <div className="text-center md:text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Submitted
              </p>
              <p className="text-lg font-black text-emerald-600">
                {stats.submitted}
              </p>
            </div>
            <div className="h-8 w-px bg-gray-100 hidden md:block" />
            <div className="text-center md:text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Marked
              </p>
              <p className="text-lg font-black text-indigo-600">
                {stats.marked}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "submitted", label: "Submitted", icon: Clock },
              { id: "not_submitted", label: "Pending", icon: X },
              { id: "marked", label: "Marked", icon: CheckCircle2 },
              { id: "resubmission", label: "Resubmits", icon: RotateCcw },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  filter === f.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <f.icon size={14} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* List */}
          <div className="md:col-span-1 space-y-4">
            <div
              className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl shadow-indigo-100 cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => setIsSheetOpen(true)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FileText size={20} />
                </div>
                <p className="font-bold text-sm">Assignment Info</p>
              </div>
              <p className="text-[10px] opacity-80 leading-relaxed font-medium">
                View original assignment sheet and marking instructions.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Submissions
                </h2>
              </div>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                {filteredSubmissions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSubmissionId(s.id);
                      if (window.innerWidth < 768)
                        setIsMobileMarkingModalOpen(true);
                    }}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedSubmissionId === s.id ? "bg-indigo-50/50" : ""}`}
                  >
                    <p className="text-sm font-bold text-gray-900">
                      {s.studentName}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold mb-2">
                      ID: {s.studentId}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-2 ${getStatusBadgeClasses(s.status)}`}
                      >
                        {s.status.replace("_", " ")}
                      </span>
                      {s.grade && (
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          {s.grade}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {filteredSubmissions.length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-400 font-bold italic">
                    No submissions found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Marking Area */}
          <div className="md:col-span-3 hidden md:block">
            {selectedSubmission ? (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden h-fit">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black">
                      {selectedSubmission.studentName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                        {selectedSubmission.studentName}
                      </h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        STUDENT ID: {selectedSubmission.studentId}
                      </p>
                    </div>
                  </div>
                  {selectedSubmission.status === "marked" && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        Marked
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Submission Preview
                      </h3>
                      {selectedSubmission.fileUrl && (
                        <a
                          href={selectedSubmission.fileUrl}
                          target="_blank"
                          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                          Full Window
                        </a>
                      )}
                    </div>
                    <div className="bg-gray-100 rounded-3xl overflow-hidden aspect-[4/3] border-4 border-gray-50 shadow-inner flex items-center justify-center relative group">
                      {selectedSubmission.fileUrl ? (
                        <iframe
                          src={selectedSubmission.fileUrl}
                          className="w-full h-full border-0"
                        />
                      ) : (
                        <div className="text-center p-8">
                          <FileText
                            size={48}
                            className="text-gray-300 mx-auto mb-4"
                          />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {selectedSubmission.filePlaceholder ||
                              "No file uploaded"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grading */}
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                      <h4 className="font-black text-indigo-600 uppercase text-xs tracking-widest border-b border-gray-100 pb-3">
                        Grading System
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">
                            Marks ( / {assignment.maxMarks})
                          </label>
                          <input
                            type="number"
                            value={marksInput}
                            onChange={(e) => setMarksInput(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
                            <p className="text-[10px] font-black uppercase opacity-60">
                              Result
                            </p>
                            <p className="text-lg font-black">
                              {gradeInput || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">
                          Feedback
                        </label>
                        <textarea
                          rows={4}
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium resize-none"
                          placeholder="Your private feedback..."
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            setMarksInput(
                              selectedSubmission.marks?.toString() || "",
                            );
                            setFeedbackInput(selectedSubmission.feedback || "");
                          }}
                          className="flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest bg-white border-2 border-gray-100 text-gray-400 hover:bg-gray-50 transition-all"
                        >
                          Reset
                        </button>
                        <button
                          disabled={!hasValidMarks}
                          onClick={() => handleSave(gradeInput, feedbackInput)}
                          className={`flex-[2] py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                            hasValidMarks
                              ? "bg-indigo-600 text-white shadow-indigo-100"
                              : "bg-gray-100 text-gray-300 pointer-events-none"
                          }`}
                        >
                          Update Grade
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] border border-gray-100 border-dashed p-20 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="text-gray-300" size={40} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">
                  Select a Submission
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                  Choose a student from the left sidebar to start seeing their
                  work and grading.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Modal */}
      <ModernModal
        open={isMobileMarkingModalOpen}
        onOpenChange={setIsMobileMarkingModalOpen}
        title={selectedSubmission?.studentName ?? ""}
        subtitle={
          selectedSubmission ? `ID: ${selectedSubmission.studentId}` : ""
        }
        avatarChar={selectedSubmission?.studentName.charAt(0)}
      >
        {selectedSubmission && (
          <div className="space-y-4">
            {selectedSubmission.fileUrl && (
              <div className="bg-gray-100 rounded-3xl overflow-hidden aspect-video border-4 border-gray-50 shadow-inner">
                <iframe
                  src={selectedSubmission.fileUrl}
                  className="w-full h-full border-0"
                />
              </div>
            )}

            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">
                  Marks
                </label>
                <input
                  type="number"
                  value={marksInput}
                  onChange={(e) => setMarksInput(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">
                  Feedback
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium"
                />
              </div>
              <button
                disabled={!hasValidMarks}
                onClick={() => {
                  handleSave(gradeInput, feedbackInput);
                  setIsMobileMarkingModalOpen(false);
                }}
                className="w-full py-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-xl shadow-indigo-100"
              >
                SAVE GRADE
              </button>
            </div>
          </div>
        )}
      </ModernModal>
    </div>
  );
}
