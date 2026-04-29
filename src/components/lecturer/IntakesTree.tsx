"use client";

import React, { useState } from "react";
import {
  FileText,
  CalendarDays,
  Book,
  BookOpen,
  ChevronRight,
  Clock,
  Timer,
  FileEdit,
  Youtube,
  Video,
  Film,
  Download,
  Ban,
  ArrowLeft,
  Layout,
} from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { ModernModal } from "@/components/ui/modern-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";

export interface Subject {
  id: string;
  name: string;
  code: string;
  assigned: boolean;
  courseSubjectId: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  subjects: Subject[];
}

export interface Intake {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  courses: Course[];
}

interface IntakesTreeProps {
  intakes: Intake[];
}

interface SubjectMaterial {
  id: string;
  title: string;
  description: string;
  type: "document" | "youtube-link" | "video-link" | "video-upload";
  filePlaceholder?: string;
  file?: string;
  fileUrl?: string | null;
  videoUrl?: string;
  canDownload: boolean;
  visible: boolean;
  createdAt: string;
}

interface SubjectAssignment {
  id: string;
  title: string;
  dueDate: string;
  pendingCount: number;
  markedCount: number;
  status: "ongoing" | "grace-period" | "closed";
  daysRemaining?: number;
  daysOverdue?: number;
}

const mockMaterialsPerSubject: Record<string, SubjectMaterial[]> = {
  "subject-1": [
    {
      id: "mat-1",
      title: "Introduction to Programming",
      description: "Basic programming concepts and syntax",
      type: "document",
      filePlaceholder: "programming-intro.pdf",
      canDownload: true,
      visible: true,
      createdAt: "2026-01-20T10:00:00Z",
    },
    {
      id: "mat-2",
      title: "Variables and Data Types Tutorial",
      description: "Video explaining variables and data types",
      type: "youtube-link",
      videoUrl: "https://youtube.com/watch?v=example1",
      canDownload: false,
      visible: true,
      createdAt: "2026-01-22T14:00:00Z",
    },
    {
      id: "mat-5",
      title: "Programming Best Practices",
      description: "Document covering coding standards and best practices",
      type: "document",
      filePlaceholder: "best-practices.pdf",
      canDownload: true,
      visible: true,
      createdAt: "2026-01-25T16:00:00Z",
    },
    {
      id: "mat-6",
      title: "Live Coding Session - Functions",
      description: "Recorded live coding session on functions",
      type: "video-upload",
      canDownload: true,
      visible: true,
      createdAt: "2026-01-28T11:00:00Z",
    },
  ],
  "subject-2": [
    {
      id: "mat-3",
      title: "Data Structures Guide",
      description: "Comprehensive guide to data structures",
      type: "document",
      filePlaceholder: "data-structures.pdf",
      canDownload: true,
      visible: true,
      createdAt: "2026-01-25T09:00:00Z",
    },
    {
      id: "mat-4",
      title: "Arrays and Lists Explained",
      description: "Video tutorial on arrays and lists",
      type: "video-upload",
      canDownload: false,
      visible: true,
      createdAt: "2026-01-27T11:00:00Z",
    },
    {
      id: "mat-7",
      title: "Binary Trees Visualization",
      description: "Interactive video showing binary tree operations",
      type: "video-link",
      videoUrl: "https://example.com/binary-trees",
      canDownload: false,
      visible: true,
      createdAt: "2026-01-30T14:00:00Z",
    },
  ],
};

const mockAssignmentsPerSubject: Record<string, SubjectAssignment[]> = {
  "subject-1": [
    {
      id: "assign-1",
      title: "Build a Calculator App",
      dueDate: "2026-02-15",
      pendingCount: 12,
      markedCount: 8,
      status: "closed",
    },
    {
      id: "assign-2",
      title: "Variables Practice Exercise",
      dueDate: "2026-02-10",
      pendingCount: 3,
      markedCount: 17,
      status: "closed",
    },
  ],
  "subject-2": [
    {
      id: "assign-3",
      title: "Implement Binary Search Tree",
      dueDate: "2026-02-20",
      pendingCount: 5,
      markedCount: 15,
      status: "closed",
    },
  ],
};

interface SubjectDetailsViewProps {
  subject: Subject;
  courseCode: string;
  intakeCode: string;
  onBack: () => void;
}

