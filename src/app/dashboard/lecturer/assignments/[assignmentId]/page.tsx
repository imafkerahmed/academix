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

// Temporary mock data. In the future, fetch from PocketBase by assignmentId.
const mockAssignments: AssignmentDetails[] = [
  {
    id: "assign-1",
    title: "Build a Calculator App",
    subjectCode: "CS101",
    subjectName: "Introduction to Programming",
    courseName: "Computer Science Fundamentals",
    intakeName: "January 2024 Intake",
    dueDate: "2026-02-15",
    maxMarks: 100,
    description:
      "Students should build a basic calculator that supports +, -, *, / and clear.",
    assignmentSheetName: "Build a Calculator App - Assignment Sheet.pdf",
    assignmentSheetUrl: "/Afker%20Ahmed%20Qatar%20cv%20copy.pdf",
    submissions: [
      {
        id: "sub-1",
        studentName: "Alice Johnson",
        studentId: "S001",
        status: "submitted",
        submittedAt: "2026-02-10 14:20",
        marks: 92,
        grade: "A-",
        feedback: "Great job, minor improvements suggested on error handling.",
        filePlaceholder: "Afker Ahmed Qatar cv copy.pdf",
        fileUrl: "/Afker%20Ahmed%20Qatar%20cv%20copy.pdf",
      },
      {
        id: "sub-2",
        studentName: "Brian Lee",
        studentId: "S002",
        status: "submitted",
        submittedAt: "2026-02-12 09:05",
        filePlaceholder: "brian-calculator.zip",
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
        submittedAt: "2026-02-11 16:45",
        marks: 85,
        grade: "B+",
        feedback: "Good structure, consider improving UI.",
        filePlaceholder: "david-calculator.zip",
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

  // Scale: A: 85–100, B: 75–84, C: 55–74, S: 36–55, F: <35
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

  // Compare against assignment due date only (extensions handled elsewhere)
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

  // Policy: any late pass or pass after a fail becomes simple pass S
  if ((isLate || isResubmission) && base !== "F") {
    return "S";
  }

  return base;
}

export default function AssignmentMarkingPage() {
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

  // Sync selectedSubmissionId with URL
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

  // Clear selection only if the selected assignment is not in the current filter
  React.useEffect(() => {
    if (selectedSubmissionId && filteredSubmissions.length > 0) {
      const isStillInFilter = filteredSubmissions.some(
        (s) => s.id === selectedSubmissionId,
      );
      if (!isStillInFilter) {
        setSelectedSubmissionId(null);
      }
    }
  }, [filter, filteredSubmissions, selectedSubmissionId]);

  const selectedSubmission = assignment?.submissions.find(
    (s) => s.id === selectedSubmissionId,
  );

  const handleAllowResubmission = () => {
    if (!selectedSubmission) return;

    setAssignment((prev) => {
      if (!prev) return prev;
      const updated = prev.submissions.map((s) =>
        s.id === selectedSubmission.id ? { ...s, canResubmit: true } : s,
      );
      return { ...prev, submissions: updated };
    });
  };

  const handleSave = (grade: string, feedback: string) => {
    if (!selectedSubmission) return;

    // Require a numeric grade before saving
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
              // Allow further resubmission only if still failing
              canResubmit: isFail,
            }
          : s,
      );
      return { ...prev, submissions: updated };
    });
  };

  const [gradeInput, setGradeInput] = useState<string>(
    selectedSubmission?.grade ?? "",
  );
  const [feedbackInput, setFeedbackInput] = useState<string>(
    selectedSubmission?.feedback ?? "",
  );
  const [marksInput, setMarksInput] = useState<string>(
    selectedSubmission?.marks != null ? String(selectedSubmission.marks) : "",
  );
  // Keep form in sync when changing selected submission
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

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center border border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Assignment not found
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            We could not find details for this assignment.
          </p>
          <Button onClick={() => router.back()}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-2 md:px-6 md:py-3 pt-8 relative">
      <div className="max-w-6xl mx-auto space-y-2">
        <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{assignment.title}</DialogTitle>
              <DialogDescription>
                <span className="block text-xs text-gray-500 mb-1">
                  {assignment.subjectCode} · {assignment.subjectName} · Due:{" "}
                  {assignment.dueDate}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 border rounded-md overflow-hidden bg-gray-50">
                {assignment.assignmentSheetUrl ? (
                  <iframe
                    src={assignment.assignmentSheetUrl}
                    className="w-full h-full border-0"
                    title={assignment.assignmentSheetName ?? "Assignment sheet"}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500 px-4 text-center">
                    Assignment sheet preview is not available.
                  </div>
                )}
              </div>
              <div className="border rounded-md bg-white p-3 md:p-4 text-sm text-gray-700 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Instructions
                </h3>
                <p>
                  Students should build a basic calculator that supports +, -,
                  *, / and clear.
                </p>
                {assignment.description && (
                  <p className="text-xs text-gray-600">
                    {assignment.description}
                  </p>
                )}
                {assignment.assignmentSheetUrl && (
                  <a
                    href={assignment.assignmentSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Open PDF in new tab
                  </a>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mt-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => router.push("/dashboard/lecturer")}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {assignment.title}
              </h1>
              <p className="text-sm text-gray-600">
                {assignment.subjectCode} - {assignment.subjectName}
                {assignment.courseName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Intake: {assignment.intakeName} · Due: {assignment.dueDate}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <Button
              variant="outline"
              size="sm"
              className="ml-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              onClick={handleExportMarksheet}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export marksheet
            </Button>
          </div>
        </div>

        {/* Filters (mobile summary below header) */}
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 md:gap-3">
          <div className="flex flex-wrap gap-1.5 md:gap-2 text-xs md:text-sm">
            {/* Filter tabs with counts */}
            {(
              [
                {
                  id: "submitted",
                  label: "Submitted",
                  count: stats.submitted,
                  icon: Clock,
                  iconColor: "text-amber-600",
                },
                {
                  id: "not_submitted",
                  label: "Not submitted",
                  count: stats.notSubmitted,
                  icon: X,
                  iconColor: "text-gray-500",
                },
                {
                  id: "marked",
                  label: "Marked",
                  count: stats.marked,
                  icon: CheckCircle2,
                  iconColor: "text-green-600",
                },
                {
                  id: "resubmission",
                  label: "Resubmission",
                  count: assignment.submissions.filter((s) => s.canResubmit)
                    .length,
                  icon: RotateCcw,
                  iconColor: "text-purple-600",
                },
              ] as const
            ).map((f) => {
              const IconComponent = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1 px-2 md:px-3 py-1 rounded-full border text-[11px] md:text-sm font-medium transition-colors ${
                    filter === f.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <IconComponent
                    size={12}
                    className={`md:w-[14px] md:h-[14px] ${filter === f.id ? "text-white" : f.iconColor}`}
                  />
                  {f.label} ({f.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 items-start">
          {/* Left column: assignment card + submissions list - visible on all screens */}
          <div className="flex flex-col space-y-2 lg:col-span-1">
            <div
              className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 space-y-1 cursor-pointer hover:bg-gray-50 transition-colors"
              role="button"
              tabIndex={0}
              onClick={() => setIsSheetOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsSheetOpen(true);
                }
              }}
            >
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-gray-900">
                  Assignment sheet & instructions
                </h2>
                <p className="text-xs text-gray-500">
                  Click to view assignment PDF and instructions.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  Submissions
                </h2>
                <span className="text-xs text-gray-500">
                  {filteredSubmissions.length} shown
                </span>
              </div>
              <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
                {filteredSubmissions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSubmissionId(s.id);
                      if (window.innerWidth < 1024) {
                        setIsMobileMarkingModalOpen(true);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 flex flex-col gap-1 hover:bg-gray-50 transition-colors ${
                      selectedSubmissionId === s.id ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {s.studentName}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {s.studentId}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full border font-semibold uppercase tracking-wide ${getStatusBadgeClasses(s.status)}`}
                      >
                        {s.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                      <span>
                        {s.submittedAt
                          ? `Submitted: ${s.submittedAt}`
                          : "Not submitted"}
                      </span>
                      {s.grade && <span>Grade: {s.grade}</span>}
                    </div>
                    {s.canResubmit && (
                      <div className="mt-0.5 text-[10px] text-amber-600">
                        Resubmission allowed
                      </div>
                    )}
                  </button>
                ))}
                {filteredSubmissions.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No students in this filter.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Marking panel - hidden on mobile, visible on md+ */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 md:col-span-2 lg:col-span-3">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
              <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  {selectedSubmission
                    ? `Marking: ${selectedSubmission.studentName}`
                    : "Select a student to begin"}
                </h2>
              </div>

              {/* Mobile submission selector (hidden on md+) */}
              {selectedSubmission && (
                <select
                  value={selectedSubmissionId || ""}
                  onChange={(e) => {
                    setSelectedSubmissionId(e.target.value);
                    setIsMobileMarkingModalOpen(true);
                  }}
                  className="md:hidden text-xs px-2 py-1 border border-gray-300 rounded bg-white"
                >
                  {filteredSubmissions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} ({s.status.replace("_", " ")})
                    </option>
                  ))}
                </select>
              )}

              {selectedSubmission && selectedSubmission.status === "marked" && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 whitespace-nowrap">
                  <CheckCircle2 size={14} /> Marked
                </span>
              )}
            </div>
            {selectedSubmission ? (
              filter === "not_submitted" ? (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                    {/* Not submitted view: info only, no extensions */}
                    <div className="xl:col-span-2 space-y-3">
                      <div className="border border-gray-200 rounded-lg shadow-sm p-4 bg-white space-y-2 text-xs text-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          No submission from this student
                        </h3>
                        <p>
                          This student has not submitted this assignment yet.
                          Deadline extensions are managed by the administrator
                          and are not available in the lecturer portal.
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-0.5">
                        <p className="font-semibold text-gray-900 text-sm">
                          {selectedSubmission.studentName}
                        </p>
                        <p>ID: {selectedSubmission.studentId}</p>
                        <p>
                          Status: {selectedSubmission.status.replace("_", " ")}
                        </p>
                        {selectedSubmission.submittedAt && (
                          <p>Submitted at: {selectedSubmission.submittedAt}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 pt-1 border-t border-dashed border-gray-100 mt-2">
                    This page currently stores data in memory only. Later, you
                    can connect it to PocketBase to persist submissions and
                    grading data.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Preview + grading layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                    {/* Large preview on the left */}
                    <div className="md:col-span-2 lg:col-span-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden h-[350px] sm:h-[450px] md:h-[500px] lg:h-[600px] flex flex-col">
                        <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-gray-50">
                          <div className="truncate">
                            <span className="font-semibold mr-1">
                              Submission preview
                            </span>
                            {selectedSubmission.filePlaceholder && (
                              <span className="truncate">
                                ({selectedSubmission.filePlaceholder})
                              </span>
                            )}
                          </div>
                          {selectedSubmission.fileUrl && (
                            <a
                              href={selectedSubmission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                            >
                              Open in new tab
                            </a>
                          )}
                        </div>
                        <div className="flex-1 bg-white">
                          {selectedSubmission.fileUrl ? (
                            <iframe
                              src={selectedSubmission.fileUrl}
                              className="w-full h-full border-0"
                              title={`${selectedSubmission.studentName} submission preview`}
                            />
                          ) : selectedSubmission.filePlaceholder ? (
                            <div className="h-full flex flex-col items-center justify-center px-4 text-xs text-gray-500 text-center">
                              <p className="mb-1">
                                Live preview will appear here once file URLs are
                                connected.
                              </p>
                              <p className="font-semibold">
                                File: {selectedSubmission.filePlaceholder}
                              </p>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center px-4 text-xs text-gray-500 text-center">
                              No file uploaded for this student.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Grading panel and feedback on the right */}
                    <div className="md:col-span-2 lg:col-span-1 space-y-3">
                      <div className="border border-gray-200 rounded-lg shadow-sm p-4 bg-white space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          Grade Submission
                        </h3>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-700">
                            Grade (out of {assignment.maxMarks})
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={assignment.maxMarks}
                            value={marksInput}
                            onChange={(event) => {
                              const raw = event.target.value;
                              if (raw === "") {
                                setMarksInput("");
                                setGradeInput("");
                                return;
                              }

                              let numeric = Number(raw);
                              if (!Number.isFinite(numeric)) {
                                return;
                              }

                              if (numeric < 0) numeric = 0;
                              if (numeric > assignment.maxMarks)
                                numeric = assignment.maxMarks;

                              setMarksInput(String(numeric));
                              if (selectedSubmission) {
                                const auto = getEffectiveGrade(
                                  numeric,
                                  assignment,
                                  selectedSubmission,
                                );
                                setGradeInput(auto);
                              }
                            }}
                            placeholder={`e.g. 0 - ${assignment.maxMarks}`}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="mt-1 flex items-center justify-between text-xs sm:text-sm text-gray-700">
                            <div>
                              <span className="font-semibold mr-1">
                                Grade %:
                              </span>
                              <span className="text-base sm:text-lg font-semibold text-gray-900">
                                {gradePercentageLabel}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold mr-1">
                                Letter:
                              </span>
                              <span className="text-base sm:text-lg font-semibold text-gray-900">
                                {gradeInput || "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMarksInput(
                                selectedSubmission.marks != null
                                  ? String(selectedSubmission.marks)
                                  : "",
                              );
                              setGradeInput(selectedSubmission.grade ?? "");
                              setFeedbackInput(
                                selectedSubmission.feedback ?? "",
                              );
                            }}
                            className="w-full sm:w-auto"
                          >
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            disabled={!hasValidMarks}
                            onClick={() =>
                              handleSave(gradeInput, feedbackInput)
                            }
                            className="w-full sm:w-auto"
                          >
                            Save Grade
                          </Button>
                        </div>
                      </div>

                      {/* Feedback on the right */}
                      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="block text-xs font-semibold text-gray-700">
                            Feedback
                          </label>
                        </div>
                        <textarea
                          value={feedbackInput}
                          onChange={(event) =>
                            setFeedbackInput(event.target.value)
                          }
                          rows={4}
                          placeholder="Provide feedback to the student..."
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Student meta below feedback */}
                      <div className="hidden sm:block bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-0.5">
                        <p className="font-semibold text-gray-900 text-sm">
                          {selectedSubmission.studentName}
                        </p>
                        <p>ID: {selectedSubmission.studentId}</p>
                        <p>
                          Status: {selectedSubmission.status.replace("_", " ")}
                        </p>
                        {selectedSubmission.submittedAt && (
                          <p>Submitted at: {selectedSubmission.submittedAt}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 pt-1 border-t border-dashed border-gray-100 mt-2">
                    This page currently stores marks, feedback and resubmission
                    flags in memory only. Later, you can connect it to
                    PocketBase to persist grading and resubmission data.
                  </p>
                </div>
              )
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">
                Select a student from the list on the left to start marking.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Marking Modal */}
      <ModernModal
        open={isMobileMarkingModalOpen}
        onOpenChange={setIsMobileMarkingModalOpen}
        title={
          selectedSubmission
            ? `Marking: ${selectedSubmission.studentName}`
            : "Mark Submission"
        }
        subtitle={
          selectedSubmission
            ? `ID: ${selectedSubmission.studentId} • Status: ${selectedSubmission.status.replace("_", " ")}`
            : ""
        }
        avatarChar={selectedSubmission?.studentName.charAt(0)}
      >
        {selectedSubmission &&
          filter !== "not_submitted" &&
          selectedSubmission.fileUrl && (
            <div className="mb-4 -mx-6 px-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden h-[280px] flex flex-col">
                <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-gray-50">
                  <span className="font-semibold">Preview</span>
                  {selectedSubmission.fileUrl && (
                    <a
                      href={selectedSubmission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                    >
                      Open
                    </a>
                  )}
                </div>
                <div className="flex-1 bg-white">
                  <iframe
                    src={selectedSubmission.fileUrl}
                    className="w-full h-full border-0"
                    title={`${selectedSubmission.studentName} submission preview`}
                  />
                </div>
              </div>
            </div>
          )}

        <div className="space-y-3">
          {/* Grading Section */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Grade</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Marks (out of {assignment?.maxMarks})
              </label>
              <input
                type="number"
                min={0}
                max={assignment?.maxMarks}
                value={marksInput}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (raw === "") {
                    setMarksInput("");
                    setGradeInput("");
                    return;
                  }

                  let numeric = Number(raw);
                  if (!Number.isFinite(numeric)) {
                    return;
                  }

                  if (numeric < 0) numeric = 0;
                  if (numeric > (assignment?.maxMarks ?? 0))
                    numeric = assignment?.maxMarks ?? 0;

                  setMarksInput(String(numeric));
                  if (selectedSubmission && assignment) {
                    const auto = getEffectiveGrade(
                      numeric,
                      assignment,
                      selectedSubmission,
                    );
                    setGradeInput(auto);
                  }
                }}
                placeholder={`e.g. 0 - ${assignment?.maxMarks}`}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-700">
              <div>
                <span className="font-semibold">Grade %:</span>
                <span className="ml-1 text-sm font-semibold text-gray-900">
                  {gradePercentageLabel}
                </span>
              </div>
              <div>
                <span className="font-semibold">Letter:</span>
                <span className="ml-1 text-sm font-semibold text-gray-900">
                  {gradeInput || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Feedback
            </label>
            <textarea
              value={feedbackInput}
              onChange={(event) => setFeedbackInput(event.target.value)}
              rows={4}
              placeholder="Provide feedback to the student..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMarksInput(
                  selectedSubmission?.marks != null
                    ? String(selectedSubmission.marks)
                    : "",
                );
                setGradeInput(selectedSubmission?.grade ?? "");
                setFeedbackInput(selectedSubmission?.feedback ?? "");
              }}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              size="sm"
              disabled={!hasValidMarks}
              onClick={() => {
                handleSave(gradeInput, feedbackInput);
                setIsMobileMarkingModalOpen(false);
              }}
              className="flex-1"
            >
              Save & Close
            </Button>
          </div>
        </div>
      </ModernModal>
    </div>
  );
}
