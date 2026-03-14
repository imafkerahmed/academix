"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import pb, { logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Menu,
  Plus,
  ArrowRight,
  User,
  Search,
  BookOpen,
  ArrowLeft,
  Upload,
  Hash,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { format } from "date-fns";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
    course_subject?: any;
    marker?: any;
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
  expand?: {
    student?: any;
    assignment?: Assignment;
  };
  file?: string;
}

export default function AssignmentManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const nowTimestamp = useMemo(() => Date.now(), []);

  // Create Assignment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [ongoingSubjects, setOngoingSubjects] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedIntakeId, setSelectedIntakeId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [subjectSearchTerm, setSubjectSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    total_marks: "",
    marker: "",
    open_after_due: false,
    issued_at: new Date().toISOString().split("T")[0],
    due_date: new Date(nowTimestamp + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    opens_at: new Date().toISOString().split("T")[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Grading Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [gradeData, setGradeData] = useState({
    mark: "",
    grade: "",
    feedback: "",
  });

  const fetchMarkers = useCallback(async () => {
    try {
      const records = await pb.collection("users").getFullList({
        filter: 'role = "lecturer"',
      });
      setMarkers(records);
    } catch (error) {
      console.error("Error fetching markers:", error);
    }
  }, []);

  const fetchOngoingSubjects = useCallback(async () => {
    try {
      const records = await pb.collection("course_subjects").getFullList({
        filter: 'course_intake.course_status = "ongoing"',
        expand: "subject,course_intake.course,course_intake.intake",
      });
      setOngoingSubjects(records);
    } catch (error) {
      console.error("Error fetching ongoing subjects:", error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const assignmentsPromise = pb
        .collection("assignments")
        .getFullList({
          expand: "course_subject.subject,course_subject.course_intake.intake,course_subject.course_intake.course,marker",
          sort: "-created",
        })
        .catch(() => []);

      const submissionsPromise = pb
        .collection("assignment_submissions")
        .getFullList({
          expand: "student,assignment",
          sort: "-created",
        })
        .catch(() => []);

      const [assignmentsData, submissionsData] = await Promise.all([
        assignmentsPromise,
        submissionsPromise,
      ]);

      setAssignments((assignmentsData as any) || []);
      setSubmissions((submissionsData as any) || []);
      setLoading(false);
    } catch (error) {
      setAssignments([]);
      setSubmissions([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = false;

    const setupSubscriptions = async () => {
      try {
        await pb.collection("assignments").subscribe("*", () => fetchData());
        await pb.collection("assignment_submissions").subscribe("*", () => fetchData());
        isSubscribed = true;
      } catch (error) {
        console.error("Realtime subscriptions failed:", error);
      }
    };

    fetchData();
    fetchMarkers();
    fetchOngoingSubjects();
    setupSubscriptions();

    return () => {
      if (isSubscribed) {
        pb.collection("assignments").unsubscribe("*").catch(() => {});
        pb.collection("assignment_submissions").unsubscribe("*").catch(() => {});
      }
    };
  }, [fetchData, fetchMarkers, fetchOngoingSubjects]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("course_subject", selectedSubjectId);
      data.append("marker", formData.marker);
      data.append("total_marks", formData.total_marks);
      data.append("open_after_due", String(formData.open_after_due));
      data.append("issued_at", new Date(formData.issued_at).toISOString());
      data.append("due_date", new Date(formData.due_date).toISOString());
      data.append("opens_at", new Date(formData.opens_at).toISOString());

      if (selectedFile) {
        data.append("file", selectedFile);
      }

      await pb.collection("assignments").create(data);

      toast.success("Assignment created successfully!");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment");
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedIntakeId("");
    setSelectedCourseId("");
    setSelectedSubjectId("");
    setSubjectSearchTerm("");
    setFormData({
      title: "",
      description: "",
      total_marks: "",
      marker: "",
      open_after_due: false,
      issued_at: new Date().toISOString().split("T")[0],
      due_date: new Date(nowTimestamp + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      opens_at: new Date().toISOString().split("T")[0],
    });
    setSelectedFile(null);
  };

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

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getAssignmentStatus = (assignmentId: string) => {
    const assignmentSubmissions = submissions.filter((s) => s.assignment === assignmentId);
    if (assignmentSubmissions.length === 0) return "none";
    const pendingCount = assignmentSubmissions.filter((s) => s.evaluation_status === "pending").length;
    return pendingCount > 0 ? "pending" : "completed";
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const status = getAssignmentStatus(assignment.id);
    if (filter === "pending") return status === "pending";
    if (filter === "marked") return status === "completed";
    return true;
  });


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black text-xs uppercase tracking-widest">
            Compiling Submissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen lg:ml-64 font-sans text-gray-900">
      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        adminName={pb.authStore.model?.name}
        onLogout={handleLogout}
      />
      <main className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Page Header Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
              <FileText size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Assignment <span className="text-indigo-600">Hub</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <FileText size={14} className="text-indigo-400" />
                Grading & Submission Analytics
              </p>
            </div>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <button className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 uppercase">
                <Plus size={18} />
                CREATE ASSIGNMENT
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] p-0 border-none shadow-2xl">
              <div className="p-8 space-y-8">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                      {currentStep === 1 ? (
                        <Search size={20} />
                      ) : (
                        <Plus size={20} />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">
                        {currentStep === 1
                          ? "Step 1: Target Subject"
                          : "Step 2: Assignment Details"}
                      </h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                        {currentStep === 1
                          ? "Select which course this assignment belongs to"
                          : "Configure academic requirements and deadlines"}
                      </p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                {currentStep === 1 ? (
                  <div className="space-y-8">
                    {/* 1. Select Intake */}
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
                        1. Select Intake
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from(
                          new Set(
                            ongoingSubjects.map(
                              (s) => s.expand?.course_intake?.expand?.intake?.id
                            )
                          )
                        )
                          .map((intakeId) => {
                            const intake = ongoingSubjects.find(
                              (s) =>
                                s.expand?.course_intake?.expand?.intake?.id ===
                                intakeId
                            )?.expand?.course_intake?.expand?.intake;
                            if (!intake) return null;
                            const isSelected = selectedIntakeId === intake.id;
                            return (
                              <button
                                key={intake.id}
                                type="button"
                                onClick={() => {
                                  setSelectedIntakeId(intake.id);
                                  setSelectedCourseId("");
                                  setSelectedSubjectId("");
                                }}
                                className={cn(
                                  "p-4 rounded-[1.2rem] border-2 transition-all text-left group/intake",
                                  isSelected
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                                    : "bg-white border-gray-100 text-gray-700 hover:border-indigo-200"
                                )}
                              >
                                <span className="text-xs font-black uppercase tracking-tight block">
                                  {intake.name}
                                </span>
                                <span
                                  className={cn(
                                    "text-[9px] font-bold uppercase tracking-widest mt-1 block",
                                    isSelected ? "text-indigo-100" : "text-gray-400"
                                  )}
                                >
                                  Code: {intake.code}
                                </span>
                              </button>
                            );
                          })
                          .filter(Boolean)}
                      </div>
                    </div>

                    {/* 2. Select Course */}
                    {selectedIntakeId && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
                          2. Select Course
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Array.from(
                            new Set(
                              ongoingSubjects
                                .filter(
                                  (s) =>
                                    s.expand?.course_intake?.expand?.intake
                                      ?.id === selectedIntakeId
                                )
                                .map(
                                  (s) =>
                                    s.expand?.course_intake?.expand?.course?.id
                                )
                            )
                          ).map((courseId) => {
                            const course = ongoingSubjects.find(
                              (s) =>
                                s.expand?.course_intake?.expand?.course?.id ===
                                courseId
                            )?.expand?.course_intake?.expand?.course;
                            if (!course) return null;
                            const isSelected = selectedCourseId === course.id;
                            return (
                              <button
                                key={course.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCourseId(course.id);
                                  setSelectedSubjectId("");
                                }}
                                className={cn(
                                  "p-4 rounded-[1.2rem] border-2 transition-all text-left",
                                  isSelected
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                                    : "bg-white border-gray-100 text-gray-700 hover:border-indigo-200"
                                )}
                              >
                                <span className="text-xs font-black uppercase tracking-tight block">
                                  {course.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. Select Subject */}
                    {selectedCourseId && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
                          3. Select Subject
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {ongoingSubjects
                            .filter(
                              (s) =>
                                s.expand?.course_intake?.expand?.intake?.id ===
                                  selectedIntakeId &&
                                s.expand?.course_intake?.expand?.course?.id ===
                                  selectedCourseId
                            )
                            .map((cs) => {
                              const isSelected = selectedSubjectId === cs.id;
                              return (
                                <button
                                  key={cs.id}
                                  type="button"
                                  onClick={() => setSelectedSubjectId(cs.id)}
                                  className={cn(
                                    "p-4 rounded-[1.2rem] border-2 transition-all text-left relative",
                                    isSelected
                                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                                      : "bg-white border-gray-100 text-gray-700 hover:border-indigo-200"
                                  )}
                                >
                                  <span className="text-xs font-black uppercase tracking-tight block">
                                    {cs.expand?.subject?.name ||
                                      cs.expand?.subject?.[0]?.name}
                                  </span>
                                  {isSelected && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                      <CheckCircle
                                        size={18}
                                        className="text-white"
                                      />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                      <Button
                        disabled={!selectedSubjectId}
                        onClick={() => setCurrentStep(2)}
                        className="px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center gap-3 active:scale-95"
                      >
                        CONTINUE SETUP
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateAssignment} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Assignment Title
                          </Label>
                          <Input
                            required
                            placeholder="e.g. Final Research Project"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({ ...formData, title: e.target.value })
                            }
                            className="h-14 rounded-[1.2rem] border-gray-100 bg-gray-50/50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Total Marks
                          </Label>
                          <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                              type="number"
                              required
                              placeholder="100"
                              value={formData.total_marks}
                              onChange={(e) =>
                                setFormData({ ...formData, total_marks: e.target.value })
                              }
                              className="h-14 pl-12 rounded-[1.2rem] border-gray-100 bg-gray-50/50 font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Assign Marker
                          </Label>
                          <Select
                            required
                            value={formData.marker}
                            onValueChange={(val) =>
                              setFormData({ ...formData, marker: val })
                            }
                          >
                            <SelectTrigger className="h-14 rounded-[1.2rem] border-gray-100 bg-gray-50/50 font-bold">
                              <SelectValue placeholder="Select Lecturer" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[1.2rem] border-gray-100 shadow-2xl">
                              {markers.map((lec) => (
                                <SelectItem key={lec.id} value={lec.id} className="rounded-lg font-bold">
                                  {lec.name} (@{lec.username})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              Issued Date
                            </Label>
                            <Input
                              type="date"
                              required
                              value={formData.issued_at}
                              onChange={(e) =>
                                setFormData({ ...formData, issued_at: e.target.value })
                              }
                              className="h-14 rounded-[1.2rem] border-gray-100 bg-gray-50/50 font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              Starts At (Open Date)
                            </Label>
                            <Input
                              type="date"
                              required
                              value={formData.opens_at}
                              onChange={(e) =>
                                setFormData({ ...formData, opens_at: e.target.value })
                              }
                              className="h-14 rounded-[1.2rem] border-gray-100 bg-indigo-50/50 font-bold border-indigo-100"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Due Date
                          </Label>
                          <Input
                            type="date"
                            required
                            value={formData.due_date}
                            onChange={(e) =>
                              setFormData({ ...formData, due_date: e.target.value })
                            }
                            className="h-14 rounded-[1.2rem] border-gray-100 bg-gray-50/50 font-bold"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Upload Reference Material
                          </Label>
                          <div
                            onClick={() => document.getElementById("assignment-file")?.click()}
                            className={cn(
                              "border-2 border-dashed rounded-[1.5rem] p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group/file",
                              selectedFile
                                ? "bg-green-50/50 border-green-200"
                                : "bg-gray-50/50 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/10"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                              selectedFile ? "bg-green-500 text-white" : "bg-white text-gray-400 group-hover/file:text-indigo-500"
                            )}>
                              {selectedFile ? <CheckCircle size={24} /> : <Upload size={24} />}
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-gray-900 uppercase">
                                {selectedFile ? selectedFile.name : "Select Assignment File"}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                PDF, DOCX or ZIP up to 50MB
                              </p>
                            </div>
                            <input
                              id="assignment-file"
                              type="file"
                              className="hidden"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-[1.2rem]">
                          <input
                            type="checkbox"
                            id="open_after_due"
                            checked={formData.open_after_due}
                            onChange={(e) => setFormData({ ...formData, open_after_due: e.target.checked })}
                            className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Label htmlFor="open_after_due" className="text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer select-none">
                            Allow Late Submissions
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Detailed Description
                      </Label>
                      <Textarea
                        placeholder="Write assignment instructions, guidelines and objectives..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[120px] rounded-[1.5rem] border-gray-100 bg-gray-50/50 font-bold focus:bg-white resize-none p-6"
                      />
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep(1)}
                        className="px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900"
                      >
                        <ArrowLeft className="mr-2" size={14} />
                        BACK TO STEP 1
                      </Button>
                      <Button
                        type="submit"
                        className="px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
                      >
                        PUBLISH ASSIGNMENT
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Carousel */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <StatsCarousel
            stats={[
              {
                title: "Active Assignments",
                value: assignments.length,
                icon: FileText,
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                title: "Pending Marking",
                value: assignments.filter(a => getAssignmentStatus(a.id) === "pending").length,
                icon: Clock,
                bgColor: "bg-orange-50",
                iconColor: "text-orange-600",
              },
              {
                title: "Completed",
                value: assignments.filter(a => getAssignmentStatus(a.id) === "completed").length,
                icon: CheckCircle,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
            ]}
          />
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search assignment titles..."
            action={
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: "all", label: "ALL", color: "indigo" },
                    { id: "pending", label: "PENDING MARKING", color: "orange" },
                    { id: "marked", label: "COMPLETED", color: "green" },
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {filteredAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment.id);
            const submissionCount = submissions.filter(s => s.assignment === assignment.id).length;
            const pendingCount = submissions.filter(s => s.assignment === assignment.id && s.evaluation_status === "pending").length;

            return (
              <div key={assignment.id} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <FileText size={120} />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="bg-gray-50 text-gray-400 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {assignment.expand?.course_subject?.expand?.course_intake?.expand?.intake?.code || "GENERAL"}
                      </Badge>
                      {status === "pending" && (
                        <Badge className="bg-orange-50 text-orange-500 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} />
                          {pendingCount} Pending
                        </Badge>
                      )}
                      {status === "completed" && (
                        <Badge className="bg-green-50 text-green-500 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle size={10} />
                          All Marked
                        </Badge>
                      )}
                      {assignment.opens_at && new Date(assignment.opens_at) > new Date() && (
                        <Badge className="bg-indigo-50 text-indigo-500 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={10} />
                          Scheduled
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2 line-clamp-1">
                    {assignment.title}
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-indigo-400">
                        <BookOpen size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 line-clamp-1">
                          {assignment.expand?.course_subject?.expand?.course_intake?.expand?.course?.name}
                        </span>
                        <span className="text-indigo-600 font-black text-xs mt-0.5 line-clamp-1 uppercase tracking-tight">
                          {assignment.expand?.course_subject?.expand?.subject?.name || assignment.expand?.course_subject?.expand?.subject?.[0]?.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <FileText size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-900">Submissions: {submissionCount} Total</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-indigo-400">
                        <User size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-900 line-clamp-1 tracking-tight">Marker: {assignment.expand?.marker?.name || "Unassigned"}</span>
                        <span className="mt-0.5 font-medium text-gray-400">Deadline: {new Date(assignment.due_date).toLocaleDateString("en-GB")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between gap-3">
                    <button 
                      onClick={() => router.push(`/dashboard/admin/assignments/${assignment.id}`)}
                      className="flex-1 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                    >
                      <ChevronRight size={14} />
                      View Submissions
                    </button>
                    <button 
                      onClick={async () => {
                        if(window.confirm("Are you sure you want to delete this assignment?")) {
                          try {
                            await pb.collection("assignments").delete(assignment.id);
                            toast.success("Assignment deleted");
                            fetchData();
                          } catch (e) {
                            toast.error("Failed to delete");
                          }
                        }
                      }}
                      className="w-12 h-12 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                    >
                      <AlertCircle size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAssignments.length === 0 && (
            <div className="col-span-full text-center py-24 bg-white rounded-[2.5rem] border border-gray-100 animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">
                No assignments found
              </h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