function SubjectDetailsView({
  subject,
  courseCode,
  intakeCode,
  onBack,
}: SubjectDetailsViewProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [allMaterials, setAllMaterials] = useState<SubjectMaterial[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [activeTab, setActiveTab] = useState("assignments");

  const [materials, setMaterials] = useState<SubjectMaterial[]>(allMaterials);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialDescription, setNewMaterialDescription] = useState("");
  const [newMaterialType, setNewMaterialType] =
    useState<SubjectMaterial["type"]>("document");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [newMaterialCanDownload, setNewMaterialCanDownload] = useState(true);
  const [newMaterialFileName, setNewMaterialFileName] = useState("");
  const [newMaterialFile, setNewMaterialFile] = useState<File | null>(null);
  const [openMaterialSection, setOpenMaterialSection] = useState<
    "study" | "video" | null
  >(null);

  const [previewMaterial, setPreviewMaterial] =
    useState<SubjectMaterial | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchMaterials = React.useCallback(async () => {
    if (!subject.courseSubjectId) return;

    try {
      setLoadingMaterials(true);
      const materialsData = await fetch(
        `/api/lecturer/subjects?courseSubjectId=${subject.courseSubjectId}&type=materials`,
      );
      const materialsJson = await materialsData.json();

      if (materialsData.ok && materialsJson.materials) {
        setAllMaterials(
          materialsJson.materials.map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            type: m.type,
            filePlaceholder: m.file,
            file: m.file,
            fileUrl: m.fileUrl,
            videoUrl: m.video_url,
            canDownload: m.can_download,
            visible: m.visible,
            createdAt: m.created,
          })),
        );
      }
    } catch (err) {
      console.error("Error fetching materials:", err);
    } finally {
      setLoadingMaterials(false);
    }
  }, [subject.courseSubjectId]);

  // Fetch assignments and materials from PocketBase
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assignments for this course_subject
        const assignmentsData = await fetch(
          `/api/lecturer/subjects?courseSubjectId=${subject.courseSubjectId}`,
        );
        const assignmentsJson = await assignmentsData.json();

        if (assignmentsData.ok && assignmentsJson.assignments) {
          setAssignments(
            assignmentsJson.assignments.map((a: any) => ({
              id: a.id,
              title: a.title,
              dueDate: a.due_date,
              pendingCount: a.pendingSubmissions || 0,
              markedCount: a.markedSubmissions || 0,
              status: a.status,
              daysRemaining: a.daysRemaining,
              daysOverdue: a.daysOverdue,
            })),
          );
        }
      } catch (err) {
        console.error("Error fetching assignments:", err);
      } finally {
        setLoadingAssignments(false);
      }
    };

    if (subject.courseSubjectId) {
      fetchData();
      fetchMaterials();
    }
  }, [subject.courseSubjectId, fetchMaterials]);

  React.useEffect(() => {
    setMaterials(allMaterials);
    setNewMaterialTitle("");
    setNewMaterialDescription("");
    setNewMaterialType("document");
    setNewMaterialUrl("");
    setNewMaterialCanDownload(true);
    setIsAddMaterialOpen(false);
    setNewMaterialFileName("");
    setNewMaterialFile(null);
    setPreviewMaterial(null);
    setIsPreviewOpen(false);
  }, [subject.courseSubjectId, allMaterials]);

  const handleAddMaterial = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMaterialTitle.trim() || !subject.courseSubjectId) return;

    if (
      (newMaterialType === "youtube-link" ||
        newMaterialType === "video-link") &&
      !newMaterialUrl.trim()
    ) {
      return;
    }

    if (
      (newMaterialType === "document" || newMaterialType === "video-upload") &&
      !newMaterialFile
    ) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("course_subject", subject.courseSubjectId);
      formData.append("title", newMaterialTitle.trim());
      formData.append("description", newMaterialDescription.trim());
      formData.append("type", newMaterialType);
      formData.append("can_download", String(newMaterialCanDownload));
      formData.append("visible", "true");

      if (
        newMaterialType === "youtube-link" ||
        newMaterialType === "video-link"
      ) {
        formData.append("video_url", newMaterialUrl.trim());
      }

      if (newMaterialFile) {
        formData.append("file", newMaterialFile);
      }

      const response = await fetch("/api/lecturer/subjects", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create material");
      }

      setIsAddMaterialOpen(false);
      setNewMaterialTitle("");
      setNewMaterialDescription("");
      setNewMaterialUrl("");
      setNewMaterialType("document");
      setNewMaterialCanDownload(true);
      setNewMaterialFileName("");
      setNewMaterialFile(null);
      await fetchMaterials();
    } catch (error) {
      console.error("Error creating material:", error);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const response = await fetch(
        `/api/lecturer/subjects?materialId=${materialId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete material");
      }

      setPreviewMaterial((current) =>
        current?.id === materialId ? null : current,
      );
      await fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  // Separate materials into study materials and video materials
  const studyMaterials = materials.filter(
    (material) => material.type === "document",
  );
  const videoMaterials = materials.filter(
    (material) =>
      material.type === "youtube-link" ||
      material.type === "video-link" ||
      material.type === "video-upload",
  );

  const getTypeIcon = (type: SubjectMaterial["type"]) => {
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

  const getYouTubeVideoId = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.replace(/^www\./, "");

      if (host === "youtu.be") {
        const id = parsedUrl.pathname.split("/").filter(Boolean)[0];
        return id && id.length === 11 ? id : null;
      }

      if (host === "youtube.com" || host === "m.youtube.com") {
        const v = parsedUrl.searchParams.get("v");
        if (v && v.length === 11) return v;

        const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
        const candidate =
          (pathParts[0] === "shorts" && pathParts[1]) ||
          (pathParts[0] === "embed" && pathParts[1]) ||
          (pathParts[0] === "live" && pathParts[1]) ||
          null;

        return candidate && candidate.length === 11 ? candidate : null;
      }

      return null;
    } catch {
      return null;
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = getYouTubeVideoId(url);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    return url;
  };

  const isDirectVideoUrl = (url: string) =>
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

  const isPdfFile = (material: SubjectMaterial) => {
    const fileName = (material.filePlaceholder || "").toLowerCase();
    const fileUrl = (material.fileUrl || "").toLowerCase();
    return fileName.endsWith(".pdf") || fileUrl.includes(".pdf");
  };

  const handleDownloadMaterial = async (material: SubjectMaterial) => {
    if (material.type !== "document") {
      return;
    }

    if (!material.fileUrl) return;

    try {
      const response = await fetch(material.fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = material.filePlaceholder || material.title || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(material.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const openPreview = (material: SubjectMaterial) => {
    setPreviewMaterial(material);
    setIsPreviewOpen(true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white/50 backdrop-blur-xl animate-in fade-in slide-in-from-right-8 duration-700">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-gray-100 p-8 bg-white/40 backdrop-blur-md">
        <button
          onClick={onBack}
          className="group/back flex items-center gap-2 text-gray-400 hover:text-indigo-600 mb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover/back:bg-indigo-600 group-hover/back:text-white group-hover/back:scale-110 transition-all duration-300">
            <ArrowLeft size={14} strokeWidth={3} />
          </div>
          Back to Intake
        </button>
        <div className="flex items-start gap-4 mb-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_purple] mt-4" />
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.35em]">
              {subject.code}
            </span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
              {subject.name}
            </h2>
          </div>
        </div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mt-3 flex items-center gap-2">
          <span className="text-indigo-400">{intakeCode}</span>
          <span className="text-gray-200">/</span>
          <span className="text-gray-500">{courseCode}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
              activeTab === "assignments"
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]"
                : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <FileEdit size={14} />
            Assignments
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] ${
                activeTab === "assignments"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {assignments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
              activeTab === "materials"
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]"
                : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <BookOpen size={14} />
            Materials
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] ${
                activeTab === "materials"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {materials.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {activeTab === "assignments" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingAssignments ? (
              <div className="flex items-center justify-center p-16">
                <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-200 mb-4">
                  <FileEdit size={32} />
                </div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-loose">
                  No assignments posted for this subject
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* List Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 rounded-2xl mb-2 border border-gray-100">
                  <div className="col-span-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Assignment
                  </div>
                  <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Due Date
                  </div>
                  <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">
                    Pending / Marked
                  </div>
                  <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">
                    Status
                  </div>
                  <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">
                    Action
                  </div>
                </div>

                {/* List Items */}
                <div className="space-y-2">
                  {assignments.map((assignment) => {
                    const statusColors = {
                      ongoing: {
                        bg: "bg-blue-50",
                        border: "border-blue-100",
                        badge: "bg-blue-100 text-blue-700",
                        icon: "text-blue-500",
                      },
                      "grace-period": {
                        bg: "bg-amber-50",
                        border: "border-amber-100",
                        badge: "bg-amber-100 text-amber-700",
                        icon: "text-amber-500",
                      },
                      closed: {
                        bg: "bg-gray-100",
                        border: "border-gray-200",
                        badge: "bg-gray-100 text-gray-700",
                        icon: "text-gray-400",
                      },
                    }[assignment.status];

                    const statusLabel = {
                      ongoing: "Ongoing",
                      "grace-period": "Late Submissions",
                      closed: "Closed",
                    }[assignment.status];

                    return (
                      <div
                        key={assignment.id}
                        className={`group/assign-row flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-white border rounded-2xl transition-all duration-300 hover:shadow-lg ${statusColors.border}`}
                      >
                        {/* Mobile: Title and Status */}
                        <div className="md:hidden flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-black text-base text-gray-900 group-hover/assign-row:text-indigo-600 transition-colors">
                              {assignment.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                              Due:{" "}
                              {new Date(
                                assignment.dueDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${statusColors.badge}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {/* Desktop: Assignment Title */}
                        <div className="hidden md:block col-span-4">
                          <h4 className="font-black text-base text-gray-900 group-hover/assign-row:text-indigo-600 transition-colors line-clamp-2">
                            {assignment.title}
                          </h4>
                        </div>

                        {/* Desktop: Due Date */}
                        <div className="hidden md:block col-span-2">
                          <p className="text-xs font-bold text-gray-600">
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Desktop: Pending / Marked */}
                        <div className="hidden md:block col-span-2">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                P
                              </span>
                              <span className="text-lg font-black text-red-600">
                                {assignment.pendingCount}
                              </span>
                            </div>
                            <span className="text-gray-300">/</span>
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                M
                              </span>
                              <span className="text-lg font-black text-emerald-600">
                                {assignment.markedCount}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile: Pending / Marked */}
                        <div className="md:hidden flex items-center gap-6 py-2 border-t border-gray-100 pt-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase">
                                Pending:
                              </span>
                              <span className="text-lg font-black text-red-600">
                                {assignment.pendingCount}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase">
                                Marked:
                              </span>
                              <span className="text-lg font-black text-emerald-600">
                                {assignment.markedCount}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Desktop: Status */}
                        <div className="hidden md:block col-span-2">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${statusColors.badge}`}
                            >
                              {statusLabel}
                            </span>
                            {assignment.status === "ongoing" &&
                              assignment.daysRemaining !== undefined && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                  {assignment.daysRemaining}d
                                </span>
                              )}
                            {assignment.status === "grace-period" &&
                              assignment.daysOverdue !== undefined && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                  +{assignment.daysOverdue}d
                                </span>
                              )}
                          </div>
                        </div>

                        {/* Desktop: Action Button */}
                        <div className="hidden md:block col-span-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/lecturer/assignments/${assignment.id}`,
                              )
                            }
                            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all duration-300 flex items-center justify-center gap-1"
                          >
                            View
                            <ChevronRight size={12} strokeWidth={3} />
                          </button>
                        </div>

                        {/* Mobile: Action Button */}
                        <div className="md:hidden">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/lecturer/assignments/${assignment.id}`,
                              )
                            }
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            Process Submissions
                            <ChevronRight size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingMaterials ? (
              <div className="flex items-center justify-center p-16">
                <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Materials Header Actions */}
                <div className="flex items-center justify-between p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight">
                        Resource{" "}
                        <span className="text-indigo-600">Inventory</span>
                      </h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        Manage and share subject resources
                      </p>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="bg-gray-900 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-200 transition-all duration-500 px-8"
                    onClick={() => setIsAddMaterialOpen(true)}
                  >
                    + NEW MATERIAL
                  </Button>

                  <ModernModal
                    open={isAddMaterialOpen}
                    onOpenChange={setIsAddMaterialOpen}
                    title="Publish Material"
                    subtitle="Share new resources with your students instantly."
                    avatarChar="+"
                  >
                    <form onSubmit={handleAddMaterial} className="space-y-5">
                      <div className="rounded-[2rem] border border-gray-100 bg-gray-50/60 p-6 space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="material-title"
                            className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                          >
                            Title
                          </Label>
                          <Input
                            id="material-title"
                            value={newMaterialTitle}
                            onChange={(event) =>
                              setNewMaterialTitle(event.target.value)
                            }
                            required
                            className="rounded-2xl border-gray-100 focus:ring-indigo-500 h-12"
                            placeholder="e.g. Week 1 Lecture Notes"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="material-description"
                            className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                          >
                            Context / Description
                          </Label>
                          <textarea
                            id="material-description"
                            className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-100 min-h-[100px] w-full min-w-0 rounded-2xl border bg-white px-4 py-3 text-sm shadow-xs transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            value={newMaterialDescription}
                            onChange={(event) =>
                              setNewMaterialDescription(event.target.value)
                            }
                            placeholder="Provide a short overview for students..."
                          />
                        </div>
                      </div>

                      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 space-y-4 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="material-type"
                              className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                            >
                              Media Format
                            </Label>
                            <select
                              id="material-type"
                              className="border-gray-100 h-12 w-full rounded-2xl border bg-transparent px-4 text-sm shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_1rem_center] bg-no-repeat"
                              value={newMaterialType}
                              onChange={(event) =>
                                setNewMaterialType(
                                  event.target.value as SubjectMaterial["type"],
                                )
                              }
                            >
                              <option value="document">PDF / Document</option>
                              <option value="youtube-link">
                                YouTube Stream
                              </option>
                              <option value="video-link">External Video</option>
                              <option value="video-upload">
                                Direct Video Upload
                              </option>
                            </select>
                          </div>

                          {(newMaterialType === "youtube-link" ||
                            newMaterialType === "video-link") && (
                            <div className="space-y-2 animate-in slide-in-from-right-4 duration-500">
                              <Label
                                htmlFor="material-url"
                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                              >
                                Source URL
                              </Label>
                              <Input
                                id="material-url"
                                value={newMaterialUrl}
                                onChange={(event) =>
                                  setNewMaterialUrl(event.target.value)
                                }
                                className="rounded-2xl border-gray-100 h-12"
                                placeholder="https://..."
                              />
                            </div>
                          )}

                          {(newMaterialType === "document" ||
                            newMaterialType === "video-upload") && (
                            <div className="space-y-2 animate-in slide-in-from-right-4 duration-500">
                              <Label
                                htmlFor="material-file"
                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                              >
                                Upload File
                              </Label>
                              <div className="relative">
                                <input
                                  id="material-file"
                                  type="file"
                                  accept={
                                    newMaterialType === "document"
                                      ? ".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                      : "video/*"
                                  }
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    setNewMaterialFileName(
                                      file ? file.name : "",
                                    );
                                    setNewMaterialFile(file || null);
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="h-12 border-2 border-dashed border-gray-100 rounded-2xl flex items-center px-4 bg-gray-50/50 group-hover:bg-indigo-50 transition-colors">
                                  <Download
                                    size={16}
                                    className="text-gray-400 mr-3"
                                  />
                                  <span className="text-xs text-gray-500 font-bold truncate">
                                    {newMaterialFileName ||
                                      "Select file from disk"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
                        <div className="flex items-center gap-3">
                          <div className="relative h-6 w-11 cursor-pointer">
                            <input
                              id="material-can-download"
                              type="checkbox"
                              checked={newMaterialCanDownload}
                              onChange={(event) =>
                                setNewMaterialCanDownload(event.target.checked)
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </div>
                          <Label
                            htmlFor="material-can-download"
                            className="m-0 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer"
                          >
                            Enable Student Downloads
                          </Label>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 rounded-2xl"
                            onClick={() => setIsAddMaterialOpen(false)}
                          >
                            BACK
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 h-14 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100"
                          >
                            PUBLISH ASSET
                          </Button>
                        </div>
                      </div>
                    </form>
                  </ModernModal>
                </div>

                {previewMaterial && (
                  <ModernModal
                    open={isPreviewOpen}
                    onOpenChange={(open) => {
                      setIsPreviewOpen(open);
                      if (!open) {
                        setPreviewMaterial(null);
                      }
                    }}
                    title={previewMaterial.title}
                    subtitle={previewMaterial.description || "Asset Preview"}
                    avatarChar={previewMaterial.title.charAt(0)}
                  >
                    <>
                      <div className="space-y-6 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              Media Type
                            </p>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
                              {previewMaterial.type.replace("-", " ")}
                            </p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              Created
                            </p>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
                              {new Date(
                                previewMaterial.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {previewMaterial.type === "document" && (
                          <div className="border-2 border-gray-100 rounded-[2.5rem] p-12 bg-white flex flex-col items-center text-center shadow-2xl shadow-gray-100/50 border-dashed">
                            {isPdfFile(previewMaterial) &&
                            previewMaterial.fileUrl ? (
                              <div className="w-full mb-8">
                                <iframe
                                  src={`${previewMaterial.fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                  title={previewMaterial.title}
                                  className="w-full h-[460px] rounded-[1.5rem] border border-gray-100 bg-white"
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                                <FileText size={40} />
                              </div>
                            )}
                            <h4 className="text-lg font-black text-gray-900 mb-2 max-w-full break-all">
                              {previewMaterial.filePlaceholder ||
                                "Electronic Document"}
                            </h4>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                              {isPdfFile(previewMaterial)
                                ? "Inline PDF preview"
                                : "Preview restricted to view-only mode"}
                            </p>
                            {previewMaterial.canDownload && (
                              <Button
                                type="button"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] px-8 py-6 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                                onClick={() =>
                                  handleDownloadMaterial(previewMaterial)
                                }
                              >
                                <Download size={16} className="mr-2" />
                                Download Original
                              </Button>
                            )}
                          </div>
                        )}

                        {(previewMaterial.type === "youtube-link" ||
                          previewMaterial.type === "video-link" ||
                          previewMaterial.type === "video-upload") && (
                          <div className="relative group overflow-hidden rounded-[2.5rem] bg-black shadow-2xl shadow-indigo-500/10">
                            {previewMaterial.type === "youtube-link" &&
                              previewMaterial.videoUrl && (
                                <div className="relative w-full pb-[56.25%] overflow-hidden">
                                  {getYouTubeVideoId(
                                    previewMaterial.videoUrl,
                                  ) ? (
                                    <iframe
                                      className="absolute top-0 left-0 w-full h-full"
                                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(previewMaterial.videoUrl)}`}
                                      title={previewMaterial.title}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    ></iframe>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center gap-4 h-56 text-center px-6 text-xs font-black text-white/60 uppercase tracking-widest">
                                      <span>Unsupported YouTube link</span>
                                      <Button
                                        type="button"
                                        className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl px-4 h-10 text-[10px] font-black uppercase tracking-widest"
                                        onClick={() =>
                                          window.open(
                                            previewMaterial.videoUrl,
                                            "_blank",
                                            "noopener,noreferrer",
                                          )
                                        }
                                      >
                                        Open Source Link
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}

                            {previewMaterial.type === "video-link" &&
                              previewMaterial.videoUrl && (
                                <div className="relative w-full overflow-hidden">
                                  {isDirectVideoUrl(
                                    previewMaterial.videoUrl,
                                  ) ? (
                                    <video
                                      className="w-full h-full block"
                                      controls
                                      controlsList="nodownload"
                                      src={previewMaterial.videoUrl}
                                    >
                                      Your browser does not support the video
                                      tag.
                                    </video>
                                  ) : getVideoEmbedUrl(
                                      previewMaterial.videoUrl,
                                    ) ? (
                                    <iframe
                                      className="w-full aspect-video block"
                                      src={
                                        getVideoEmbedUrl(
                                          previewMaterial.videoUrl,
                                        ) as string
                                      }
                                      title={previewMaterial.title}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    ></iframe>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center gap-4 h-56 text-center px-6 text-xs font-black text-white/60 uppercase tracking-widest">
                                      <span>Unsupported video source</span>
                                      <Button
                                        type="button"
                                        className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl px-4 h-10 text-[10px] font-black uppercase tracking-widest"
                                        onClick={() =>
                                          window.open(
                                            previewMaterial.videoUrl,
                                            "_blank",
                                            "noopener,noreferrer",
                                          )
                                        }
                                      >
                                        Open Source Link
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}

                            {previewMaterial.type === "video-upload" &&
                              previewMaterial.fileUrl && (
                                <div className="relative w-full overflow-hidden">
                                  <video
                                    className="w-full h-full block"
                                    controls
                                    controlsList="nodownload"
                                    src={previewMaterial.fileUrl}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                      <DialogFooter className="mt-8">
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-[10px] font-black uppercase tracking-widest w-full py-6 rounded-2xl"
                          onClick={() => {
                            setIsPreviewOpen(false);
                            setPreviewMaterial(null);
                          }}
                        >
                          EXIT PREVIEW
                        </Button>
                      </DialogFooter>
                    </>
                  </ModernModal>
                )}

                {/* Materials Sections */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMaterialSection((prev) =>
                          prev === "study" ? null : "study",
                        )
                      }
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_emerald]" />
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.25em]">
                          Study Materials ({studyMaterials.length})
                        </h3>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`text-gray-400 transition-transform ${
                          openMaterialSection === "study" ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {openMaterialSection === "study" && (
                      <div className="border-t border-gray-100 px-5 py-3">
                        {studyMaterials.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Empty Repository
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {studyMaterials.map((material) => (
                              <div
                                key={material.id}
                                className="group flex items-center gap-4 py-4 cursor-pointer"
                                onClick={() => openPreview(material)}
                              >
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                  {getTypeIcon(material.type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-black text-gray-900 truncate">
                                    {material.title}
                                  </p>
                                  <p className="text-[10px] font-bold text-gray-400 line-clamp-1">
                                    {material.description}
                                  </p>
                                </div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] shrink-0">
                                  {new Date(
                                    material.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                                <button
                                  type="button"
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors shrink-0"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleDeleteMaterial(material.id);
                                  }}
                                >
                                  <Ban size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMaterialSection((prev) =>
                          prev === "video" ? null : "video",
                        )
                      }
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_purple]" />
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.25em]">
                          Video Materials ({videoMaterials.length})
                        </h3>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`text-gray-400 transition-transform ${
                          openMaterialSection === "video" ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {openMaterialSection === "video" && (
                      <div className="border-t border-gray-100 px-5 py-3">
                        {videoMaterials.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              No streams recorded
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {videoMaterials.map((material) => (
                              <div
                                key={material.id}
                                className="group flex items-center gap-4 py-4 cursor-pointer"
                                onClick={() => openPreview(material)}
                              >
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                  {getTypeIcon(material.type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-black text-gray-900 truncate">
                                    {material.title}
                                  </p>
                                  <p className="text-[10px] font-bold text-gray-400 line-clamp-1">
                                    {material.description}
                                  </p>
                                </div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] shrink-0">
                                  {new Date(
                                    material.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                                <button
                                  type="button"
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors shrink-0"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleDeleteMaterial(material.id);
                                  }}
                                >
                                  <Ban size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IntakesTree({ intakes }: IntakesTreeProps) {
  const [selectedIntake, setSelectedIntake] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [selectedIntakeCode, setSelectedIntakeCode] = useState("");
  const restoredSelectionRef = React.useRef(false);
  const selectionStorageKey = "academix:lecturer:intakes-selection";

  const persistSelection = (
    intakeId: string | null,
    subjectId: string | null = null,
    courseCode = "",
    intakeCode = "",
  ) => {
    if (typeof window === "undefined") return;

    if (!intakeId) {
      window.sessionStorage.removeItem(selectionStorageKey);
      return;
    }

    window.sessionStorage.setItem(
      selectionStorageKey,
      JSON.stringify({ intakeId, subjectId, courseCode, intakeCode }),
    );
  };

  React.useEffect(() => {
    if (restoredSelectionRef.current) return;
    if (typeof window === "undefined") return;

    restoredSelectionRef.current = true;
    const rawSelection = window.sessionStorage.getItem(selectionStorageKey);
    if (!rawSelection) return;

    try {
      const parsed = JSON.parse(rawSelection) as {
        intakeId?: string;
        subjectId?: string;
        courseCode?: string;
        intakeCode?: string;
      };

      if (!parsed.intakeId) return;

      const intake = intakes.find((item) => item.id === parsed.intakeId);
      if (!intake) return;

      setSelectedIntake(parsed.intakeId);
      setSelectedCourseCode(parsed.courseCode || "");
      setSelectedIntakeCode(parsed.intakeCode || "");

      if (parsed.subjectId) {
        const subject = intake.courses
          .flatMap((course) => course.subjects)
          .find((item) => item.id === parsed.subjectId);

        if (subject) {
          setSelectedSubject(subject);
        }
      }
    } catch {
      window.sessionStorage.removeItem(selectionStorageKey);
    }
  }, [intakes]);

  const toggleCourse = (courseId: string) => {
    setExpandedCourse((prev) => (prev === courseId ? null : courseId));
  };

  const handleSubjectClick = (
    subject: Subject,
    courseCode: string,
    intakeCode: string,
    intakeId: string,
  ) => {
    setSelectedIntake(intakeId);
    setSelectedSubject(subject);
    setSelectedCourseCode(courseCode);
    setSelectedIntakeCode(intakeCode);
    persistSelection(intakeId, subject.id, courseCode, intakeCode);
  };

  const handleBackToIntake = () => {
    setSelectedSubject(null);
    setSelectedCourseCode("");
    setSelectedIntakeCode("");
    if (selectedIntake) {
      persistSelection(selectedIntake, null);
    }
  };

  // Filter to show only assigned items
  const assignedIntakes = intakes.map((intake) => ({
    ...intake,
    courses: intake.courses.map((course) => ({
      ...course,
      subjects: course.subjects.filter((subject) => subject.assigned),
    })),
  }));

  const currentIntake = assignedIntakes.find(
    (intake) => intake.id === selectedIntake,
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:h-[750px] animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Left Panel - Intakes List */}
      <div
        className={`bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-white/20 w-full lg:w-96 flex flex-col overflow-hidden transition-all duration-500 ${
          selectedSubject ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_indigo]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Academic Terms
            </p>
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            Your <span className="text-indigo-600">Intakes</span>
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-3">
            {assignedIntakes.length} ACTIVE ENROLLMENTS
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {assignedIntakes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
              <CalendarDays size={32} className="text-gray-300 mb-4" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                No assigned intakes found
              </p>
            </div>
          ) : (
            assignedIntakes.map((intake) => (
              <button
                key={intake.id}
                onClick={() => {
                  setSelectedIntake(intake.id);
                  setSelectedSubject(null);
                  setSelectedCourseCode("");
                  setSelectedIntakeCode("");
                  persistSelection(intake.id, null);
                }}
                className={`group relative w-full text-left p-5 rounded-[1.8rem] transition-all duration-500 border ${
                  selectedIntake === intake.id
                    ? "bg-indigo-600 border-indigo-600 shadow-2xl shadow-indigo-200 text-white translate-x-1"
                    : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 text-gray-900"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      selectedIntake === intake.id
                        ? "bg-white/20 text-white rotate-6"
                        : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                    }`}
                  >
                    <CalendarDays size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-black text-[10px] uppercase tracking-[0.2em] mb-1 ${
                        selectedIntake === intake.id
                          ? "text-indigo-100"
                          : "text-indigo-600"
                      }`}
                    >
                      {intake.code}
                    </p>
                    <p className="font-bold text-sm truncate leading-tight">
                      {intake.name}
                    </p>
                    <div
                      className={`flex items-center gap-2 mt-3 p-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit ${
                        selectedIntake === intake.id
                          ? "bg-white/10 text-white"
                          : "bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      }`}
                    >
                      <Book size={12} />
                      {intake.courses.length} course
                      {intake.courses.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                {selectedIntake === intake.id && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-full animate-pulse" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Intake Details or Subject Details */}
      <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-white/20 flex flex-col overflow-hidden min-h-[500px]">
        {currentIntake && !selectedSubject ? (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <h2 className="font-black text-xs text-gray-400 uppercase tracking-widest leading-none">
                  Intake Details
                </h2>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                {currentIntake.code}{" "}
                <span className="text-indigo-600">Term</span>
              </h3>
              <div className="flex flex-wrap items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Clock size={14} />
                  </div>
                  {new Date(currentIntake.startDate).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                    },
                  )}
                  <span className="mx-1 text-gray-300">→</span>
                  {new Date(currentIntake.endDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen size={14} />
                  </div>
                  {currentIntake.courses.length} Assigned Courses
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {currentIntake.courses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-300 mb-4">
                    <BookOpen size={32} />
                  </div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest leading-loose">
                    No assigned courses in this intake
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {currentIntake.courses.map((course) => (
                    <div
                      key={course.id}
                      className="group/course overflow-hidden rounded-[2rem] border border-gray-100 bg-white transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                    >
                      <button
                        onClick={() => toggleCourse(course.id)}
                        className={`w-full p-6 flex items-center justify-between transition-all duration-500 rounded-[2rem] ${
                          expandedCourse === course.id
                            ? "bg-indigo-50/80 shadow-inner"
                            : "hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                              expandedCourse === course.id
                                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110"
                                : "bg-indigo-50 text-indigo-600 group-hover/course:bg-indigo-100"
                            }`}
                          >
                            {course.subjects.length > 0 ? (
                              <BookOpen size={24} />
                            ) : (
                              <Book size={24} />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-black text-[10px] text-indigo-600 uppercase tracking-[0.2em] mb-1">
                              {course.code}
                            </p>
                            <p className="font-black text-lg text-gray-900 tracking-tight leading-none group-hover/course:text-indigo-600 transition-colors">
                              {course.name}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="px-2.5 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest shadow-sm">
                                {course.subjects.length} Assigned Subject
                                {course.subjects.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center transition-all duration-500 ${
                            expandedCourse === course.id
                              ? "rotate-180 bg-indigo-600 border-indigo-600 text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {expandedCourse === course.id ? (
                            <ChevronRight size={18} className="rotate-90" />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </div>
                      </button>

                      {/* Subjects under Course */}
                      {expandedCourse === course.id && (
                        <div className="p-6 pt-2 bg-gradient-to-b from-indigo-50/30 to-white animate-in slide-in-from-top-4 duration-500 rounded-b-[2rem]">
                          {course.subjects.length === 0 ? (
                            <div className="p-8 text-center bg-white/50 rounded-[1.5rem] border border-dashed border-gray-200">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">
                                No assigned subjects in this course
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {course.subjects.map((subject) => (
                                <button
                                  key={subject.id}
                                  onClick={() =>
                                    handleSubjectClick(
                                      subject,
                                      course.code,
                                      currentIntake.code,
                                      currentIntake.id,
                                    )
                                  }
                                  className="group/subject flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-500 text-left active:scale-[0.98]"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover/subject:bg-purple-600 group-hover/subject:text-white transition-all duration-500 shadow-sm">
                                    <FileText size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-black text-[9px] text-purple-600 uppercase tracking-widest mb-0.5">
                                      {subject.code}
                                    </p>
                                    <p className="font-bold text-xs text-gray-900 truncate leading-tight group-hover/subject:text-purple-600 transition-colors">
                                      {subject.name}
                                    </p>
                                  </div>
                                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 group-hover/subject:bg-purple-50 group-hover/subject:text-purple-600 transition-all duration-500">
                                    <ChevronRight size={14} />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : selectedSubject ? (
          <SubjectDetailsView
            subject={selectedSubject}
            courseCode={selectedCourseCode}
            intakeCode={selectedIntakeCode}
            onBack={handleBackToIntake}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center opacity-60">
            <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-200 mb-8 animate-bounce duration-[3000ms]">
              <Layout size={48} />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2 uppercase">
              Select an <span className="text-indigo-600">Intake</span>
            </h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] max-w-[200px] leading-loose">
              Choose an enrollment from the left panel to manage subjects and
              materials.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
