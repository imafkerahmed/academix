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
  const allMaterials = mockMaterialsPerSubject[subject.id] || [];
  const assignments = mockAssignmentsPerSubject[subject.id] || [];
  const [activeTab, setActiveTab] = useState("assignments");

  // Separate materials into study materials and video materials
  const studyMaterials = allMaterials.filter(
    (material) => material.type === "document",
  );
  const videoMaterials = allMaterials.filter(
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
            Materials ({allMaterials.length})
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
                        console.log("Mark submissions:", assignment.id)
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
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                            onClick={() =>
                              console.log("Edit material:", material.id)
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 border border-red-300 rounded font-semibold hover:bg-red-200 transition"
                            onClick={() =>
                              console.log("Delete material:", material.id)
                            }
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
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                            onClick={() =>
                              console.log("Edit material:", material.id)
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 border border-red-300 rounded font-semibold hover:bg-red-200 transition"
                            onClick={() =>
                              console.log("Delete material:", material.id)
                            }
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
  ) => {
    setSelectedSubject(subject);
    setSelectedCourseCode(courseCode);
    setSelectedIntakeCode(intakeCode);
  };

  const handleBackToIntake = () => {
    setSelectedSubject(null);
    setSelectedCourseCode("");
    setSelectedIntakeCode("");
  };

  // Filter to show only assigned items
  const assignedIntakes = intakes.map((intake) => ({
    ...intake,
    courses: intake.courses.map((course) => ({
      ...course,
      subjects: course.subjects.filter((subject) => subject.assigned),
    })),
  }));

  // Auto-select first intake if none selected
  React.useEffect(() => {
    if (!selectedIntake && assignedIntakes.length > 0) {
      setSelectedIntake(assignedIntakes[0].id);
    }
  }, [assignedIntakes, selectedIntake]);

  const currentIntake = assignedIntakes.find(
    (intake) => intake.id === selectedIntake,
  );

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Left Panel - Intakes List */}
      <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200">
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
                  onClick={() => setSelectedIntake(intake.id)}
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
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
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
