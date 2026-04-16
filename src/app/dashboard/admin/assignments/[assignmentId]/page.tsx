"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import pb from "@/lib/pocketbase";

import {
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Search,
  BookOpen,
  Hash,
  FileText,
} from "lucide-react";
import { StatsCarousel } from "@/components/dashboard/shared/stats/StatsCarousel";
import { DashboardActionBar } from "@/components/dashboard/shared/DashboardActionBar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
}

interface Intake {
  code: string;
}

interface Course {
  name: string;
}

interface Subject {
  name: string;
}

interface CourseSubject {
  expand?: {
    subject?: Subject | Subject[];
    course_intake?: {
      expand?: {
        intake?: Intake;
        course?: Course;
      };
    };
  };
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  issued_at: string;
  due_date: string;
  opens_at?: string;
  open_after_due: boolean;
  total_marks?: number;
  file?: string;
  expand?: {
    course_subject?: CourseSubject;
    marker?: { name: string };
  };
}

interface Submission {
  id: string;
  assignment: string;
  submitted_at: string;
  evaluation_status: string;
  submission_status: string;
  mark?: number;
  grade?: string;
  feedback?: string;
  expand?: {
    student?: Student;
    assignment?: Assignment;
  };
  file?: string;
}


export default function AssignmentDetails() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Grading Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeData, setGradeData] = useState({
    mark: "",
    grade: "",
    feedback: "",
  });

  const fetchData = React.useCallback(async () => {
    try {
      const assignmentRecord = await pb.collection("assignments").getOne(assignmentId, {
        expand: "course_subject.subject,course_subject.course_intake.intake,course_subject.course_intake.course,marker",
      });

      const submissionsRecords = await pb.collection("assignment_submissions").getFullList({
        filter: `assignment = "${assignmentId}"`,
        expand: "student",
        sort: "-submitted_at",
      });

      setAssignment(assignmentRecord as unknown as Assignment);
      setSubmissions(submissionsRecords as unknown as Submission[]);
      setLoading(false);
    } catch (error: unknown) {
      console.error("Error fetching assignment details:", error);
      toast.error("Failed to load assignment data");
      router.push("/dashboard/admin/assignments");
    }
  }, [assignmentId, router]);

  const setupSubscription = React.useCallback(async () => {
    try {
      return await pb.collection("assignment_submissions").subscribe("*", (e) => {
        if (e.record.assignment === assignmentId) {
          fetchData();
        }
      });
    } catch (error: unknown) {
      console.error("Realtime subscription failed:", error);
      return null;
    }
  }, [assignmentId, fetchData]);

  useEffect(() => {
    if (!assignmentId) return;

    let unsubscribe: (() => void) | null = null;

    const start = async () => {
      await fetchData();
      const sub = await setupSubscription();
      if (sub) {
        unsubscribe = () => {
          pb.collection("assignment_submissions").unsubscribe("*").catch(err => {
            console.error("Failed to unsubscribe:", err);
          });
        };
      }
    };

    start();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [assignmentId, fetchData, setupSubscription]);


  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      await pb.collection("assignment_submissions").update(selectedSubmission.id, {
        mark: gradeData.mark,
        grade: gradeData.grade,
        feedback: gradeData.feedback,
        evaluation_status: "marked",
        marked_at: new Date().toISOString(),
        marked_by: pb.authStore.model?.id,
      });

      toast.success("Submission graded successfully!");
      setIsGradeModalOpen(false);
      setSelectedSubmission(null);
      setGradeData({ mark: "", grade: "", feedback: "" });
      fetchData();
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("Failed to submit grade");
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const studentName = submission.expand?.student?.name || "";
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "pending") return submission.evaluation_status === "pending";
    if (filter === "marked") return submission.evaluation_status === "marked";
    if (filter === "late") return submission.submission_status === "due-passed";
    return true;
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.evaluation_status === "pending").length,
    marked: submissions.filter(s => s.evaluation_status === "marked").length,
    late: submissions.filter(s => s.submission_status === "due-passed").length,
  };

  if (loading || !assignment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 uppercase tracking-widest font-black text-[10px] text-gray-400">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Synchronizing Records...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
                <FileText size={40} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">
                    {assignment.title}
                  </h1>
                  <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {assignment.expand?.course_subject?.expand?.course_intake?.expand?.intake?.code}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      {assignment.expand?.course_subject?.expand?.course_intake?.expand?.course?.name}
                    </span>
                  </div>
                  <h2 className="text-indigo-600 font-black text-sm md:text-base uppercase tracking-tight ml-5">
                    {Array.isArray(assignment.expand?.course_subject?.expand?.subject) 
                      ? assignment.expand?.course_subject?.expand?.subject[0]?.name 
                      : assignment.expand?.course_subject?.expand?.subject?.name}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Marker</p>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{assignment.expand?.marker?.name || "Unassigned"}</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xs">
                    {assignment.expand?.marker?.name?.charAt(0).toUpperCase() || "?"}
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <StatsCarousel
            stats={[
              {
                title: "Total Submissions",
                value: stats.total,
                icon: FileText,
                bgColor: "bg-white",
                iconColor: "text-blue-600",
              },
              {
                title: "Pending Marking",
                value: stats.pending,
                icon: Clock,
                bgColor: "bg-white",
                iconColor: "text-orange-600",
              },
              {
                title: "Marked Records",
                value: stats.marked,
                icon: CheckCircle,
                bgColor: "bg-white",
                iconColor: "text-green-600",
              },
              {
                title: "Late Turn-ins",
                value: stats.late,
                icon: AlertCircle,
                bgColor: "bg-white",
                iconColor: "text-red-600",
              },
            ]}
          />
        </div>

        {/* Filters & Table */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4">
            <DashboardActionBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search student name..."
              action={
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: "all", label: "ALL", color: "indigo" },
                    { id: "pending", label: "PENDING", color: "orange" },
                    { id: "marked", label: "MARKED", color: "green" },
                    { id: "late", label: "LATE", color: "red" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setFilter(t.id)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${
                        filter === t.id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                          : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              }
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Student Identity</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamps</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Sub. Status</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Eval. Status</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Grade</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50/30 transition-colors group/row">
                      <td className="px-10 py-6 text-left">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shadow-sm">
                            {submission.expand?.student?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1">{submission.expand?.student?.name}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {submission.expand?.student?.id?.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{new Date(submission.submitted_at).toLocaleDateString("en-GB")}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{new Date(submission.submitted_at).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-none pointer-events-none mx-auto",
                          submission.submission_status === "on-time" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>
                          {submission.submission_status}
                        </Badge>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-none pointer-events-none mx-auto",
                          submission.evaluation_status === "marked" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                        )}>
                          {submission.evaluation_status}
                        </Badge>
                      </td>
                      <td className="px-10 py-6 text-center">
                        {submission.mark ? (
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-sm font-black text-gray-900">{submission.grade}</span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{submission.mark}/{assignment.total_marks || 100}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic mx-auto">Pending</span>
                        )}
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center justify-end gap-2 pr-2 opacity-40 group-hover/row:opacity-100 transition-opacity">
                          {submission.file && (
                            <a
                              href={pb.files.getURL(submission, submission.file)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 bg-white border border-gray-100 rounded-xl text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                              title="Download Submission"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setGradeData({
                                mark: submission.mark?.toString() || "",
                                grade: submission.grade || "",
                                feedback: submission.feedback || "",
                              });
                              setIsGradeModalOpen(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            <CheckCircle size={14} />
                            Grade
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-24 bg-gray-50/30">
                <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300 mx-auto mb-6">
                  <Search size={40} />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">No submissions found</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>

        {/* Grading Modal */}
        <Dialog open={isGradeModalOpen} onOpenChange={setIsGradeModalOpen}>
          <DialogContent className="sm:max-w-[500px] w-[95vw] bg-white rounded-[2rem] p-0 border-none shadow-2xl">
            <div className="p-8 space-y-8">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">Grade Submission</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Evaluate student performance and provide feedback</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {selectedSubmission && (
                <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm capitalize">
                      {selectedSubmission.expand?.student?.name?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedSubmission.expand?.student?.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Marking Criteria: {assignment.total_marks || 100} Points Max</span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleGradeSubmission} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Awarded Mark</Label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        type="number"
                        required
                        max={assignment.total_marks}
                        placeholder="0"
                        value={gradeData.mark}
                        onChange={(e) => setGradeData({ ...gradeData, mark: e.target.value })}
                        className="h-14 pl-12 rounded-[1.2rem] border-gray-100 bg-gray-50/50 font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Final Grade</Label>
                    <Select required value={gradeData.grade} onValueChange={(val) => setGradeData({ ...gradeData, grade: val })}>
                      <SelectTrigger className="h-14 rounded-[1.2rem] border-gray-100 bg-gray-50/50 font-bold">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                        {["A", "B", "C", "S", "F"].map((g) => (
                          <SelectItem key={g} value={g} className="font-bold">Grade {g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Constructive Feedback</Label>
                  <Textarea
                    placeholder="Provide detailed feedback for the student..."
                    value={gradeData.feedback}
                    onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                    className="min-h-[120px] rounded-[1.5rem] border-gray-100 bg-gray-50/50 font-bold focus:bg-white resize-none p-6"
                  />
                </div>

                <div className="pt-6 border-t border-gray-50 flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsGradeModalOpen(false)} className="flex-1 py-6 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest text-gray-400">CANCEL</Button>
                  <Button type="submit" className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95">SUBMIT EVALUATION</Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

    </div>
  );
}
