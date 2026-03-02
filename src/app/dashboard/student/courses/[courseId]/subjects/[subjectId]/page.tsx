"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RouteLink } from "@/components/ui/route-link";
import StudentBreadcrumbs from "@/components/student/StudentBreadcrumbs";
import { ArrowLeft, Loader2 } from "lucide-react";
import pb from "@/lib/pocketbase";

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params?.subjectId as string;
  const courseId = params?.courseId as string;
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Assignments, 1: Materials, 2: Videos
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [disabledAssignments, setDisabledAssignments] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation durations (ms)
  const OPEN_DURATION = 900;
  const CLOSE_DURATION = 1500;

  // Check authentication and initialize subject
  useEffect(() => {
    const currentUser = pb.authStore.model;
    if (!currentUser || currentUser.role !== "student") {
      router.push("/login");
      return;
    }

    fetchSubjectData();
  }, [subjectId, courseId, router]);

  const fetchSubjectData = async () => {
    try {
      setLoading(true);

      // Fetch enrollment (courseId is actually the enrollment ID)
      const enrollment = await pb.collection("enrollments").getOne(courseId, {
        expand: "course_intake.course,course_intake.intake",
      });

      const courseIntake = enrollment.expand?.course_intake;
      const course = courseIntake?.expand?.course;
      const intake = courseIntake?.expand?.intake;

      // Fetch the subject directly
      const subjectRecord = await pb.collection("subjects").getOne(subjectId);

      // Find the course_subject record to get lecturer info
      let lecturer: any = null;
      let semester = "";
      let credits = 0;
      let courseSubjectIds: string[] = [];

      try {
        const courseSubjects = await pb
          .collection("course_subjects")
          .getFullList({
            filter: `course_intake="${courseIntake?.id}" && subject ~ "${subjectId}"`,
            expand: "lecturer",
          });

        if (courseSubjects.length > 0) {
          const cs = courseSubjects[0];
          courseSubjectIds = courseSubjects.map((cs) => cs.id);
          lecturer = cs.expand?.lecturer;
          semester = cs.semester || "";
          credits = cs.credits || 0;
        }
      } catch (e) {
        console.log("Could not fetch course_subjects details");
      }

      // Fetch all study materials for this course_subject
      let materials: any[] = [];
      if (courseSubjectIds.length > 0) {
        try {
          // Build filter to match any of the course_subject IDs
          const filterParts = courseSubjectIds.map(
            (id) => `course_subject ~ "${id}"`,
          );
          const filter = filterParts.join(" || ");

          materials = await pb.collection("study_materials").getFullList({
            filter,
            sort: "-created",
          });
        } catch (e) {
          console.log("Could not fetch materials:", e);
        }
      }

      // Separate materials by type
      // Types used: "document", "video-upload", "youtube-link", "video-link"
      const studyMaterials = materials.filter(
        (m) => m.type === "document" || !m.type,
      );
      const videoMaterials = materials.filter(
        (m) =>
          m.type === "video-upload" ||
          m.type === "youtube-link" ||
          m.type === "video-link" ||
          m.type === "video" ||
          m.type === "youtube",
      );

      setSubject({
        id: subjectRecord.id,
        name: subjectRecord.name,
        code: subjectRecord.code,
        instructor: lecturer?.name || lecturer?.full_name || "TBA",
        instructorEmail: lecturer?.email || "",
        semester: semester || "N/A",
        courseId: courseId,
        courseName: course?.name || "Course",
        progress: 0,
        grade: "-",
        credits: credits,
        schedule: "",
        room: "",
        description: subjectRecord.description || "",
        attendance: { present: 0, total: 0, percentage: 0 },
        assignments: [],
        materials: studyMaterials.map((m) => ({
          id: m.id,
          title: m.title,
          type: m.type || "document",
          url: m.file ? pb.files.getUrl(m, m.file) : m.video_url || "",
          uploadedAt: m.created,
          description: m.description || "",
        })),
        videos: videoMaterials.map((m) => ({
          id: m.id,
          title: m.title,
          type: m.type,
          url: m.video_url || (m.file ? pb.files.getUrl(m, m.file) : ""),
          duration: m.duration || "",
          thumbnail: "",
          description: m.description || "",
          uploadedAt: m.created,
        })),
      });
    } catch (error) {
      console.error("Error fetching subject:", error);
      setSubject(null);
    } finally {
      setLoading(false);
    }
  };

  // Load disabled assignments from localStorage
  React.useEffect(() => {
    const savedAssignments = localStorage.getItem(
      `disabled_assignments_${courseId}`,
    );
    if (savedAssignments) {
      setDisabledAssignments(JSON.parse(savedAssignments));
    }
  }, [courseId]);

  // Auto-close success modal after 3 seconds
  React.useEffect(() => {
    if (!showSuccessModal) return;
    const t = setTimeout(() => setShowSuccessModal(false), 3000);
    return () => clearTimeout(t);
  }, [showSuccessModal]);

  // Prevent background scrolling when modals are open
  React.useEffect(() => {
    if (
      showAssignmentModal ||
      showSuccessModal ||
      showMaterialModal ||
      showVideoModal
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    showAssignmentModal,
    showSuccessModal,
    showMaterialModal,
    showVideoModal,
  ]);

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Helper function to check if URL is a Google Drive link
  const isGoogleDriveUrl = (url: string) => {
    return url.includes("drive.google.com") || url.includes("docs.google.com");
  };

  // Helper function to extract Google Drive file ID and return embed URL
  const getGoogleDriveEmbedUrl = (url: string) => {
    // Handle various Google Drive URL formats:
    // https://drive.google.com/file/d/FILE_ID/view
    // https://drive.google.com/open?id=FILE_ID
    // https://docs.google.com/file/d/FILE_ID/preview
    let fileId = null;

    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      fileId = fileIdMatch[1];
    } else {
      const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (openIdMatch) {
        fileId = openIdMatch[1];
      }
    }

    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return null;
  };

  // Helper function to convert numeric grade to letter grade
  const getLetterGrade = (grade: string): string => {
    if (grade === "-" || grade === "Pending") {
      return grade;
    }

    // Check for fraction format (e.g., "95/100", "35/100")
    const fractionMatch = grade.match(/(\d+)\/(\d+)/);
    if (fractionMatch) {
      const scored = parseInt(fractionMatch[1]);
      const total = parseInt(fractionMatch[2]);
      const percentage = (scored / total) * 100;

      if (percentage >= 90) return "A";
      if (percentage >= 80) return "B";
      if (percentage >= 70) return "C";
      if (percentage >= 60) return "D";
      return "F";
    }

    // If already a letter grade, return as is
    if (grade.match(/^[A-F][+-]?$/)) {
      return grade;
    }

    // Check for direct percentage (e.g., "95%")
    const percentMatch = grade.match(/(\d+)%/);
    if (percentMatch) {
      const percentage = parseInt(percentMatch[1]);
      if (percentage >= 90) return "A";
      if (percentage >= 80) return "B";
      if (percentage >= 70) return "C";
      if (percentage >= 60) return "D";
      return "F";
    }

    return grade;
  };

  // Helper function to get badge color for letter grade
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

  // Helper function to check if a grade indicates failure
  const isFailingGrade = (grade: string): boolean => {
    if (grade === "-" || grade === "Pending") {
      return false;
    }

    // Check for fraction format (e.g., "35/100", "40/80")
    const fractionMatch = grade.match(/(\d+)\/(\d+)/);
    if (fractionMatch) {
      const scored = parseInt(fractionMatch[1]);
      const total = parseInt(fractionMatch[2]);
      const percentage = (scored / total) * 100;
      return percentage < 50; // Failing if less than 50%
    }

    // Check for letter grades
    if (grade.includes("F") || grade.toLowerCase().includes("fail")) {
      return true;
    }

    // Check for direct percentage (e.g., "45%")
    const percentMatch = grade.match(/(\d+)%/);
    if (percentMatch) {
      const percentage = parseInt(percentMatch[1]);
      return percentage < 50;
    }

    return false;
  };

  // Handle assignment submission
  const handleSubmitAssignment = () => {
    if (!uploadedFile || !selectedAssignment) return;

    // Check if assignment is closed
    if (selectedAssignment.isClosed) {
      alert("This assignment is closed and no longer accepts submissions.");
      return;
    }

    // Update the assignment status (in real app, this would be an API call)
    const today = new Date();
    const submittedDate = today.toISOString();

    // Initialize submission history if it doesn't exist
    if (!selectedAssignment.submissionHistory) {
      selectedAssignment.submissionHistory = [];
    }

    // Check if this is a replacement before grading
    const isReplacement =
      selectedAssignment.status === "Submitted" &&
      (selectedAssignment.grade === "Pending" ||
        selectedAssignment.grade === "-");

    // Add to submission history
    const newSubmission = {
      submittedDate: submittedDate,
      fileName: uploadedFile.name,
      version: selectedAssignment.submissionHistory.length + 1,
      isReplacement: isReplacement,
    };
    selectedAssignment.submissionHistory.push(newSubmission);

    // Update assignment details
    selectedAssignment.status = "Submitted";
    selectedAssignment.grade = "Pending";
    selectedAssignment.submittedDate = submittedDate;
    selectedAssignment.submittedFile = uploadedFile.name;
    selectedAssignment.isLate = new Date(selectedAssignment.dueDate) < today;

    // Set success message based on action
    if (isReplacement) {
      setSuccessMessage(
        "File replaced successfully! Your new submission will be reviewed by the instructor.",
      );
    } else {
      setSuccessMessage(
        "Assignment submitted successfully! Your submission will be reviewed by the instructor shortly.",
      );
    }

    // Close assignment modal and show success
    setShowAssignmentModal(false);
    setSelectedAssignment(null);
    setUploadedFile(null);
    setShowSuccessModal(true);
  };

  // Handle animation mount/unmount
  React.useEffect(() => {
    if (showNotifications) {
      setDrawerVisible(true);
      const animationTimeout = setTimeout(() => {}, 10);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return () => clearTimeout(animationTimeout);
    } else if (drawerVisible) {
      timeoutRef.current = setTimeout(
        () => setDrawerVisible(false),
        CLOSE_DURATION,
      );
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showNotifications, drawerVisible]);

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Subject Not Found
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
            We couldn&apos;t find this subject
          </p>
          <button
            onClick={() =>
              router.push(`/dashboard/student/courses/${courseId}`)
            }
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <StudentBreadcrumbs
          items={[
            { label: "Courses", href: "/dashboard/student/courses" },
            {
              label: subject.courseName || "Course",
              href: `/dashboard/student/courses/${courseId}`,
            },
            { label: subject.name },
          ]}
        />

        {/* Subject Header */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                {subject.name}
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Code: {subject.code}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Instructor
              </h3>
              <p className="text-base font-bold text-gray-900">
                {subject.instructor}
              </p>
              <p className="text-sm text-gray-600">{subject.instructorEmail}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Schedule
              </h3>
              <p className="text-base font-medium text-gray-900">
                {subject.schedule}
              </p>
              <p className="text-sm text-gray-600">{subject.room}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Semester
              </h3>
              <p className="text-base font-bold text-gray-900">
                {subject.semester}
              </p>
            </div>
          </div>

          {subject.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Description
              </h3>
              <p className="text-gray-700">{subject.description}</p>
            </div>
          )}
        </div>

        {/* Tabbed Section */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab(0)}
              className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
                activeTab === 0
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
                activeTab === 1
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              Study Materials
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
                activeTab === 2
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              Video Materials
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Assignments Tab */}
            {activeTab === 0 && (
              <div className="space-y-4">
                {subject.assignments
                  ?.filter((a: any) => !disabledAssignments.includes(a.id))
                  .map((assignment: any) => (
                    <div
                      key={assignment.id}
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowAssignmentModal(true);
                      }}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {assignment.title}
                          </h3>
                          {assignment.assignmentSheet && (
                            <span className="px-1.5 py-0.5 bg-green-50 text-[8px] font-black text-green-600 rounded-md flex items-center gap-1 border border-green-100">
                              SHEET
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Due:{" "}
                            {new Date(assignment.dueDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              },
                            )}
                          </p>
                          <p className="text-sm text-gray-500 font-bold flex items-center gap-1">
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
                            {assignment.totalMarks} Marks
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-0">
                        <Badge
                          className={
                            assignment.status === "Submitted"
                              ? "bg-blue-100 text-blue-700"
                              : assignment.status === "Graded"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                          }
                        >
                          {assignment.status}
                        </Badge>
                        {assignment.grade !== "-" &&
                          assignment.grade !== "Pending" && (
                            <>
                              <Badge
                                className={`${getGradeBadgeColor(getLetterGrade(assignment.grade))} text-base md:text-lg font-bold px-3 py-1`}
                              >
                                {getLetterGrade(assignment.grade)}
                              </Badge>
                              <span className="text-sm md:text-base font-semibold text-gray-600">
                                {assignment.grade}
                              </span>
                            </>
                          )}
                      </div>
                    </div>
                  ))}
                {subject.assignments?.filter(
                  (a: any) => !disabledAssignments.includes(a.id),
                ).length === 0 && (
                  <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                    No active assignments for this subject.
                  </div>
                )}
              </div>
            )}

            {/* Course Materials Tab */}
            {activeTab === 1 && (
              <div className="space-y-3">
                {subject.materials.map((material: any) => (
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
                          {new Date(material.uploadedAt).toLocaleDateString(
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
            {activeTab === 2 && (
              <div className="space-y-4">
                {subject.videos.map((video: any) => (
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
                        {video.duration && (
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
                        )}
                        {video.uploadedAt && (
                          <span>
                            Uploaded:{" "}
                            {new Date(video.uploadedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedAssignment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm md:p-4">
          <div className="bg-white md:rounded-xl shadow-2xl max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between z-10">
              <div className="flex-1 pr-2">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 line-clamp-2">
                  {selectedAssignment.title}
                </h2>
                <div className="flex items-center gap-2 md:gap-3 mt-2 flex-wrap">
                  <Badge
                    className={
                      selectedAssignment.status === "Submitted"
                        ? "bg-blue-100 text-blue-700"
                        : selectedAssignment.status === "Graded"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                    }
                  >
                    {selectedAssignment.status}
                  </Badge>
                  {new Date(selectedAssignment.dueDate) < new Date() &&
                    selectedAssignment.status === "Not Submitted" && (
                      <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                    )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedAssignment(null);
                  setUploadedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 flex-shrink-0"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
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

            {/* Modal Content */}
            <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6">
              {/* Due Date and Marks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Unlock Date
                  </p>
                  <p className="text-sm md:text-base font-semibold text-gray-900">
                    {new Date(selectedAssignment.unlockDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Due Date
                  </p>
                  <p className="text-sm md:text-base font-semibold text-gray-900">
                    {new Date(selectedAssignment.dueDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Total Marks
                  </p>
                  <p className="text-sm md:text-base font-semibold text-gray-900">
                    {selectedAssignment.totalMarks}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Marking Lecturer
                  </p>
                  <p className="text-sm md:text-base font-semibold text-gray-900">
                    {selectedAssignment.markingLecturer || "Unassigned"}
                  </p>
                </div>
                {selectedAssignment.grade !== "-" &&
                  selectedAssignment.grade !== "Pending" && (
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                      <p className="text-xs md:text-sm text-green-600 mb-1">
                        Your Grade
                      </p>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={`${getGradeBadgeColor(getLetterGrade(selectedAssignment.grade))} text-2xl md:text-3xl font-bold px-4 py-2`}
                        >
                          {getLetterGrade(selectedAssignment.grade)}
                        </Badge>
                        <p className="font-bold text-xl md:text-2xl text-gray-700">
                          {selectedAssignment.grade}
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-sm md:text-base text-gray-700 whitespace-pre-line">
                  {selectedAssignment.description}
                </p>
              </div>

              {/* Rules */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Rules & Guidelines
                </h3>
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                  <p className="text-sm md:text-base text-gray-700 whitespace-pre-line">
                    {selectedAssignment.rules}
                  </p>
                </div>
              </div>

              {/* Download Assignment File */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">
                  Assignment File
                </h3>
                <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 text-red-600"
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
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm md:text-base font-semibold text-gray-900 truncate">
                      {selectedAssignment.assignmentSheet ||
                        selectedAssignment.assignmentFile}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      Click to download
                    </p>
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
                </button>
              </div>

              {/* Submission Section */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">
                  Your Submission
                </h3>

                {selectedAssignment.status === "Not Submitted" ? (
                  <div className="space-y-3 md:space-y-4">
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadedFile(e.target.files[0]);
                          }
                        }}
                        accept=".pdf,.doc,.docx"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <svg
                          className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-sm md:text-base text-gray-600 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs md:text-sm text-gray-500">
                          PDF, DOC, DOCX (Max 10MB)
                        </p>
                      </label>
                    </div>

                    {uploadedFile && (
                      <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
                        <svg
                          className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base font-semibold text-gray-900 truncate">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="text-red-500 hover:text-red-700"
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
                    )}

                    {/* Late Submission Warning */}
                    {new Date(selectedAssignment.dueDate) < new Date() && (
                      <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <svg
                          className="w-5 h-5 md:w-6 md:h-6 text-orange-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm md:text-base font-semibold text-orange-900">
                            Late Submission
                          </p>
                          <p className="text-xs md:text-sm text-orange-700">
                            This assignment is past due. Late penalty may apply.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      disabled={!uploadedFile}
                      onClick={handleSubmitAssignment}
                      className={`w-full py-3 md:py-3 px-6 rounded-lg text-sm md:text-base font-semibold transition-colors ${
                        uploadedFile
                          ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Submit Assignment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {/* Submitted File */}
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                      <div className="flex items-start md:items-center justify-between mb-3 gap-2">
                        <p className="text-sm md:text-base font-semibold text-green-900">
                          Submitted on{" "}
                          {selectedAssignment.submittedDate &&
                            new Date(
                              selectedAssignment.submittedDate,
                            ).toLocaleString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </p>
                        {selectedAssignment.isLate && (
                          <Badge className="bg-orange-500 text-white">
                            Late Submission
                          </Badge>
                        )}
                      </div>
                      <button className="flex items-center gap-2 md:gap-3 p-3 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors w-full">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-green-600"
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
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm md:text-base font-semibold text-gray-900 truncate">
                            {selectedAssignment.submittedFile}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500">
                            Click to download
                          </p>
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
                      </button>
                    </div>

                    {/* Instructor Feedback */}
                    {selectedAssignment.feedback && (
                      <div>
                        <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
                          Instructor Feedback
                        </h4>
                        <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                          <p className="text-sm md:text-base text-gray-700">
                            {selectedAssignment.feedback}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedAssignment.grade === "Pending" && (
                      <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <svg
                          className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 flex-shrink-0"
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
                        <p className="text-sm md:text-base text-yellow-900">
                          Your submission is being reviewed by the instructor.
                        </p>
                      </div>
                    )}

                    {/* Submission History */}
                    {selectedAssignment.submissionHistory &&
                      selectedAssignment.submissionHistory.length > 1 && (
                        <div>
                          <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
                            Submission History (
                            {selectedAssignment.submissionHistory.length}{" "}
                            versions)
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedAssignment.submissionHistory
                              .slice()
                              .reverse()
                              .map((submission: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-xs font-semibold text-gray-500">
                                      v{submission.version}
                                    </span>
                                    <span className="text-xs text-gray-700 truncate">
                                      {submission.fileName}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                    {new Date(
                                      submission.submittedDate,
                                    ).toLocaleString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Resubmit/Replace Section - Only if not closed */}
                    {!selectedAssignment.isClosed &&
                      (selectedAssignment.grade === "Pending" ||
                        selectedAssignment.grade === "-" ||
                        isFailingGrade(selectedAssignment.grade)) && (
                        <div>
                          <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
                            {selectedAssignment.grade === "Pending" ||
                            selectedAssignment.grade === "-"
                              ? "Replace Submission"
                              : "Resubmit Assignment"}
                          </h4>
                          <div className="space-y-3">
                            <div
                              className={`flex items-start gap-2 p-3 rounded-lg border ${
                                selectedAssignment.grade === "Pending" ||
                                selectedAssignment.grade === "-"
                                  ? "bg-amber-50 border-amber-200"
                                  : "bg-blue-50 border-blue-200"
                              }`}
                            >
                              <svg
                                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                  selectedAssignment.grade === "Pending" ||
                                  selectedAssignment.grade === "-"
                                    ? "text-amber-600"
                                    : "text-blue-600"
                                }`}
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
                              <p
                                className={`text-xs md:text-sm ${
                                  selectedAssignment.grade === "Pending" ||
                                  selectedAssignment.grade === "-"
                                    ? "text-amber-900"
                                    : "text-blue-900"
                                }`}
                              >
                                {selectedAssignment.grade === "Pending" ||
                                selectedAssignment.grade === "-"
                                  ? "Submitted the wrong file? You can replace your submission before it's graded. The new file will replace the current one."
                                  : "You did not pass this assignment. You can resubmit your work to improve your grade."}
                              </p>
                            </div>

                            {/* Upload Area for Resubmission */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center hover:border-blue-400 transition-colors">
                              <input
                                type="file"
                                id="file-resubmit"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setUploadedFile(e.target.files[0]);
                                  }
                                }}
                                accept=".pdf,.doc,.docx"
                              />
                              <label
                                htmlFor="file-resubmit"
                                className="cursor-pointer"
                              >
                                <svg
                                  className="w-8 h-8 md:w-10 md:h-10 text-gray-400 mx-auto mb-2 md:mb-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12"
                                  />
                                </svg>
                                <p className="text-xs md:text-sm text-gray-600 mb-1">
                                  Upload new version
                                </p>
                                <p className="text-xs text-gray-500">
                                  PDF, DOC, DOCX
                                </p>
                              </label>
                            </div>

                            {uploadedFile && (
                              <div className="flex items-center gap-2 md:gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <svg
                                  className="w-6 h-6 text-green-600 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {uploadedFile.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(uploadedFile.size / 1024 / 1024).toFixed(
                                      2,
                                    )}{" "}
                                    MB
                                  </p>
                                </div>
                                <button
                                  onClick={() => setUploadedFile(null)}
                                  className="text-red-500 hover:text-red-700"
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
                            )}

                            <button
                              disabled={!uploadedFile}
                              onClick={handleSubmitAssignment}
                              className={`w-full py-2.5 px-6 rounded-lg text-sm md:text-base font-semibold transition-colors ${
                                uploadedFile
                                  ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {selectedAssignment.grade === "Pending" ||
                              selectedAssignment.grade === "-"
                                ? "Replace File"
                                : "Resubmit Assignment"}
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Closed Assignment Notice */}
                    {selectedAssignment.isClosed && (
                      <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
                        <svg
                          className="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm md:text-base font-semibold text-red-900">
                            Assignment Closed
                          </p>
                          <p className="text-xs md:text-sm text-red-700">
                            This assignment has been closed by the instructor
                            and no longer accepts submissions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Study Material Modal */}
      {showMaterialModal && selectedMaterial && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm md:p-4">
          <div className="bg-white md:rounded-xl shadow-2xl max-w-3xl w-full h-full md:h-auto md:max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between z-10">
              <div className="flex-1 pr-2">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 line-clamp-2">
                  {selectedMaterial.title}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-blue-100 text-blue-700">
                    {selectedMaterial.type}
                  </Badge>
                  {selectedMaterial.size && (
                    <span className="text-sm text-gray-500">
                      {selectedMaterial.size}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMaterialModal(false);
                  setSelectedMaterial(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 flex-shrink-0"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
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

            {/* Modal Content */}
            <div className="px-4 py-4 md:px-6 md:py-6">
              {/* Upload Info */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Uploaded on{" "}
                  {new Date(selectedMaterial.uploadedAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
                {selectedMaterial.description && (
                  <p className="text-sm text-gray-700 mt-2">
                    {selectedMaterial.description}
                  </p>
                )}
              </div>

              {/* PDF Viewer or Preview */}
              <div className="mb-6">
                <div className="border-2 border-gray-200 rounded-lg p-8 md:p-12 bg-gray-50 text-center">
                  <svg
                    className="w-20 h-20 md:w-24 md:h-24 text-red-500 mx-auto mb-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-gray-700 font-semibold mb-2">
                    {selectedMaterial.title}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Preview not available
                  </p>
                  <a
                    href={selectedMaterial.url}
                    download
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download File
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={selectedMaterial.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center font-semibold text-sm md:text-base"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => {
                    setShowMaterialModal(false);
                    setSelectedMaterial(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm md:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm md:p-4">
          <div className="bg-white md:rounded-xl shadow-2xl max-w-5xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between z-10">
              <div className="flex-1 pr-2">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 line-clamp-2">
                  {selectedVideo.title}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    className={
                      selectedVideo.type === "youtube-link" ||
                      selectedVideo.type === "youtube"
                        ? "bg-red-100 text-red-700"
                        : isGoogleDriveUrl(selectedVideo.url)
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                    }
                  >
                    {selectedVideo.type === "youtube-link" ||
                    selectedVideo.type === "youtube"
                      ? "YouTube"
                      : isGoogleDriveUrl(selectedVideo.url)
                        ? "Google Drive"
                        : "Video File"}
                  </Badge>
                  {selectedVideo.duration && (
                    <span className="text-sm text-gray-500">
                      {selectedVideo.duration}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 flex-shrink-0"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
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

            {/* Modal Content */}
            <div className="px-4 py-4 md:px-6 md:py-6">
              {/* Video Player */}
              <div className="mb-6">
                {selectedVideo.type === "youtube-link" ||
                selectedVideo.type === "youtube" ? (
                  <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.url)}`}
                      title={selectedVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : isGoogleDriveUrl(selectedVideo.url) ? (
                  <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={
                        getGoogleDriveEmbedUrl(selectedVideo.url) ||
                        selectedVideo.url
                      }
                      title={selectedVideo.title}
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="relative w-full bg-black rounded-lg overflow-hidden">
                    <video
                      className="w-full"
                      controls
                      controlsList="nodownload"
                      src={selectedVideo.url}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>

              {/* Video Info */}
              {selectedVideo.description && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-gray-700">
                    {selectedVideo.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedVideo.duration && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {selectedVideo.duration}
                    </p>
                  </div>
                )}
                {selectedVideo.uploadedAt && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Uploaded</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedVideo.uploadedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setSelectedVideo(null);
                  }}
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm md:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40"
            aria-modal
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl text-center mx-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-9 h-9 text-green-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <div className="text-lg font-semibold text-gray-800">
                {successMessage.includes("replaced")
                  ? "File Replaced Successfully!"
                  : "Assignment Submitted Successfully!"}
              </div>
              <div className="text-xs text-gray-500 mt-1 px-2">
                {successMessage ||
                  "Your submission will be reviewed by the instructor shortly."}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
