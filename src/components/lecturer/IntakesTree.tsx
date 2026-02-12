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
  CheckCircle2,
  Youtube,
  Video,
  Film,
  Download,
  Ban,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  const allMaterials = mockMaterialsPerSubject[subject.id] || [];
  const assignments = mockAssignmentsPerSubject[subject.id] || [];
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
  }, [subject.id]);

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
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3 text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          Back to Intake
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {subject.code} - {subject.name}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {intakeCode} → {courseCode}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "assignments"
                ? "border-blue-500 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "materials"
                ? "border-blue-500 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Materials ({materials.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "assignments" && (
          <div>
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
                <p>No assignments for this subject</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">
                      {assignment.title}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Timer size={12} />
                        Due: {assignment.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs mb-3">
                      <span className="text-orange-600 font-semibold flex items-center gap-1">
                        <Clock size={12} />
                        Pending: {assignment.pendingCount}
                      </span>
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Marked: {assignment.markedCount}
                      </span>
                    </div>
                    <button
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                      onClick={() =>
                        router.push(
                          `/dashboard/lecturer/assignments/${assignment.id}`,
                        )
                      }
                    >
                      Mark Submissions
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-800">
                Materials overview
              </h3>
              <Button
                size="sm"
                className="shadow-sm"
                onClick={() => setIsAddMaterialOpen(true)}
              >
                + Add material
              </Button>
              <ModernModal
                open={isAddMaterialOpen}
                onOpenChange={setIsAddMaterialOpen}
                title="Add material"
                subtitle="Create a new study or video material for this subject."
                avatarChar="+"
              >
                <form onSubmit={handleAddMaterial} className="space-y-5">
                  <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Basic details
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="material-title">Title</Label>
                      <Input
                        id="material-title"
                        value={newMaterialTitle}
                        onChange={(event) =>
                          setNewMaterialTitle(event.target.value)
                        }
                        required
                        placeholder="e.g. Week 1 Lecture Notes"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-description">Description</Label>
                      <textarea
                        id="material-description"
                        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-[80px] w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        value={newMaterialDescription}
                        onChange={(event) =>
                          setNewMaterialDescription(event.target.value)
                        }
                        placeholder="Optional short summary for students"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white p-4 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Type & attachment
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="material-type">Type</Label>
                        <select
                          id="material-type"
                          className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                          value={newMaterialType}
                          onChange={(event) =>
                            setNewMaterialType(
                              event.target.value as SubjectMaterial["type"],
                            )
                          }
                        >
                          <option value="document">Document</option>
                          <option value="youtube-link">YouTube link</option>
                          <option value="video-link">Video link</option>
                          <option value="video-upload">Video upload</option>
                        </select>
                        <p className="text-[11px] text-gray-500">
                          Choose how students will access this material.
                        </p>
                      </div>

                      {(newMaterialType === "youtube-link" ||
                        newMaterialType === "video-link") && (
                        <div className="space-y-2">
                          <Label htmlFor="material-url">Video URL</Label>
                          <Input
                            id="material-url"
                            value={newMaterialUrl}
                            onChange={(event) =>
                              setNewMaterialUrl(event.target.value)
                            }
                            placeholder="https://youtu.be/..."
                          />
                          <p className="text-[11px] text-gray-500">
                            Paste a public YouTube or video link.
                          </p>
                        </div>
                      )}

                      {(newMaterialType === "document" ||
                        newMaterialType === "video-upload") && (
                        <div className="space-y-2 sm:col-span-1">
                          <Label htmlFor="material-file">Attach file</Label>
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
                            className="block w-full text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                          />
                          {newMaterialFileName && (
                            <p className="text-[11px] text-gray-500">
                              Selected: {newMaterialFileName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="material-can-download"
                        type="checkbox"
                        checked={newMaterialCanDownload}
                        onChange={(event) =>
                          setNewMaterialCanDownload(event.target.checked)
                        }
                        className="h-4 w-4 rounded border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      />
                      <Label
                        htmlFor="material-can-download"
                        className="m-0 text-sm"
                      >
                        Allow download
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddMaterialOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save material</Button>
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
                subtitle={
                  previewMaterial.description ||
                  "Preview of the selected material."
                }
                avatarChar={previewMaterial.title.charAt(0)}
              >
                <>
                  <div className="space-y-4 mt-2">
                    <div className="text-xs text-gray-500">
                      <p>
                        Type:{" "}
                        <span className="font-semibold">
                          {previewMaterial.type}
                        </span>
                      </p>
                      <p>
                        Created on:{" "}
                        {new Date(
                          previewMaterial.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    {previewMaterial.type === "document" && (
                      <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                        <p className="text-gray-800 font-semibold mb-2">
                          {previewMaterial.filePlaceholder ||
                            "Attached document"}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          Document preview is not available in this view.
                        </p>
                        {previewMaterial.canDownload && (
                          <Button type="button" size="sm">
                            Download (placeholder)
                          </Button>
                        )}
                      </div>
                    )}

                    {(previewMaterial.type === "youtube-link" ||
                      previewMaterial.type === "video-link" ||
                      previewMaterial.type === "video-upload") && (
                      <div className="space-y-3">
                        {previewMaterial.type === "youtube-link" &&
                          previewMaterial.videoUrl && (
                            <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden">
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
                                <div className="flex items-center justify-center h-40 text-sm text-gray-200">
                                  Invalid YouTube URL
                                </div>
                              )}
                            </div>
                          )}

                        {(previewMaterial.type === "video-link" ||
                          previewMaterial.type === "video-upload") && (
                          <div className="relative w-full bg-black rounded-lg overflow-hidden">
                            {previewMaterial.videoUrl ? (
                              <video
                                className="w-full"
                                controls
                                controlsList="nodownload"
                                src={previewMaterial.videoUrl}
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <div className="flex items-center justify-center h-40 text-sm text-gray-200">
                                No video URL available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsPreviewOpen(false);
                        setPreviewMaterial(null);
                      }}
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </>
              </ModernModal>
            )}
            {/* Study Materials Section */}
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Study Materials ({studyMaterials.length})
              </h3>
              {studyMaterials.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
                  <p>No study materials for this subject</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studyMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openPreview(material)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {getTypeIcon(material.type)}
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-800">
                            {material.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {material.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(material.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded border font-semibold ${
                              material.visible
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-gray-100 text-gray-700 border-gray-300"
                            }`}
                          >
                            {material.visible ? "Visible" : "Hidden"}
                          </span>
                          <button
                            className={`px-2 py-1 text-xs rounded font-semibold transition flex items-center gap-1 ${
                              material.canDownload
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                            }`}
                          >
                            {material.canDownload ? (
                              <>
                                <Download size={12} />
                                Download
                              </>
                            ) : (
                              <>
                                <Ban size={12} />
                                No Download
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 rounded font-semibold hover:bg-yellow-200 transition"
                            onClick={(event) => {
                              event.stopPropagation();
                              console.log("Edit material:", material.id);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 border border-red-300 rounded font-semibold hover:bg-red-200 transition"
                            onClick={(event) => {
                              event.stopPropagation();
                              console.log("Delete material:", material.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Materials Section */}
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Video Materials ({videoMaterials.length})
              </h3>
              {videoMaterials.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
                  <p>No video materials for this subject</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {videoMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openPreview(material)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {getTypeIcon(material.type)}
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-800">
                            {material.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {material.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(material.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded border font-semibold ${
                              material.visible
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-gray-100 text-gray-700 border-gray-300"
                            }`}
                          >
                            {material.visible ? "Visible" : "Hidden"}
                          </span>
                          <button
                            className={`px-2 py-1 text-xs rounded font-semibold transition flex items-center gap-1 ${
                              material.canDownload
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                            }`}
                          >
                            {material.canDownload ? (
                              <>
                                <Download size={12} />
                                Download
                              </>
                            ) : (
                              <>
                                <Ban size={12} />
                                No Download
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 rounded font-semibold hover:bg-yellow-200 transition"
                            onClick={(event) => {
                              event.stopPropagation();
                              console.log("Edit material:", material.id);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 border border-red-300 rounded font-semibold hover:bg-red-200 transition"
                            onClick={(event) => {
                              event.stopPropagation();
                              console.log("Delete material:", material.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IntakesTree({ intakes }: IntakesTreeProps) {
  const [selectedIntake, setSelectedIntake] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [selectedIntakeCode, setSelectedIntakeCode] = useState("");

  const selectionRestoredRef = React.useRef(false);

  const persistSelection = (
    intakeId: string | null,
    subjectId: string | null = null,
  ) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "lecturerIntakesSelection",
        JSON.stringify({ intakeId, subjectId }),
      );
    } catch {
      // ignore storage errors
    }
  };

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
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
    persistSelection(intakeId, subject.id);
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

  // Restore last selected intake/subject when the component mounts
  React.useEffect(() => {
    if (selectionRestoredRef.current) return;
    if (typeof window === "undefined") return;

    selectionRestoredRef.current = true;

    try {
      const raw = window.localStorage.getItem("lecturerIntakesSelection");
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        intakeId?: string | null;
        subjectId?: string | null;
      };

      if (!parsed.intakeId) return;

      const intake = assignedIntakes.find((i) => i.id === parsed.intakeId);
      if (!intake) return;

      setSelectedIntake(intake.id);

      if (parsed.subjectId) {
        const courseWithSubject = intake.courses.find((course) =>
          course.subjects.some((subject) => subject.id === parsed.subjectId),
        );

        if (courseWithSubject) {
          const subject = courseWithSubject.subjects.find(
            (s) => s.id === parsed.subjectId,
          );

          if (subject) {
            setSelectedSubject(subject);
            setSelectedCourseCode(courseWithSubject.code);
            setSelectedIntakeCode(intake.code);
            setExpandedCourses(new Set([courseWithSubject.id]));
          }
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [assignedIntakes]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[600px]">
      {/* Left Panel - Intakes List */}
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 w-full lg:w-80 ${
          selectedSubject ? "hidden lg:block" : ""
        }`}
      >
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h2 className="font-semibold text-gray-800">Your Intakes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {assignedIntakes.length} active intakes
          </p>
        </div>

        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {assignedIntakes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No assigned intakes found
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {assignedIntakes.map((intake) => (
                <button
                  key={intake.id}
                  onClick={() => {
                    setSelectedIntake(intake.id);
                    setSelectedSubject(null);
                    setSelectedCourseCode("");
                    setSelectedIntakeCode("");
                    persistSelection(intake.id, null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedIntake === intake.id
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays
                      size={18}
                      className={
                        selectedIntake === intake.id
                          ? "text-blue-600"
                          : "text-gray-500"
                      }
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800">
                        {intake.code}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {intake.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {intake.courses.length} course
                        {intake.courses.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Intake Details or Subject Details */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 mt-4 lg:mt-0">
        {currentIntake && !selectedSubject ? (
          <div className="h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h2 className="font-semibold text-gray-800">
                {currentIntake.code} - Course Details
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentIntake.name} • {currentIntake.startDate} to{" "}
                {currentIntake.endDate}
              </p>
            </div>

            <div className="p-4">
              {currentIntake.courses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No assigned courses in this intake</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentIntake.courses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-gray-200 rounded-lg bg-white"
                    >
                      <button
                        onClick={() => toggleCourse(course.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {course.subjects.length > 0 ? (
                            <BookOpen size={18} className="text-green-600" />
                          ) : (
                            <Book size={18} className="text-gray-400" />
                          )}
                          <div className="text-left">
                            <p className="font-medium text-sm text-gray-800">
                              {course.code} - {course.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {course.subjects.length} subject
                              {course.subjects.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-500">
                          {expandedCourses.has(course.id) ? "▼" : "▶"}
                        </span>
                      </button>

                      {/* Subjects under Course */}
                      {expandedCourses.has(course.id) && (
                        <div className="bg-gray-50">
                          {course.subjects.length === 0 ? (
                            <div className="p-4 text-gray-500 text-sm text-center">
                              No assigned subjects in this course
                            </div>
                          ) : (
                            <div className="space-y-2 p-3">
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
                                  className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition cursor-pointer"
                                >
                                  <FileText
                                    size={16}
                                    className="text-purple-600"
                                  />
                                  <div className="flex-1 text-left">
                                    <p className="font-medium text-sm text-gray-800">
                                      {subject.code} - {subject.name}
                                    </p>
                                  </div>
                                  <ChevronRight
                                    size={14}
                                    className="text-gray-400"
                                  />
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
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select an intake to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
