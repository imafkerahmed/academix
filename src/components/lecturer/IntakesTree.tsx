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
import {
  DialogFooter,
} from "@/components/ui/dialog";
import { ModernModal } from "@/components/ui/modern-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export interface Subject {
  id: string;
  name: string;
  code: string;
  assigned: boolean;
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
    },
    {
      id: "assign-2",
      title: "Variables Practice Exercise",
      dueDate: "2026-02-10",
      pendingCount: 3,
      markedCount: 17,
    },
  ],
  "subject-2": [
    {
      id: "assign-3",
      title: "Implement Binary Search Tree",
      dueDate: "2026-02-20",
      pendingCount: 5,
      markedCount: 15,
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
  const allMaterials = React.useMemo(() => mockMaterialsPerSubject[subject.id] || [], [subject.id]);
  const assignments = React.useMemo(() => mockAssignmentsPerSubject[subject.id] || [], [subject.id]);
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

  const [previewMaterial, setPreviewMaterial] =
    useState<SubjectMaterial | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  React.useEffect(() => {
    setMaterials(allMaterials);
    setNewMaterialTitle("");
    setNewMaterialDescription("");
    setNewMaterialType("document");
    setNewMaterialUrl("");
    setNewMaterialCanDownload(true);
    setIsAddMaterialOpen(false);
    setNewMaterialFileName("");
    setPreviewMaterial(null);
    setIsPreviewOpen(false);
  }, [subject.id, allMaterials]);

  const handleAddMaterial = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMaterialTitle.trim()) return;

    const now = new Date().toISOString();

    const isDocument = newMaterialType === "document";
    const isVideoUpload = newMaterialType === "video-upload";
    const isVideoLinkType =
      newMaterialType === "youtube-link" || newMaterialType === "video-link";

    const newMaterial: SubjectMaterial = {
      id: `new-${Date.now()}`,
      title: newMaterialTitle.trim(),
      description: newMaterialDescription.trim(),
      type: newMaterialType,
      canDownload: newMaterialCanDownload,
      visible: true,
      createdAt: now,
      ...(isDocument || isVideoUpload
        ? {
            filePlaceholder:
              newMaterialFileName ||
              (isDocument ? "document.pdf" : "video-file.mp4"),
          }
        : {}),
      ...(isVideoLinkType && newMaterialUrl.trim()
        ? { videoUrl: newMaterialUrl.trim() }
        : {}),
    };

    setMaterials((prev) => [newMaterial, ...prev]);
    setIsAddMaterialOpen(false);
    setNewMaterialTitle("");
    setNewMaterialDescription("");
    setNewMaterialUrl("");
    setNewMaterialType("document");
    setNewMaterialCanDownload(true);
    setNewMaterialFileName("");
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
    const regExp =
      /^.*(youtu.be\/.+|v\/.+|u\/\w\/.+|embed\/.+|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
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
        <div className="flex items-center gap-4 mb-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_purple]" />
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
            {subject.code}{" "}
            <span className="text-indigo-600">{subject.name}</span>
          </h2>
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
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-200 mb-4">
                  <FileEdit size={32} />
                </div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-loose">
                  No assignments posted for this subject
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="group/assign relative overflow-hidden bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 active:scale-[0.98] border-b-4 border-b-indigo-500/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover/assign:bg-indigo-600 group-hover/assign:text-white transition-all duration-500 shadow-sm">
                        <FileEdit size={24} />
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
                          Active
                        </span>
                      </div>
                    </div>

                    <h4 className="font-black text-lg text-gray-900 tracking-tight mb-2 group-hover/assign:text-indigo-600 transition-colors leading-tight">
                      {assignment.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <Timer size={12} className="text-indigo-400" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100/50">
                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">
                          Pending
                        </p>
                        <p className="text-xl font-black text-red-600 leading-none">
                          {assignment.pendingCount}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                          Marked
                        </p>
                        <p className="text-xl font-black text-emerald-600 leading-none">
                          {assignment.markedCount}
                        </p>
                      </div>
                    </div>

                    <button
                      className="w-full py-4 bg-gray-900 group-hover/assign:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-xl shadow-gray-200 group-hover/assign:shadow-indigo-200 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-[1px]"
                      onClick={() =>
                        router.push(
                          `/dashboard/lecturer/assignments/${assignment.id}`,
                        )
                      }
                    >
                      Process Submissions
                      <ChevronRight size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Materials Header Actions */}
            <div className="flex items-center justify-between p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight">
                    Resource <span className="text-indigo-600">Inventory</span>
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
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Material Identification
                      </p>
                    </div>
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
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Content Asset
                      </p>
                    </div>
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
                          <option value="youtube-link">YouTube Stream</option>
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
                                setNewMaterialFileName(file ? file.name : "");
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="h-12 border-2 border-dashed border-gray-100 rounded-2xl flex items-center px-4 bg-gray-50/50 group-hover:bg-indigo-50 transition-colors">
                              <Download
                                size={16}
                                className="text-gray-400 mr-3"
                              />
                              <span className="text-xs text-gray-500 font-bold truncate">
                                {newMaterialFileName || "Select file from disk"}
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
                        <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                          <FileText size={40} />
                        </div>
                        <h4 className="text-lg font-black text-gray-900 mb-2">
                          {previewMaterial.filePlaceholder ||
                            "Electronic Document"}
                        </h4>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                          Preview restricted to view-only mode
                        </p>
                        {previewMaterial.canDownload && (
                          <Button
                            type="button"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] px-8 py-6 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20"
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
                              {getYouTubeVideoId(previewMaterial.videoUrl) ? (
                                <iframe
                                  className="absolute top-0 left-0 w-full h-full"
                                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(previewMaterial.videoUrl)}`}
                                  title={previewMaterial.title}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              ) : (
                                <div className="flex items-center justify-center h-48 text-xs font-black text-white/50 uppercase tracking-widest">
                                  Invalid Stream Source
                                </div>
                              )}
                            </div>
                          )}

                        {(previewMaterial.type === "video-link" ||
                          previewMaterial.type === "video-upload") && (
                          <div className="relative w-full overflow-hidden">
                            {previewMaterial.videoUrl ? (
                              <video
                                className="w-full h-full block"
                                controls
                                controlsList="nodownload"
                                src={previewMaterial.videoUrl}
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <div className="flex items-center justify-center h-48 text-xs font-black text-white/50 uppercase tracking-widest">
                                Source Media Unavailable
                              </div>
                            )}
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
            <div className="grid grid-cols-1 gap-12">
              {/* Study Materials Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_emerald]" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.25em]">
                    Study Materials ({studyMaterials.length})
                  </h3>
                </div>
                {studyMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Empty Repository
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {studyMaterials.map((material) => (
                      <div
                        key={material.id}
                        className="group/material relative overflow-hidden bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 cursor-pointer active:scale-[0.98]"
                        onClick={() => openPreview(material)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 group-hover/material:bg-emerald-600 group-hover/material:text-white transition-all duration-500 shadow-sm flex items-center justify-center">
                            {getTypeIcon(material.type)}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover/material:opacity-100 transition-all duration-500 translate-y-[-10px] group-hover/material:translate-y-0">
                            <button
                              className="p-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-500 hover:text-white transition-all shadow-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                // edit logic here
                              }}
                            >
                              <FileEdit size={14} />
                            </button>
                            <button
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                // delete logic here
                              }}
                            >
                              <Ban size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-black text-sm text-gray-900 truncate tracking-tight mb-2 group-hover/material:text-emerald-600 transition-colors">
                          {material.title}
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 line-clamp-2 leading-relaxed mb-6">
                          {material.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border transition-all duration-500 ${
                                material.visible
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-gray-50 text-gray-400 border-gray-100"
                              }`}
                            ></span>
                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">
                              {new Date(
                                material.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {material.canDownload && (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <Download size={12} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Materials Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_purple]" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.25em]">
                    Video Materials ({videoMaterials.length})
                  </h3>
                </div>
                {videoMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      No streams recorded
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {videoMaterials.map((material) => (
                      <div
                        key={material.id}
                        className="group/video relative overflow-hidden bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 cursor-pointer active:scale-[0.98]"
                        onClick={() => openPreview(material)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 group-hover/video:bg-purple-600 group-hover/video:text-white transition-all duration-500 shadow-sm flex items-center justify-center">
                            {getTypeIcon(material.type)}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover/video:opacity-100 transition-all duration-500 translate-y-[-10px] group-hover/video:translate-y-0">
                            <button
                              className="p-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-500 hover:text-white transition-all shadow-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                // edit logic here
                              }}
                            >
                              <FileEdit size={14} />
                            </button>
                            <button
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                // delete logic here
                              }}
                            >
                              <Ban size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-black text-sm text-gray-900 truncate tracking-tight mb-2 group-hover/video:text-purple-600 transition-colors">
                          {material.title}
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 line-clamp-2 leading-relaxed mb-6">
                          {material.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border transition-all duration-500 ${
                                material.visible
                                  ? "bg-purple-50 text-purple-600 border-purple-100"
                                  : "bg-gray-50 text-gray-400 border-gray-100"
                              }`}
                            ></span>
                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">
                              {new Date(
                                material.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {material.canDownload && (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <Download size={12} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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


  const persistSelection = (
    _intakeId: string | null, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    // Persistence disabled as per user request

  };

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
    persistSelection(intakeId);
  };

  const handleBackToIntake = () => {
    setSelectedSubject(null);
    setSelectedCourseCode("");
    setSelectedIntakeCode("");
    if (selectedIntake) {
      persistSelection(selectedIntake);
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

  // Persistence disabled as per user request

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:h-[750px] animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Left Panel - Intakes List */}
      <div
        className={`bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-white/20 w-full lg:w-96 flex flex-col overflow-hidden transition-all duration-500 ${
          selectedSubject ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <h2 className="font-black text-xs text-gray-400 uppercase tracking-widest">
              Academic Terms
            </h2>
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
                  persistSelection(intake.id);
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
