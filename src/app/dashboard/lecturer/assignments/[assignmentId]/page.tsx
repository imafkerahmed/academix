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
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

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

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(searchParams?.get("submissionId") ?? null);
  const [filter, setFilter] = useState<
    "submitted" | "not_submitted" | "marked" | "resubmission"
  >("submitted");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobileMarkingModalOpen, setIsMobileMarkingModalOpen] =
    useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);

      const assignmentRecord = await pb
        .collection("assignments")
        .getOne(assignmentId, {
          expand:
            "course_subject.subject,course_subject.course_intake.intake,course_subject.course_intake.course,marker",
        });

      const courseSubject = (assignmentRecord as any).expand?.course_subject;
      const courseIntake = courseSubject?.expand?.course_intake;
      const course = courseIntake?.expand?.course;
      const intake = courseIntake?.expand?.intake;
      const subjectRecord = Array.isArray(courseSubject?.expand?.subject)
        ? courseSubject.expand.subject[0]
        : courseSubject?.expand?.subject;

      const enrollments = await pb.collection("enrollments").getFullList({
        filter: `course_intake = "${courseIntake?.id}"`,
        expand: "student",
        sort: "-created",
      });

      const submissionRecords = await pb
        .collection("assignment_submissions")
        .getFullList({
          filter: `assignment = "${assignmentId}"`,
          expand: "student",
          sort: "-submitted_at",
        });

      const submissionByStudent = new Map<string, any>();
      submissionRecords.forEach((submission: any) => {
        const studentId = submission.expand?.student?.id || submission.student;
        if (studentId && !submissionByStudent.has(studentId)) {
          submissionByStudent.set(studentId, submission);
        }
      });

      const submissions: Submission[] = enrollments.map((enrollment: any) => {
        const student = enrollment.expand?.student;
        const submission = student
          ? submissionByStudent.get(student.id)
          : undefined;
        const isMarked = submission?.evaluation_status === "marked";
        const hasSubmission = Boolean(submission);

        return {
          id: submission?.id || `missing-${student?.id || enrollment.id}`,
          studentName:
            student?.name || enrollment.registration_number || "Unknown",
          studentId:
            student?.id || enrollment.registration_number || enrollment.id,
          status: isMarked
            ? "marked"
            : hasSubmission
              ? "submitted"
              : "not_submitted",
          submittedAt: submission?.submitted_at,
          marks: submission?.mark,
          grade: submission?.grade,
          feedback: submission?.feedback,
          fileUrl: submission?.file
            ? pb.files.getURL(submission, submission.file)
            : undefined,
          canResubmit:
            submission?.evaluation_status === "marked" &&
            submission?.grade === "F",
        };
      });

      setAssignment({
        id: assignmentRecord.id,
        title: assignmentRecord.title,
        subjectCode: subjectRecord?.code || "N/A",
        subjectName: subjectRecord?.name || "Subject",
        courseName: course?.name || "Course",
        intakeName: intake?.code || "Intake",
        dueDate: assignmentRecord.due_date,
        maxMarks: assignmentRecord.total_marks || 100,
        description: assignmentRecord.description,
        assignmentSheetName: assignmentRecord.file || undefined,
        assignmentSheetUrl: assignmentRecord.file
          ? pb.files.getURL(assignmentRecord, assignmentRecord.file)
          : undefined,
        submissions,
      });
    } catch (error) {
      console.error("Error fetching assignment details:", error);
      toast.error("Failed to load assignment data");
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  // Sync selectedSubmissionId with URL
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
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
    if (filter === "submitted") {
      return assignment.submissions.filter(
        (s) => s.status === "submitted" || s.status === "marked",
      );
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

  const handleSave = async (grade: string, feedback: string) => {
    if (!selectedSubmission) return;

    // Require a numeric grade before saving
    if (!hasValidMarks) return;

    const numericMarks = Number(marksInput);
    const safeMarks = Number.isFinite(numericMarks) ? numericMarks : undefined;

    try {
      await pb
        .collection("assignment_submissions")
        .update(selectedSubmission.id, {
          mark: safeMarks,
          grade:
            safeMarks != null
              ? getEffectiveGrade(safeMarks, assignment!, selectedSubmission)
              : grade || undefined,
          feedback: feedback || undefined,
          evaluation_status: "marked",
          marked_at: new Date().toISOString(),
          marked_by: pb.authStore.model?.id,
        });

      await fetchData();
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Failed to save grade");
    }
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
  }, [
    selectedSubmission?.id,
    selectedSubmission?.grade,
    selectedSubmission?.feedback,
    selectedSubmission?.marks,
  ]);

  const rawMarks = marksInput.trim();
  const numericMarksInput = Number(rawMarks);
  const hasValidMarks =
    assignment &&
    rawMarks !== "" &&
    Number.isFinite(numericMarksInput) &&
    numericMarksInput >= 0 &&
    numericMarksInput <= assignment.maxMarks;

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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Page Header Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/dashboard/lecturer/intakes")}
            className="group/back w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm"
          >
            <ArrowLeft
              size={24}
              strokeWidth={3}
              className="group-hover/back:-translate-x-1 transition-transform"
            />
          </button>
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <FileText size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">
              Process <span className="text-indigo-600">Submissions</span>
            </h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="text-indigo-400">{assignment.subjectCode}</span>
              <span className="text-gray-200">/</span>
              {assignment.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all duration-500 shadow-xl shadow-emerald-500/5 group"
            onClick={handleExportMarksheet}
          >
            <FileSpreadsheet
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
            Export Marksheet
          </button>
          <button
            className="flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all duration-500 shadow-xl shadow-indigo-500/5 group"
            onClick={() => setIsSheetOpen(true)}
          >
            <FileText
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
            Instructions
          </button>
        </div>
      </div>

      <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col border-none p-0 overflow-hidden bg-white/80 backdrop-blur-xl rounded-[2.5rem]">
          <DialogHeader className="p-8 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <FileText size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-gray-900 tracking-tight uppercase">
                  {assignment.title}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {assignment.subjectCode} · {assignment.subjectName} · Due:{" "}
                  {assignment.dueDate}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] overflow-hidden aspect-[4/3] relative">
                  {assignment.assignmentSheetUrl ? (
                    <iframe
                      src={assignment.assignmentSheetUrl}
                      className="w-full h-full border-0"
                      title={
                        assignment.assignmentSheetName ?? "Assignment sheet"
                      }
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center text-gray-400">
                      <FileSpreadsheet size={48} className="opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">
                        Preview Unavailable
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">
                    Instructions
                  </h3>
                  <div className="bg-indigo-50/30 border border-indigo-50 rounded-[1.5rem] p-6 text-sm text-gray-600 leading-relaxed italic">
                    {assignment.description ||
                      "No specific instructions provided."}
                  </div>
                </div>
                {assignment.assignmentSheetUrl && (
                  <a
                    href={assignment.assignmentSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all duration-300 group"
                  >
                    <FileText
                      size={16}
                      className="group-hover:scale-110 transition-transform"
                    />
                    Open Source PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters Overlay */}
      <div className="flex flex-wrap items-center gap-3 p-2 bg-gray-50/50 rounded-[2rem] border border-gray-100 w-fit">
        {(
          [
            {
              id: "submitted",
              label: "Submitted",
              count: stats.submitted,
              icon: Clock,
              color: "amber",
            },
            {
              id: "not_submitted",
              label: "Missing",
              count: stats.notSubmitted,
              icon: X,
              color: "gray",
            },
            {
              id: "marked",
              label: "Graded",
              count: stats.marked,
              icon: CheckCircle2,
              color: "emerald",
            },
            {
              id: "resubmission",
              label: "Resubmits",
              count: assignment.submissions.filter((s) => s.canResubmit).length,
              icon: RotateCcw,
              color: "purple",
            },
          ] as const
        ).map((f) => {
          const IconComponent = f.icon;
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 scale-100 active:scale-95 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.05]"
                  : "text-gray-400 hover:text-indigo-600 hover:bg-white/80"
              }`}
            >
              <IconComponent
                size={14}
                className={isActive ? "text-white" : `text-${f.color}-400`}
              />
              {f.label}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start min-h-[700px]">
        {/* Left column: Submissions list */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[750px] animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                Student List
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {filteredSubmissions.length} Entries
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {filteredSubmissions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSubmissionId(s.id);
                  if (window.innerWidth < 1024) {
                    setIsMobileMarkingModalOpen(true);
                  }
                }}
                className={`w-full text-left p-4 rounded-2xl flex flex-col gap-2 transition-all duration-300 group ${
                  selectedSubmissionId === s.id
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                    : "bg-white border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-black truncate ${selectedSubmissionId === s.id ? "text-white" : "text-gray-900"}`}
                    >
                      {s.studentName}
                    </p>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest ${selectedSubmissionId === s.id ? "text-indigo-200" : "text-gray-400"}`}
                    >
                      ID: {s.studentId}
                    </p>
                  </div>
                  {s.marks != null && (
                    <div
                      className={`px-2 py-1 rounded-lg text-[10px] font-black ${selectedSubmissionId === s.id ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"}`}
                    >
                      {s.marks}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${selectedSubmissionId === s.id ? "text-indigo-100" : "text-gray-500"}`}
                  >
                    {s.submittedAt ? "Submitted" : "Missing"}
                  </span>
                  {s.grade && (
                    <span
                      className={`text-[10px] font-black ${selectedSubmissionId === s.id ? "text-white" : "text-indigo-600"}`}
                    >
                      Grade {s.grade}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {filteredSubmissions.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                <FileSpreadsheet size={32} className="text-gray-300 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  No results found
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Marking Area */}
        <div className="lg:col-span-3 min-h-[600px] animate-in fade-in slide-in-from-right-8 duration-1000 delay-500">
          {selectedSubmission ? (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[750px]">
              {/* Submission Header info */}
              <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white border-4 border-white shadow-xl shadow-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl overflow-hidden ring-1 ring-gray-100">
                    {selectedSubmission.studentName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                      {selectedSubmission.studentName}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Lancer ID: {selectedSubmission.studentId}</span>
                      <div className="w-1 h-1 rounded-full bg-gray-200" />
                      <span
                        className={
                          selectedSubmission.status === "marked"
                            ? "text-emerald-500"
                            : "text-amber-500"
                        }
                      >
                        {selectedSubmission.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedSubmission.status === "marked" && (
                  <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-100 animate-in zoom-in-95 duration-500">
                    <CheckCircle2 size={16} />
                    Grading Complete
                  </div>
                )}
              </div>

              {/* View Content or Placeholder if not submitted */}
              <div className="flex-1 overflow-hidden p-8 flex flex-col md:flex-row gap-8">
                {/* File Preview */}
                <div className="flex-1 min-h-[400px] bg-gray-50/50 border border-gray-100 overflow-hidden relative group">
                  {selectedSubmission.fileUrl ? (
                    <iframe
                      src={selectedSubmission.fileUrl}
                      className="w-full h-full border-0"
                      title="Preview"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-6 p-12 text-center">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-200 animate-pulse">
                        <FileText size={40} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">
                          {selectedSubmission.status === "not_submitted"
                            ? "No Submission"
                            : "Preview Pending"}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose max-w-[200px]">
                          {selectedSubmission.status === "not_submitted"
                            ? "This student has not uploaded any file for this assignment."
                            : "File found but preview URL is not correctly formatted yet."}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedSubmission.fileUrl && (
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={selectedSubmission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white/90 backdrop-blur rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-xl"
                      >
                        Open in Full Screen
                      </a>
                    </div>
                  )}
                </div>

                {/* Grading Panel */}
                {selectedSubmission.status !== "not_submitted" && (
                  <div className="w-full md:w-[320px] lg:w-[380px] flex flex-col gap-6">
                    <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                      <div className="relative space-y-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">
                            Assignment Score
                          </p>
                          <div className="flex items-baseline gap-2">
                            <input
                              type="text"
                              value={marksInput}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || /^\d+$/.test(val)) {
                                  const num = Number(val);
                                  if (num <= (assignment?.maxMarks ?? 0)) {
                                    setMarksInput(val);
                                    const autoGrade = getEffectiveGrade(
                                      num,
                                      assignment,
                                      selectedSubmission,
                                    );
                                    setGradeInput(autoGrade);
                                  }
                                }
                              }}
                              className="w-20 bg-white/10 border-2 border-white/20 rounded-2xl px-3 py-2 text-3xl font-black text-center focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                              placeholder="0"
                            />
                            <span className="text-xl font-bold opacity-40">
                              / {assignment.maxMarks}
                            </span>
                            <span className="ml-auto text-4xl font-black">
                              {gradeInput || "—"}
                            </span>
                          </div>
                        </div>

                        <div className="h-px bg-white/10 w-full" />

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-4">
                            Feedback & Insights
                          </p>
                          <textarea
                            value={feedbackInput}
                            onChange={(e) => setFeedbackInput(e.target.value)}
                            placeholder="Write a private note to the student..."
                            className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-4 text-xs font-bold placeholder:text-indigo-300 focus:outline-none focus:border-white focus:bg-white/20 transition-all min-h-[160px] resize-none"
                          />
                        </div>

                        <button
                          onClick={() => handleSave(gradeInput, feedbackInput)}
                          disabled={!hasValidMarks}
                          className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                        >
                          {selectedSubmission.status === "marked"
                            ? "Update Evaluation"
                            : "Post Evaluation"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center opacity-60 bg-white/50 border-2 border-dashed border-gray-100 rounded-[3rem]">
              <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-200 mb-8 animate-bounce duration-[3000ms]">
                <FileText size={48} />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2 uppercase">
                Select a <span className="text-indigo-600">Student</span>
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] max-w-[200px] leading-loose">
                Choose a submission from the list to begin marking and providing
                feedback.
              </p>
            </div>
          )}
        </div>
      </div>

      <ModernModal
        open={isMobileMarkingModalOpen}
        onOpenChange={setIsMobileMarkingModalOpen}
        title="Grade Submission"
        subtitle={selectedSubmission?.studentName || "Grading"}
        avatarChar={selectedSubmission?.studentName.charAt(0)}
      >
        <div className="p-6 space-y-6">
          {/* Mobile grading simplified form */}
          {selectedSubmission?.status !== "not_submitted" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Assignment Score
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={marksInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) {
                        const num = Number(val);
                        if (num <= (assignment?.maxMarks ?? 0)) {
                          setMarksInput(val);
                          if (selectedSubmission) {
                            const autoGrade = getEffectiveGrade(
                              num,
                              assignment,
                              selectedSubmission,
                            );
                            setGradeInput(autoGrade);
                          }
                        }
                      }
                    }}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-black text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="0"
                  />
                  <div className="flex flex-col items-end">
                    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                      Max Score
                    </span>
                    <span className="text-gray-900 font-black">
                      / {assignment.maxMarks}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Feedback
                  </label>
                  <span className="text-xs font-black text-indigo-600">
                    Grade: {gradeInput || "—"}
                  </span>
                </div>
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Write feedback..."
                />
              </div>
              <button
                onClick={() => {
                  handleSave(gradeInput, feedbackInput);
                  setIsMobileMarkingModalOpen(false);
                }}
                disabled={!hasValidMarks}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {selectedSubmission?.status === "marked"
                  ? "Update Evaluation"
                  : "Post Evaluation"}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                No submission to grade
              </p>
            </div>
          )}
        </div>
      </ModernModal>
    </div>
  );
}
