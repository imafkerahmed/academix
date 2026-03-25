"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import pb from "@/lib/pocketbase";
import type {
  Course,
  Subject,
  CourseIntake,
  CourseSubject,
  CourseIntakeFee,
  Intake,
  CourseTemplate,
} from "@/lib/pocketbase";
import { toast } from "sonner";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Search,
  BookOpen,
  FileText,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminLoader from "@/components/admin/AdminLoader";
import { ModernModal } from "@/components/ui/modern-modal";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

type Tab = "courses" | "courseIntakes" | "fees" | "templates";

export default function AcademicStructurePage() {
  const [tab, setTab] = useState<Tab>("courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [coursesPage, setCoursesPage] = useState(1);
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [courseIntakesPage, setCourseIntakesPage] = useState(1);
  const [feesPage, setFeesPage] = useState(1);
  const [templatesPage, setTemplatesPage] = useState(1);
  const itemsPerPage = 10;

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courseIntakes, setCourseIntakes] = useState<CourseIntake[]>([]);
  const [courseSubjects, setCourseSubjects] = useState<CourseSubject[]>([]);
  const [fees, setFees] = useState<CourseIntakeFee[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([]);
  const [courseStatusFilter] =
    useState<string>("active");

  // Modal states for Courses
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    template: "",
    code: "",
    name: "",
  });

  // Modal states for Subjects
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    code: "",
    name: "",
    description: "",
  });

  // Modal states for Course-Intakes
  const [showCourseIntakeModal, setShowCourseIntakeModal] = useState(false);
  const [editingCourseIntake, setEditingCourseIntake] =
    useState<CourseIntake | null>(null);
  const [courseIntakeStep, setCourseIntakeStep] = useState<1 | 2>(1);
  const [courseIntakeForm, setCourseIntakeForm] = useState({
    course: "",
    intake: "",
    start_date: "",
    end_date: "",
    is_semester_based: false,
    semester_count: 0,
    course_status: "upcoming" as "ongoing" | "completed" | "upcoming",
  });
  const [selectedSubjects, setSelectedSubjects] = useState<
    { subject: string; credits: number }[]
  >([]);
  const [expandedCourseIntake, setExpandedCourseIntake] = useState<
    string | null
  >(null);

  // Modal states for Fees
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState<CourseIntakeFee | null>(null);
  const [feeForm, setFeeForm] = useState({
    course_intake: "",
    registration_fee: 0,
    course_fee: 0,
    duration: 0,
  });

  // Modal states for Templates
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CourseTemplate | null>(
    null,
  );
  const [templateForm, setTemplateForm] = useState({
    course_code: "",
    course_name: "",
    course_description: "",
  });
  const [templateType, setTemplateType] = useState<"courses" | "subjects">(
    "courses",
  );

  // Auto-status calculation
  const calculateCourseIntakeStatus = useCallback((
    start_date: string,
    end_date: string,
  ): "upcoming" | "ongoing" | "completed" => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(start_date);
    const end = new Date(end_date);

    if (today < start) return "upcoming";
    if (today > end) return "completed";
    return "ongoing";
  }, []);

  const updateExpiredCourseIntakes = useCallback(async (courseIntakesData: CourseIntake[]) => {
    try {
      const updates: Promise<unknown>[] = [];
      let updateCount = 0;

      for (const ci of courseIntakesData) {
        const calculatedStatus = calculateCourseIntakeStatus(
          ci.start_date,
          ci.end_date,
        );
        if (ci.course_status !== calculatedStatus) {
          updates.push(
            pb.collection("course_intakes").update(ci.id, {
              course_status: calculatedStatus,
            }),
          );
          updateCount++;
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`Auto-updated ${updateCount} course-intake statuses`);
        // Refresh data after updates
        const updatedCourseIntakes = await pb
          .collection("course_intakes")
          .getFullList<CourseIntake>({
            sort: "-created",
            expand: "course,intake",
          });
        setCourseIntakes(updatedCourseIntakes);
      }
    } catch (error: unknown) {
      console.error("Error updating course-intake statuses:", error);
    }
  }, [calculateCourseIntakeStatus]);

  const updateCourseStatuses = useCallback(async (
    coursesData: Course[],
    courseIntakesData: CourseIntake[],
  ) => {
    try {
      const updates: Promise<unknown>[] = [];

      for (const course of coursesData) {
        // Get all course-intakes for this course
        const courseIntakesForCourse = courseIntakesData.filter(
          (ci) => ci.course === course.id,
        );

        if (courseIntakesForCourse.length === 0) continue;

        // Check if all are completed
        const allCompleted = courseIntakesForCourse.every(
          (ci) => ci.course_status === "completed",
        );
        const hasActive = courseIntakesForCourse.some(
          (ci) =>
            ci.course_status === "ongoing" || ci.course_status === "upcoming",
        );

        const newStatus = allCompleted
          ? "completed"
          : hasActive
            ? "active"
            : "completed";

        if (course.status !== newStatus) {
          updates.push(
            pb.collection("courses").update(course.id, {
              status: newStatus,
            }),
          );
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`Auto-updated ${updates.length} course statuses`);
        // Refresh courses data after updates
        const updatedCourses = await pb
          .collection("courses")
          .getFullList<Course>({ sort: "-created" });
        setCourses(updatedCourses);
      }
    } catch (error: unknown) {
      console.error("Error updating course statuses:", error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        coursesData,
        subjectsData,
        courseIntakesData,
        courseSubjectsData,
        feesData,
        intakesData,
        templatesData,
      ] = await Promise.all([
        pb.collection("courses").getFullList<Course>({ sort: "-created" }),
        pb.collection("subjects").getFullList<Subject>({ sort: "-created" }),
        pb.collection("course_intakes").getFullList<CourseIntake>({
          sort: "-created",
          expand: "course,intake",
        }),
        pb
          .collection("course_subjects")
          .getFullList<CourseSubject>({ expand: "subject,course_intake" }),
        pb.collection("course_intake_fees").getFullList<CourseIntakeFee>({
          expand: "course_intake.course,course_intake.intake",
        }),
        pb.collection("intakes").getFullList<Intake>({ sort: "-created" }),
        pb
          .collection("course_templates")
          .getFullList<CourseTemplate>({ sort: "-created" }),
      ]);

      setCourses(coursesData);
      setSubjects(subjectsData);
      setCourseIntakes(courseIntakesData);
      setCourseSubjects(courseSubjectsData);
      setFees(feesData);
      setIntakes(intakesData);
      setCourseTemplates(templatesData);

      // Auto-update statuses after loading data
      await updateExpiredCourseIntakes(courseIntakesData);
      await updateCourseStatuses(coursesData, courseIntakesData);
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  }, [updateExpiredCourseIntakes, updateCourseStatuses]);

  useEffect(() => {
    void fetchAllData();
  }, [fetchAllData]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCoursesPage(1);
    setSubjectsPage(1);
    setCourseIntakesPage(1);
    setFeesPage(1);
  }, [searchQuery]);

  // Reset pagination when tab changes
  useEffect(() => {
    setSearchQuery("");
  }, [tab]);

  // Course CRUD
  async function handleCreateCourse() {
    try {
      if (!courseForm.template || !courseForm.code || !courseForm.name) {
        toast.error("Please fill all required fields");
        return;
      }

      // Check for duplicate code
      const existingCourse = courses.find(
        (c) => c.code.toUpperCase() === courseForm.code.toUpperCase(),
      );
      if (existingCourse) {
        toast.error("Course code already exists");
        return;
      }

      await pb.collection("courses").create({
        code: courseForm.code.toUpperCase(),
        name: courseForm.name,
        status: "active",
      });

      toast.success("Course created successfully!");
      setShowCourseModal(false);
      setCourseForm({ template: "", code: "", name: "" });
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error creating course:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to create course");
    }
  }

  async function handleUpdateCourse() {
    try {
      if (!editingCourse || !courseForm.code || !courseForm.name) {
        toast.error("Please fill all required fields");
        return;
      }

      await pb.collection("courses").update(editingCourse.id, {
        code: courseForm.code.toUpperCase(),
        name: courseForm.name,
      });

      toast.success("Course updated successfully!");
      setShowCourseModal(false);
      setEditingCourse(null);
      setCourseForm({ template: "", code: "", name: "" });
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error updating course:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to update course");
    }
  }

  async function handleDeleteCourse(courseId: string) {
    if (
      !confirm(
        "Delete this course? Course-intake links will remain but this course info will be deleted.",
      )
    ) {
      return;
    }

    try {
      await pb.collection("courses").delete(courseId);
      toast.success("Course deleted successfully!");
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error deleting course:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to delete course");
    }
  }

  // Subject CRUD
  async function handleCreateSubject() {
    try {
      if (!subjectForm.code || !subjectForm.name) {
        toast.error("Please fill all required fields");
        return;
      }

      await pb.collection("subjects").create({
        code: subjectForm.code.toUpperCase(),
        name: subjectForm.name,
        description: subjectForm.description,
      });

      toast.success("Subject created successfully!");
      setShowSubjectModal(false);
      setSubjectForm({ code: "", name: "", description: "" });
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  async function handleUpdateSubject() {
    try {
      if (!editingSubject || !subjectForm.code || !subjectForm.name) {
        toast.error("Please fill all required fields");
        return;
      }

      await pb.collection("subjects").update(editingSubject.id, {
        code: subjectForm.code.toUpperCase(),
        name: subjectForm.name,
        description: subjectForm.description,
      });

      toast.success("Subject updated successfully!");
      setShowSubjectModal(false);
      setEditingSubject(null);
      setSubjectForm({ code: "", name: "", description: "" });
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  async function handleDeleteSubject(subjectId: string) {
    if (
      !confirm(
        "Delete this subject? It will be removed from all course-intakes.",
      )
    ) {
      return;
    }

    try {
      await pb.collection("subjects").delete(subjectId);
      toast.success("Subject deleted successfully!");
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  // CourseIntake CRUD
  async function handleCreateCourseIntake() {
    try {
      if (courseIntakeStep === 1) {
        // Validate step 1
        if (
          !courseIntakeForm.course ||
          !courseIntakeForm.intake ||
          !courseIntakeForm.start_date ||
          !courseIntakeForm.end_date
        ) {
          toast.error("Please fill all required fields");
          return;
        }

        // Check for duplicates
        const existing = await pb
          .collection("course_intakes")
          .getFirstListItem(
            `course="${courseIntakeForm.course}" && intake="${courseIntakeForm.intake}"`,
          )
          .catch(() => null);

        if (existing) {
          toast.error("This course-intake combination already exists");
          return;
        }

        // Move to step 2
        setCourseIntakeStep(2);
        return;
      }

      // Step 2: Create course-intake and subjects
      const courseIntakeData = await pb.collection("course_intakes").create({
        course: courseIntakeForm.course,
        intake: courseIntakeForm.intake,
        start_date: courseIntakeForm.start_date,
        end_date: courseIntakeForm.end_date,
        is_semester_based: courseIntakeForm.is_semester_based,
        semester_count: courseIntakeForm.is_semester_based
          ? courseIntakeForm.semester_count
          : null,
        course_status: courseIntakeForm.course_status,
      });

      // Create course subjects
      if (selectedSubjects.length > 0) {
        await Promise.all(
          selectedSubjects.map((s) =>
            pb.collection("course_subjects").create({
              course_intake: courseIntakeData.id,
              subject: [s.subject],
              credits: s.credits,
            }),
          ),
        );
      }

      toast.success("Course-intake created successfully!");
      resetCourseIntakeModal();
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  async function handleUpdateCourseIntake() {
    try {
      if (!editingCourseIntake) return;

      if (courseIntakeStep === 1) {
        // Validate step 1
        if (!courseIntakeForm.start_date || !courseIntakeForm.end_date) {
          toast.error("Please fill all required fields");
          return;
        }

        // Move to step 2
        setCourseIntakeStep(2);
        return;
      }

      // Step 2: Update course-intake
      await pb.collection("course_intakes").update(editingCourseIntake.id, {
        start_date: courseIntakeForm.start_date,
        end_date: courseIntakeForm.end_date,
        is_semester_based: courseIntakeForm.is_semester_based,
        semester_count: courseIntakeForm.is_semester_based
          ? courseIntakeForm.semester_count
          : null,
        course_status: courseIntakeForm.course_status,
      });

      // Delete existing subjects and recreate
      const existingSubjects = courseSubjects.filter(
        (cs) => cs.course_intake === editingCourseIntake.id,
      );
      await Promise.all(
        existingSubjects.map((cs) =>
          pb.collection("course_subjects").delete(cs.id),
        ),
      );

      // Create new subjects
      if (selectedSubjects.length > 0) {
        await Promise.all(
          selectedSubjects.map((s) =>
            pb.collection("course_subjects").create({
              course_intake: editingCourseIntake.id,
              subject: [s.subject],
              credits: s.credits,
            }),
          ),
        );
      }

      toast.success("Course-intake updated successfully!");
      resetCourseIntakeModal();
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  async function handleDeleteCourseIntake(courseIntakeId: string) {
    if (
      !confirm(
        "Delete this course-intake? Associated subjects and fees will also be affected.",
      )
    ) {
      return;
    }

    try {
      await pb.collection("course_intakes").delete(courseIntakeId);
      toast.success("Course-intake deleted successfully!");
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  function resetCourseIntakeModal() {
    setShowCourseIntakeModal(false);
    setEditingCourseIntake(null);
    setCourseIntakeStep(1);
    setCourseIntakeForm({
      course: "",
      intake: "",
      start_date: "",
      end_date: "",
      is_semester_based: false,
      semester_count: 0,
      course_status: "upcoming",
    });
    setSelectedSubjects([]);
  }

  // Fee CRUD
  async function handleCreateFee() {
    try {
      if (!feeForm.course_intake) {
        toast.error("Please select a course-intake");
        return;
      }

      await pb.collection("course_intake_fees").create({
        course_intake: feeForm.course_intake,
        registration_fee: feeForm.registration_fee,
        course_fee: feeForm.course_fee,
        duration: feeForm.duration,
      });

      toast.success("Fee created successfully!");
      setShowFeeModal(false);
      setFeeForm({
        course_intake: "",
        registration_fee: 0,
        course_fee: 0,
        duration: 0,
      });
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  async function handleUpdateFee() {
    try {
      if (!editingFee) return;

      await pb.collection("course_intake_fees").update(editingFee.id, {
        registration_fee: feeForm.registration_fee,
        course_fee: feeForm.course_fee,
        duration: feeForm.duration,
      });

      toast.success("Fee updated successfully!");
      setShowFeeModal(false);
      setEditingFee(null);
      setFeeForm({
        course_intake: "",
        registration_fee: 0,
        course_fee: 0,
        duration: 0,
      });
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  async function handleDeleteFee(feeId: string) {
    if (!confirm("Delete this fee configuration?")) {
      return;
    }

    try {
      await pb.collection("course_intake_fees").delete(feeId);
      toast.success("Fee deleted successfully!");
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }


  // Template CRUD
  async function handleCreateTemplate() {
    try {
      if (!templateForm.course_name) {
        toast.error("Course name is required");
        return;
      }

      await pb.collection("course_templates").create({
        course_code: templateForm.course_code.toUpperCase(),
        course_name: templateForm.course_name,
        course_description: templateForm.course_description,
      });

      toast.success("Template created successfully!");
      setShowTemplateModal(false);
      setTemplateForm({
        course_code: "",
        course_name: "",
        course_description: "",
      });
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  async function handleUpdateTemplate() {
    try {
      if (!editingTemplate) return;
      if (!templateForm.course_name) {
        toast.error("Course name is required");
        return;
      }

      await pb.collection("course_templates").update(editingTemplate.id, {
        course_code: templateForm.course_code.toUpperCase(),
        course_name: templateForm.course_name,
        course_description: templateForm.course_description,
      });

      toast.success("Template updated successfully!");
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm({
        course_code: "",
        course_name: "",
        course_description: "",
      });
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await pb.collection("course_templates").delete(id);
      toast.success("Template deleted successfully!");
      fetchAllData();
    } catch (error: unknown) {
      console.error("Error:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Operation failed");
    }
  }

  // Helper function for code generation with date
  function generateCourseCodeWithDate(
    templateCode: string,
    customDate?: Date,
  ): string {
    const now = customDate || new Date();
    const month = now.toLocaleString("en-US", { month: "long" }).toUpperCase();
    const year = now.getFullYear();

    const baseCode = `${templateCode}/${month}/${year}`;

    // Check for duplicates and add suffix if needed
    let finalCode = baseCode;
    let counter = 1;
    while (courses.some((c) => c.code === finalCode)) {
      finalCode = `${baseCode}-${counter}`;
      counter++;
    }

    return finalCode;
  }

  // Helper function for code generation (legacy, for templates without codes)
  function generateCourseCode(name: string): string {
    // Generate acronym from course name
    const words = name.trim().toUpperCase().split(/\s+/);
    let acronym = words.map((w) => w[0]).join("");

    // Limit to 6 characters
    if (acronym.length > 6) {
      acronym = acronym.substring(0, 6);
    }

    // Check for duplicates and add number suffix
    let code = acronym;
    let counter = 1;
    while (courses.some((c) => c.code === code)) {
      code = acronym + counter;
      counter++;
    }

    return code;
  }

  // Filter functions
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      courseStatusFilter === "" || c.status === courseStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSubjects = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCourseIntakes = courseIntakes.filter((ci) => {
    const courseCode = ci.expand?.course?.code || "";
    const courseName = ci.expand?.course?.name || "";
    const intakeCode = ci.expand?.intake?.code || "";
    return (
      courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intakeCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredFees = fees.filter((f) => {
    const courseCode = f.expand?.course_intake?.expand?.course?.code || "";
    const intakeCode = f.expand?.course_intake?.expand?.intake?.code || "";
    const matchesSearch =
      courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intakeCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredTemplates = courseTemplates.filter(
    (t) =>
      t.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.course_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination calculations
  const totalCoursesPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const totalSubjectsPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const totalCourseIntakesPages = Math.ceil(
    filteredCourseIntakes.length / itemsPerPage,
  );
  const totalFeesPages = Math.ceil(filteredFees.length / itemsPerPage);
  const totalTemplatesPages = Math.ceil(
    filteredTemplates.length / itemsPerPage,
  );

  // Paginated data
  const paginatedCourses = filteredCourses.slice(
    (coursesPage - 1) * itemsPerPage,
    coursesPage * itemsPerPage,
  );
  const paginatedSubjects = filteredSubjects.slice(
    (subjectsPage - 1) * itemsPerPage,
    subjectsPage * itemsPerPage,
  );
  const paginatedCourseIntakes = filteredCourseIntakes.slice(
    (courseIntakesPage - 1) * itemsPerPage,
    courseIntakesPage * itemsPerPage,
  );
  const paginatedFees = filteredFees.slice(
    (feesPage - 1) * itemsPerPage,
    feesPage * itemsPerPage,
  );
  const paginatedTemplates = filteredTemplates.slice(
    (templatesPage - 1) * itemsPerPage,
    templatesPage * itemsPerPage,
  );

  // Get course-intakes without fees for fee creation dropdown
  const courseIntakesWithoutFees = courseIntakes.filter(
    (ci) => !fees.some((f) => f.course_intake === ci.id),
  );

  // Get subjects for a specific course-intake
  function getSubjectsForCourseIntake(courseIntakeId: string) {
    return courseSubjects.filter((cs) => cs.course_intake === courseIntakeId);
  }

  // Check if a course-intake has fees configured
  function hasFeeConfigured(courseIntakeId: string) {
    return fees.some((f) => f.course_intake === courseIntakeId);
  }

  // Get status badge color
  function getStatusColor(status: string) {
    switch (status) {
      case "ongoing":
        return "bg-green-500 text-white";
      case "completed":
        return "bg-gray-500 text-white";
      case "upcoming":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  }



  return (
    <div className="space-y-8">
        {/* Compact Header */}
        <div className="mb-6">
          <AdminBreadcrumbs
            items={[
              { label: "Settings", href: "/dashboard/admin/settings" },
              { label: "Academic Structure" },
            ]}
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                <Layers size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Academic Structure
                </h1>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Configure courses, subjects & fees
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-gray-600 border border-gray-200">
                {courses.length} Courses
              </Badge>
              <Badge className="bg-gray-100 text-gray-600 border border-gray-200">
                {subjects.length} Subjects
              </Badge>
              <Badge className="bg-gray-100 text-gray-600 border border-gray-200">
                {courseIntakes.length} Setups
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 sticky top-6">
              <div className="space-y-2">
                {/* Courses Tab */}
                <button
                  onClick={() => {
                    setTab("courses");
                    setSearchQuery("");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    tab === "courses"
                      ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${tab === "courses" ? "bg-white/20" : "bg-gray-100"}`}
                  >
                    <BookOpen size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-black text-sm uppercase tracking-wide">
                      Courses
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${
                        tab === "courses" ? "text-green-100" : "text-gray-400"
                      }`}
                    >
                      Active courses
                    </div>
                  </div>
                </button>

                {/* Course Intakes Tab */}
                <button
                  onClick={() => {
                    setTab("courseIntakes");
                    setSearchQuery("");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    tab === "courseIntakes"
                      ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${tab === "courseIntakes" ? "bg-white/20" : "bg-gray-100"}`}
                  >
                    <Calendar size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-black text-sm uppercase tracking-wide">
                      Course Intakes
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${
                        tab === "courseIntakes"
                          ? "text-green-100"
                          : "text-gray-400"
                      }`}
                    >
                      Link & assign subjects
                    </div>
                  </div>
                </button>

                {/* Fee Structure Tab */}
                <button
                  onClick={() => {
                    setTab("fees");
                    setSearchQuery("");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    tab === "fees"
                      ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${tab === "fees" ? "bg-white/20" : "bg-gray-100"}`}
                  >
                    <DollarSign size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-black text-sm uppercase tracking-wide">
                      Fee Structure
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${
                        tab === "fees" ? "text-green-100" : "text-gray-400"
                      }`}
                    >
                      Configure pricing
                    </div>
                  </div>
                </button>

                {/* Templates Tab */}
                <button
                  onClick={() => {
                    setTab("templates");
                    setSearchQuery("");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    tab === "templates"
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${tab === "templates" ? "bg-white/20" : "bg-gray-100"}`}
                  >
                    <FileText size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-black text-sm uppercase tracking-wide">
                      Templates
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${
                        tab === "templates"
                          ? "text-purple-100"
                          : "text-gray-400"
                      }`}
                    >
                      Course Templates
                    </div>
                  </div>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">
                  Quick Stats
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-bold">
                    Total Fees Set
                  </span>
                  <span className="font-black text-green-600 text-lg">
                    {fees.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-bold">
                    Active Intakes
                  </span>
                  <span className="font-black text-green-600 text-lg">
                    {
                      courseIntakes.filter(
                        (ci) => ci.course_status === "ongoing",
                      ).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-bold">
                    Pending Setups
                  </span>
                  <span className="font-black text-orange-600 text-lg">
                    {
                      courseIntakes.filter((ci) => !hasFeeConfigured(ci.id))
                        .length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 space-y-6">
            {loading ? (
              <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex items-center justify-center">
                <AdminLoader inline={true} message="Syncing Academic Records..." />
              </div>
            ) : (
              <>
                {/* Section Header with Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Search */}
                <div className="flex-1 max-w-md relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      tab === "courses"
                        ? "Search courses..."
                        : tab === "courseIntakes"
                          ? "Search course-intakes..."
                          : tab === "templates"
                            ? templateType === "courses"
                              ? "Search course templates..."
                              : "Search subjects..."
                            : "Search fees..."
                    }
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-medium text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {tab === "courses" && (
                    <button
                      onClick={() => {
                        setEditingCourse(null);
                        setCourseForm({ template: "", code: "", name: "" });
                        setShowCourseModal(true);
                      }}
                      className="px-5 py-3 rounded-xl bg-green-600 text-white font-black text-xs tracking-widest shadow-md hover:bg-green-700 hover:shadow-lg transition-all flex items-center gap-2 uppercase"
                    >
                      <Plus size={16} /> Course
                    </button>
                  )}
                  {tab === "courseIntakes" && (
                    <button
                      onClick={() => {
                        setEditingCourseIntake(null);
                        setCourseIntakeForm({
                          course: "",
                          intake: "",
                          start_date: "",
                          end_date: "",
                          is_semester_based: false,
                          semester_count: 0,
                          course_status: "upcoming",
                        });
                        setSelectedSubjects([]);
                        setCourseIntakeStep(1);
                        setShowCourseIntakeModal(true);
                      }}
                      className="px-5 py-3 rounded-xl bg-green-600 text-white font-black text-xs tracking-widest shadow-md hover:bg-green-700 hover:shadow-lg transition-all flex items-center gap-2 uppercase"
                    >
                      <Plus size={16} /> Course-Intake
                    </button>
                  )}
                  {tab === "fees" && (
                    <button
                      onClick={() => {
                        setEditingFee(null);
                        setFeeForm({
                          course_intake: "",
                          registration_fee: 0,
                          course_fee: 0,
                          duration: 0,
                        });
                        setShowFeeModal(true);
                      }}
                      className="px-5 py-3 rounded-xl bg-green-600 text-white font-black text-xs tracking-widest shadow-md hover:bg-green-700 hover:shadow-lg transition-all flex items-center gap-2 uppercase"
                    >
                      <Plus size={16} /> Fee
                    </button>
                  )}
                  {tab === "templates" && (
                    <button
                      onClick={() => {
                        if (templateType === "courses") {
                          setEditingTemplate(null);
                          setTemplateForm({
                            course_code: "",
                            course_name: "",
                            course_description: "",
                          });
                          setShowTemplateModal(true);
                        } else {
                          setEditingSubject(null);
                          setSubjectForm({
                            code: "",
                            name: "",
                            description: "",
                          });
                          setShowSubjectModal(true);
                        }
                      }}
                      className={`px-5 py-3 rounded-xl text-white font-black text-xs tracking-widest shadow-md hover:shadow-lg transition-all flex items-center gap-2 uppercase ${
                        templateType === "courses"
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      <Plus size={16} />{" "}
                      {templateType === "courses"
                        ? "Course Template"
                        : "Subject"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {tab === "courses" && (
              <div className="space-y-6">
                {/* Courses Section */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-transparent">
                    <h2 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                      <BookOpen size={18} className="text-green-600" />
                      Courses
                      <Badge className="bg-green-500 text-white ml-auto">
                        {filteredCourses.length}
                      </Badge>
                    </h2>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                            Code
                          </th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                            Name
                          </th>
                          <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-500">
                            Status
                          </th>
                          <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-500">
                            Active Intakes
                          </th>
                          <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredCourses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-16 text-center">
                              <Search
                                size={36}
                                className="mx-auto text-gray-300 mb-3"
                              />
                              <p className="text-gray-400 font-bold text-sm">
                                No courses found
                              </p>
                            </td>
                          </tr>
                        ) : (
                          paginatedCourses.map((course) => (
                            <tr
                              key={course.id}
                              className="hover:bg-green-50/30 transition-all"
                            >
                              <td className="px-6 py-4">
                                <span className="font-black text-green-600 text-sm">
                                  {course.code}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-gray-700 text-sm">
                                  {course.name}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge
                                  className={`${
                                    course.status === "active"
                                      ? "bg-green-500 text-white"
                                      : course.status === "completed"
                                        ? "bg-gray-400 text-white"
                                        : "bg-orange-500 text-white"
                                  }`}
                                >
                                  {course.status || "active"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-sm font-bold text-gray-700">
                                  {
                                    courseIntakes.filter(
                                      (ci) =>
                                        ci.course === course.id &&
                                        (ci.course_status === "ongoing" ||
                                          ci.course_status === "upcoming"),
                                    ).length
                                  }
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCourse(course);
                                      setCourseForm({
                                        template: "",
                                        code: course.code,
                                        name: course.name,
                                      });
                                      setShowCourseModal(true);
                                    }}
                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteCourse(course.id)
                                    }
                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredCourses.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-500 font-medium">
                        Showing{" "}
                        {Math.min(
                          (coursesPage - 1) * itemsPerPage + 1,
                          filteredCourses.length,
                        )}
                        -
                        {Math.min(
                          coursesPage * itemsPerPage,
                          filteredCourses.length,
                        )}{" "}
                        of {filteredCourses.length} results
                      </p>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                setCoursesPage(Math.max(1, coursesPage - 1))
                              }
                              className={
                                coursesPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {totalCoursesPages <= 7 ? (
                            // Show all pages if 7 or fewer
                            Array.from(
                              { length: totalCoursesPages },
                              (_, i) => i + 1,
                            ).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCoursesPage(page)}
                                  isActive={coursesPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))
                          ) : (
                            // Show abbreviated pagination with ellipsis
                            <>
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() => setCoursesPage(1)}
                                  isActive={coursesPage === 1}
                                  className="cursor-pointer"
                                >
                                  1
                                </PaginationLink>
                              </PaginationItem>
                              {coursesPage > 3 && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              {coursesPage > 2 &&
                                coursesPage < totalCoursesPages - 1 && (
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() =>
                                        setCoursesPage(coursesPage - 1)
                                      }
                                      className="cursor-pointer"
                                    >
                                      {coursesPage - 1}
                                    </PaginationLink>
                                  </PaginationItem>
                                )}
                              {coursesPage !== 1 &&
                                coursesPage !== totalCoursesPages && (
                                  <PaginationItem>
                                    <PaginationLink
                                      isActive
                                      className="cursor-pointer"
                                    >
                                      {coursesPage}
                                    </PaginationLink>
                                  </PaginationItem>
                                )}
                              {coursesPage < totalCoursesPages - 2 && (
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() =>
                                      setCoursesPage(coursesPage + 1)
                                    }
                                    className="cursor-pointer"
                                  >
                                    {coursesPage + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              )}
                              {coursesPage < totalCoursesPages - 2 && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() =>
                                    setCoursesPage(totalCoursesPages)
                                  }
                                  isActive={coursesPage === totalCoursesPages}
                                  className="cursor-pointer"
                                >
                                  {totalCoursesPages}
                                </PaginationLink>
                              </PaginationItem>
                            </>
                          )}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setCoursesPage(
                                  Math.min(totalCoursesPages, coursesPage + 1),
                                )
                              }
                              className={
                                coursesPage === totalCoursesPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "courseIntakes" && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-50">
                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Course
                        </th>
                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Intake
                        </th>
                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Date Range
                        </th>
                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Status
                        </th>
                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Subjects
                        </th>
                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Fee Status
                        </th>
                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                      {filteredCourseIntakes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-24 text-center">
                            <Calendar
                              size={48}
                              className="mx-auto text-gray-300 mb-4"
                            />
                            <h3 className="text-xl font-black text-gray-900 mb-2">
                              No Course-Intakes Found
                            </h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                              Create your first course-intake to get started
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedCourseIntakes.map((ci) => {
                          const ciSubjects = getSubjectsForCourseIntake(ci.id);
                          const isExpanded = expandedCourseIntake === ci.id;

                          return (
                            <Fragment key={ci.id}>
                              <tr
                                className="hover:bg-green-50/30 transition-all cursor-pointer"
                                onClick={() =>
                                  setExpandedCourseIntake(
                                    isExpanded ? null : ci.id,
                                  )
                                }
                              >
                                <td className="px-6 py-4">
                                  <div>
                                    <span className="font-black text-green-600 text-sm block">
                                      {ci.expand?.course?.code}
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold">
                                      {ci.expand?.course?.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge className="bg-indigo-500 text-white">
                                    {ci.expand?.intake?.code}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-gray-600 font-bold">
                                    {new Date(
                                      ci.start_date,
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(ci.end_date).toLocaleDateString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex flex-col gap-1 items-center">
                                    <Badge
                                      className={getStatusColor(
                                        ci.course_status,
                                      )}
                                    >
                                      {ci.course_status.toUpperCase()}
                                    </Badge>
                                    {ci.is_semester_based && (
                                      <span className="text-[10px] text-gray-400 font-bold">
                                        {ci.semester_count} Semesters
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <Badge className="bg-purple-500 text-white">
                                    {ciSubjects.length}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <Badge
                                    className={
                                      hasFeeConfigured(ci.id)
                                        ? "bg-green-500 text-white"
                                        : "bg-red-500 text-white"
                                    }
                                  >
                                    {hasFeeConfigured(ci.id)
                                      ? "SET"
                                      : "NOT SET"}
                                  </Badge>
                                </td>
                                <td
                                  className="px-6 py-4"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingCourseIntake(ci);
                                        setCourseIntakeForm({
                                          course: ci.course,
                                          intake: ci.intake,
                                          start_date: ci.start_date,
                                          end_date: ci.end_date,
                                          is_semester_based:
                                            ci.is_semester_based,
                                          semester_count:
                                            ci.semester_count || 0,
                                          course_status: ci.course_status,
                                        });
                                        const existingSubjects = ciSubjects.map(
                                          (cs) => ({
                                            subject: Array.isArray(cs.subject)
                                              ? cs.subject[0]
                                              : cs.subject,
                                            credits: cs.credits,
                                          }),
                                        );
                                        setSelectedSubjects(existingSubjects);
                                        setCourseIntakeStep(1);
                                        setShowCourseIntakeModal(true);
                                      }}
                                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteCourseIntake(ci.id)
                                      }
                                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                    <button className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                                      {isExpanded ? (
                                        <ChevronUp size={16} />
                                      ) : (
                                        <ChevronDown size={16} />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="px-6 py-4 bg-gray-50/30"
                                  >
                                    <div className="pl-12">
                                      <h4 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">
                                        Assigned Subjects
                                      </h4>
                                      {ciSubjects.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">
                                          No subjects assigned
                                        </p>
                                      ) : (
                                        <div className="space-y-2">
                                          {ciSubjects.map((cs) => {
                                            const subjectData = Array.isArray(
                                              cs.expand?.subject,
                                            )
                                              ? cs.expand?.subject[0]
                                              : cs.expand?.subject;
                                            return (
                                              <div
                                                key={cs.id}
                                                className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100"
                                              >
                                                <div>
                                                  <span className="font-black text-purple-600 text-sm">
                                                    {subjectData?.code}
                                                  </span>
                                                  <span className="text-gray-600 text-sm ml-3">
                                                    {subjectData?.name}
                                                  </span>
                                                </div>
                                                <Badge className="bg-purple-500 text-white">
                                                  {cs.credits} Credits
                                                </Badge>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredCourseIntakes.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">
                      Showing{" "}
                      {Math.min(
                        (courseIntakesPage - 1) * itemsPerPage + 1,
                        filteredCourseIntakes.length,
                      )}
                      -
                      {Math.min(
                        courseIntakesPage * itemsPerPage,
                        filteredCourseIntakes.length,
                      )}{" "}
                      of {filteredCourseIntakes.length} results
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCourseIntakesPage(
                                Math.max(1, courseIntakesPage - 1),
                              )
                            }
                            className={
                              courseIntakesPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {totalCourseIntakesPages <= 7 ? (
                          Array.from(
                            { length: totalCourseIntakesPages },
                            (_, i) => i + 1,
                          ).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCourseIntakesPage(page)}
                                isActive={courseIntakesPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))
                        ) : (
                          <>
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setCourseIntakesPage(1)}
                                isActive={courseIntakesPage === 1}
                                className="cursor-pointer"
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                            {courseIntakesPage > 3 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            {courseIntakesPage > 2 &&
                              courseIntakesPage <
                                totalCourseIntakesPages - 1 && (
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() =>
                                      setCourseIntakesPage(
                                        courseIntakesPage - 1,
                                      )
                                    }
                                    className="cursor-pointer"
                                  >
                                    {courseIntakesPage - 1}
                                  </PaginationLink>
                                </PaginationItem>
                              )}
                            {courseIntakesPage !== 1 &&
                              courseIntakesPage !== totalCourseIntakesPages && (
                                <PaginationItem>
                                  <PaginationLink
                                    isActive
                                    className="cursor-pointer"
                                  >
                                    {courseIntakesPage}
                                  </PaginationLink>
                                </PaginationItem>
                              )}
                            {courseIntakesPage <
                              totalCourseIntakesPages - 2 && (
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() =>
                                    setCourseIntakesPage(courseIntakesPage + 1)
                                  }
                                  className="cursor-pointer"
                                >
                                  {courseIntakesPage + 1}
                                </PaginationLink>
                              </PaginationItem>
                            )}
                            {courseIntakesPage <
                              totalCourseIntakesPages - 2 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() =>
                                  setCourseIntakesPage(totalCourseIntakesPages)
                                }
                                isActive={
                                  courseIntakesPage === totalCourseIntakesPages
                                }
                                className="cursor-pointer"
                              >
                                {totalCourseIntakesPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCourseIntakesPage(
                                Math.min(
                                  totalCourseIntakesPages,
                                  courseIntakesPage + 1,
                                ),
                              )
                            }
                            className={
                              courseIntakesPage === totalCourseIntakesPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}

            {tab === "fees" && (
              <>
                {/* Fees Table */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                          <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Course
                          </th>
                          <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Intake
                          </th>
                          <th className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Registration Fee
                          </th>
                          <th className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Course Fee
                          </th>
                          <th className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Total
                          </th>
                          <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Duration
                          </th>
                          <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50/50">
                        {filteredFees.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-24 text-center">
                              <DollarSign
                                size={48}
                                className="mx-auto text-gray-300 mb-4"
                              />
                              <h3 className="text-xl font-black text-gray-900 mb-2">
                                No Fees Configured
                              </h3>
                              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                                Create fee structures for your course-intakes
                              </p>
                            </td>
                          </tr>
                        ) : (
                          paginatedFees.map((fee) => {
                            const total = fee.registration_fee + fee.course_fee;
                            return (
                              <tr
                                key={fee.id}
                                className="hover:bg-green-50/30 transition-all"
                              >
                                <td className="px-6 py-4">
                                  <div>
                                    <span className="font-black text-green-600 text-sm block">
                                      {
                                        fee.expand?.course_intake?.expand
                                          ?.course?.code
                                      }
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold">
                                      {
                                        fee.expand?.course_intake?.expand
                                          ?.course?.name
                                      }
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge className="bg-indigo-500 text-white">
                                    {
                                      fee.expand?.course_intake?.expand?.intake
                                        ?.code
                                    }
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="font-black text-gray-700 text-sm">
                                    LKR {fee.registration_fee.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="font-black text-gray-700 text-sm">
                                    LKR {fee.course_fee.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="font-black text-green-600 text-sm">
                                    LKR {total.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-sm font-bold text-gray-700">
                                    {fee.duration} months
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingFee(fee);
                                        setFeeForm({
                                          course_intake: fee.course_intake,
                                          registration_fee:
                                            fee.registration_fee,
                                          course_fee: fee.course_fee,
                                          duration: fee.duration,
                                        });
                                        setShowFeeModal(true);
                                      }}
                                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFee(fee.id)}
                                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredFees.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-500 font-medium">
                        Showing{" "}
                        {Math.min(
                          (feesPage - 1) * itemsPerPage + 1,
                          filteredFees.length,
                        )}
                        -
                        {Math.min(feesPage * itemsPerPage, filteredFees.length)}{" "}
                        of {filteredFees.length} results
                      </p>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                setFeesPage(Math.max(1, feesPage - 1))
                              }
                              className={
                                feesPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {totalFeesPages <= 7 ? (
                            Array.from(
                              { length: totalFeesPages },
                              (_, i) => i + 1,
                            ).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setFeesPage(page)}
                                  isActive={feesPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))
                          ) : (
                            <>
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() => setFeesPage(1)}
                                  isActive={feesPage === 1}
                                  className="cursor-pointer"
                                >
                                  1
                                </PaginationLink>
                              </PaginationItem>
                              {feesPage > 3 && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              {feesPage > 2 &&
                                feesPage < totalFeesPages - 1 && (
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() => setFeesPage(feesPage - 1)}
                                      className="cursor-pointer"
                                    >
                                      {feesPage - 1}
                                    </PaginationLink>
                                  </PaginationItem>
                                )}
                              {feesPage !== 1 &&
                                feesPage !== totalFeesPages && (
                                  <PaginationItem>
                                    <PaginationLink
                                      isActive
                                      className="cursor-pointer"
                                    >
                                      {feesPage}
                                    </PaginationLink>
                                  </PaginationItem>
                                )}
                              {feesPage < totalFeesPages - 2 && (
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setFeesPage(feesPage + 1)}
                                    className="cursor-pointer"
                                  >
                                    {feesPage + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              )}
                              {feesPage < totalFeesPages - 2 && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() => setFeesPage(totalFeesPages)}
                                  isActive={feesPage === totalFeesPages}
                                  className="cursor-pointer"
                                >
                                  {totalFeesPages}
                                </PaginationLink>
                              </PaginationItem>
                            </>
                          )}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setFeesPage(
                                  Math.min(totalFeesPages, feesPage + 1),
                                )
                              }
                              className={
                                feesPage === totalFeesPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === "templates" && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Toggle between Course Templates and Subjects */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTemplateType("courses")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        templateType === "courses"
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Course Templates
                    </button>
                    <button
                      onClick={() => setTemplateType("subjects")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        templateType === "subjects"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Subjects
                    </button>
                  </div>
                </div>

                {/* Course Templates Section */}
                {templateType === "courses" && (
                  <>
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-transparent">
                      <h2 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                        <FileText size={18} className="text-purple-600" />
                        Course Templates
                        <Badge className="bg-purple-500 text-white ml-auto">
                          {filteredTemplates.length}
                        </Badge>
                      </h2>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                              Code
                            </th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                              Name
                            </th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                              Description
                            </th>
                            <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredTemplates.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-6 py-16 text-center"
                              >
                                <Search
                                  size={36}
                                  className="mx-auto text-gray-300 mb-3"
                                />
                                <p className="text-gray-400 font-bold text-sm">
                                  No templates found
                                </p>
                              </td>
                            </tr>
                          ) : (
                            paginatedTemplates.map((template) => (
                              <tr
                                key={template.id}
                                className="hover:bg-purple-50/30 transition-all"
                              >
                                <td className="px-6 py-4">
                                  <span className="font-black text-purple-600 text-sm">
                                    {template.course_code || "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-gray-700 text-sm">
                                    {template.course_name}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-gray-500">
                                    {template.course_description
                                      ? template.course_description.length > 60
                                        ? template.course_description.substring(
                                            0,
                                            60,
                                          ) + "..."
                                        : template.course_description
                                      : "No description"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingTemplate(template);
                                        setTemplateForm({
                                          course_code: template.course_code,
                                          course_name: template.course_name,
                                          course_description:
                                            template.course_description || "",
                                        });
                                        setShowTemplateModal(true);
                                      }}
                                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteTemplate(template.id)
                                      }
                                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {filteredTemplates.length > 0 && (
                      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">
                          Showing{" "}
                          {Math.min(
                            (templatesPage - 1) * itemsPerPage + 1,
                            filteredTemplates.length,
                          )}
                          -
                          {Math.min(
                            templatesPage * itemsPerPage,
                            filteredTemplates.length,
                          )}{" "}
                          of {filteredTemplates.length} results
                        </p>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setTemplatesPage(
                                    Math.max(1, templatesPage - 1),
                                  )
                                }
                                className={
                                  templatesPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                            {totalTemplatesPages <= 7 ? (
                              Array.from(
                                { length: totalTemplatesPages },
                                (_, i) => i + 1,
                              ).map((page) => (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    onClick={() => setTemplatesPage(page)}
                                    isActive={templatesPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              ))
                            ) : (
                              <>
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setTemplatesPage(1)}
                                    isActive={templatesPage === 1}
                                    className="cursor-pointer"
                                  >
                                    1
                                  </PaginationLink>
                                </PaginationItem>
                                {templatesPage > 3 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                {templatesPage > 2 &&
                                  templatesPage < totalTemplatesPages - 1 && (
                                    <PaginationItem>
                                      <PaginationLink
                                        onClick={() =>
                                          setTemplatesPage(templatesPage - 1)
                                        }
                                        className="cursor-pointer"
                                      >
                                        {templatesPage - 1}
                                      </PaginationLink>
                                    </PaginationItem>
                                  )}
                                {templatesPage !== 1 &&
                                  templatesPage !== totalTemplatesPages && (
                                    <PaginationItem>
                                      <PaginationLink
                                        isActive
                                        className="cursor-pointer"
                                      >
                                        {templatesPage}
                                      </PaginationLink>
                                    </PaginationItem>
                                  )}
                                {templatesPage < totalTemplatesPages - 2 && (
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() =>
                                        setTemplatesPage(templatesPage + 1)
                                      }
                                      className="cursor-pointer"
                                    >
                                      {templatesPage + 1}
                                    </PaginationLink>
                                  </PaginationItem>
                                )}
                                {templatesPage < totalTemplatesPages - 2 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() =>
                                      setTemplatesPage(totalTemplatesPages)
                                    }
                                    isActive={
                                      templatesPage === totalTemplatesPages
                                    }
                                    className="cursor-pointer"
                                  >
                                    {totalTemplatesPages}
                                  </PaginationLink>
                                </PaginationItem>
                              </>
                            )}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setTemplatesPage(
                                    Math.min(
                                      totalTemplatesPages,
                                      templatesPage + 1,
                                    ),
                                  )
                                }
                                className={
                                  templatesPage === totalTemplatesPages
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}

                {/* Subjects Section */}
                {templateType === "subjects" && (
                  <>
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-transparent">
                      <h2 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-600" />
                        Subjects
                        <Badge className="bg-blue-500 text-white ml-auto">
                          {filteredSubjects.length}
                        </Badge>
                      </h2>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                              Code
                            </th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                              Name
                            </th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                              Description
                            </th>
                            <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredSubjects.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-6 py-16 text-center"
                              >
                                <Search
                                  size={36}
                                  className="mx-auto text-gray-300 mb-3"
                                />
                                <p className="text-gray-400 font-bold text-sm">
                                  No subjects found
                                </p>
                              </td>
                            </tr>
                          ) : (
                            paginatedSubjects.map((subject) => (
                              <tr
                                key={subject.id}
                                className="hover:bg-blue-50/30 transition-all"
                              >
                                <td className="px-6 py-4">
                                  <span className="font-black text-blue-600 text-sm">
                                    {subject.code || "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-gray-700 text-sm">
                                    {subject.name}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-gray-500">
                                    {subject.description
                                      ? subject.description.length > 60
                                        ? subject.description.substring(0, 60) +
                                          "..."
                                        : subject.description
                                      : "No description"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingSubject(subject);
                                        setSubjectForm({
                                          code: subject.code,
                                          name: subject.name,
                                          description:
                                            subject.description || "",
                                        });
                                        setShowSubjectModal(true);
                                      }}
                                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteSubject(subject.id)
                                      }
                                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {filteredSubjects.length > 0 && (
                      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">
                          Showing{" "}
                          {Math.min(
                            (subjectsPage - 1) * itemsPerPage + 1,
                            filteredSubjects.length,
                          )}
                          -
                          {Math.min(
                            subjectsPage * itemsPerPage,
                            filteredSubjects.length,
                          )}{" "}
                          of {filteredSubjects.length} results
                        </p>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setSubjectsPage(Math.max(1, subjectsPage - 1))
                                }
                                className={
                                  subjectsPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                            {totalSubjectsPages <= 7 ? (
                              Array.from(
                                { length: totalSubjectsPages },
                                (_, i) => i + 1,
                              ).map((page) => (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    onClick={() => setSubjectsPage(page)}
                                    isActive={subjectsPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              ))
                            ) : (
                              <>
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setSubjectsPage(1)}
                                    isActive={subjectsPage === 1}
                                    className="cursor-pointer"
                                  >
                                    1
                                  </PaginationLink>
                                </PaginationItem>
                                {subjectsPage > 3 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                {subjectsPage > 2 &&
                                  subjectsPage < totalSubjectsPages - 1 && (
                                    <PaginationItem>
                                      <PaginationLink
                                        onClick={() =>
                                          setSubjectsPage(subjectsPage - 1)
                                        }
                                        className="cursor-pointer"
                                      >
                                        {subjectsPage - 1}
                                      </PaginationLink>
                                    </PaginationItem>
                                  )}
                                {subjectsPage !== 1 &&
                                  subjectsPage !== totalSubjectsPages && (
                                    <PaginationItem>
                                      <PaginationLink
                                        isActive
                                        className="cursor-pointer"
                                      >
                                        {subjectsPage}
                                      </PaginationLink>
                                    </PaginationItem>
                                  )}
                                {subjectsPage < totalSubjectsPages - 2 && (
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() =>
                                        setSubjectsPage(subjectsPage + 1)
                                      }
                                      className="cursor-pointer"
                                    >
                                      {subjectsPage + 1}
                                    </PaginationLink>
                                  </PaginationItem>
                                )}
                                {subjectsPage < totalSubjectsPages - 2 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() =>
                                      setSubjectsPage(totalSubjectsPages)
                                    }
                                    isActive={
                                      subjectsPage === totalSubjectsPages
                                    }
                                    className="cursor-pointer"
                                  >
                                    {totalSubjectsPages}
                                  </PaginationLink>
                                </PaginationItem>
                              </>
                            )}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setSubjectsPage(
                                    Math.min(
                                      totalSubjectsPages,
                                      subjectsPage + 1,
                                    ),
                                  )
                                }
                                className={
                                  subjectsPage === totalSubjectsPages
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Modals */}
            {/* Course Modal */}
            <ModernModal
              open={showCourseModal}
              onOpenChange={setShowCourseModal}
              title={
                editingCourse ? "Edit Course" : "Create Course from Template"
              }
              subtitle={
                editingCourse
                  ? "Update course information"
                  : "Select a template and customize"
              }
              avatarChar={editingCourse ? "E" : "+"}
              avatarColor={editingCourse ? "bg-blue-600" : "bg-green-600"}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingCourse) {
                    void handleUpdateCourse();
                  } else {
                    void handleCreateCourse();
                  }
                }}
                className="space-y-6"
              >
                {!editingCourse && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Select Template *
                    </label>
                    <select
                      value={courseForm.template}
                      onChange={(e) => {
                        const template = courseTemplates.find(
                          (t) => t.id === e.target.value,
                        );
                        if (template) {
                          const generatedCode = template.course_code
                            ? generateCourseCodeWithDate(template.course_code)
                            : generateCourseCode(template.course_name);
                          setCourseForm({
                            template: e.target.value,
                            code: generatedCode,
                            name: template.course_name,
                          });
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                      required
                    >
                      <option value="">-- Select Template --</option>
                      {courseTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.course_code
                            ? `[${template.course_code}] `
                            : ""}
                          {template.course_name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Choose from predefined course templates
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    value={courseForm.code}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, code: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold uppercase"
                    placeholder="e.g., CS101"
                    required
                    readOnly={!!editingCourse}
                  />
                  {!editingCourse && (
                    <p className="text-xs text-gray-400 mt-1">
                      Auto-generated, but you can edit
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    value={courseForm.name}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                    placeholder="e.g., Introduction to Programming"
                    required
                    readOnly={!editingCourse}
                  />
                  {!editingCourse && (
                    <p className="text-xs text-gray-400 mt-1">
                      From selected template
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCourseModal(false);
                      setEditingCourse(null);
                      setCourseForm({ template: "", code: "", name: "" });
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-black text-sm uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                  >
                    {editingCourse ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </ModernModal>

            {/* Subject Modal */}
            <ModernModal
              open={showSubjectModal}
              onOpenChange={setShowSubjectModal}
              title={editingSubject ? "Edit Subject" : "Create New Subject"}
              subtitle="Manage subject information"
              avatarChar={editingSubject ? "E" : "+"}
              avatarColor={editingSubject ? "bg-blue-600" : "bg-blue-600"}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingSubject) {
                    void handleUpdateSubject();
                  } else {
                    void handleCreateSubject();
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, code: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold uppercase"
                    placeholder="e.g., MATH101"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={subjectForm.name}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    placeholder="e.g., Calculus I"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={subjectForm.description}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold resize-none"
                    placeholder="Brief description of the subject..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubjectModal(false);
                      setEditingSubject(null);
                      setSubjectForm({ code: "", name: "", description: "" });
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    {editingSubject ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </ModernModal>

            {/* Course-Intake Modal - Two Step */}
            <ModernModal
              open={showCourseIntakeModal}
              onOpenChange={(open) => {
                if (!open) resetCourseIntakeModal();
              }}
              title={
                editingCourseIntake
                  ? "Edit Course-Intake"
                  : "Create Course-Intake"
              }
              subtitle={
                courseIntakeStep === 1
                  ? "Step 1: Basic Information"
                  : "Step 2: Assign Subjects"
              }
              avatarChar={editingCourseIntake ? "E" : "+"}
              avatarColor="bg-green-600"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingCourseIntake) {
                    void handleUpdateCourseIntake();
                  } else {
                    void handleCreateCourseIntake();
                  }
                }}
                className="space-y-6"
              >
                {/* Progress Dots */}
                <div className="flex items-center justify-center gap-2 pb-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      courseIntakeStep === 1 ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                  <div
                    className={`w-3 h-3 rounded-full ${
                      courseIntakeStep === 2 ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                </div>

                {courseIntakeStep === 1 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Course
                        </label>
                        <select
                          value={courseIntakeForm.course}
                          onChange={(e) =>
                            setCourseIntakeForm({
                              ...courseIntakeForm,
                              course: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                          required
                          disabled={!!editingCourseIntake}
                        >
                          <option value="">Select Course</option>
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.code} - {course.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Intake
                        </label>
                        <select
                          value={courseIntakeForm.intake}
                          onChange={(e) =>
                            setCourseIntakeForm({
                              ...courseIntakeForm,
                              intake: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                          required
                          disabled={!!editingCourseIntake}
                        >
                          <option value="">Select Intake</option>
                          {intakes.map((intake) => (
                            <option key={intake.id} value={intake.id}>
                              {intake.code}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={courseIntakeForm.start_date}
                          onChange={(e) =>
                            setCourseIntakeForm({
                              ...courseIntakeForm,
                              start_date: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={courseIntakeForm.end_date}
                          onChange={(e) =>
                            setCourseIntakeForm({
                              ...courseIntakeForm,
                              end_date: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Course Status
                      </label>
                      <select
                        value={courseIntakeForm.course_status}
                        onChange={(e) =>
                          setCourseIntakeForm({
                            ...courseIntakeForm,
                            course_status: e.target.value as "ongoing" | "completed" | "upcoming",
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                        required
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <input
                        type="checkbox"
                        id="is_semester_based"
                        checked={courseIntakeForm.is_semester_based}
                        onChange={(e) =>
                          setCourseIntakeForm({
                            ...courseIntakeForm,
                            is_semester_based: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <label
                        htmlFor="is_semester_based"
                        className="text-sm font-bold text-gray-700 cursor-pointer"
                      >
                        Semester-Based Course
                      </label>
                    </div>

                    {courseIntakeForm.is_semester_based && (
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Number of Semesters
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="4"
                          value={courseIntakeForm.semester_count}
                          onChange={(e) =>
                            setCourseIntakeForm({
                              ...courseIntakeForm,
                              semester_count: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                          required
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Select Subjects
                      </label>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {subjects.map((subject) => {
                          const isSelected = selectedSubjects.some(
                            (s) => s.subject === subject.id,
                          );
                          const selectedSubject = selectedSubjects.find(
                            (s) => s.subject === subject.id,
                          );

                          return (
                            <div
                              key={subject.id}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                              <input
                                type="checkbox"
                                id={`subject-${subject.id}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubjects([
                                      ...selectedSubjects,
                                      { subject: subject.id, credits: 3 },
                                    ]);
                                  } else {
                                    setSelectedSubjects(
                                      selectedSubjects.filter(
                                        (s) => s.subject !== subject.id,
                                      ),
                                    );
                                  }
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <label
                                htmlFor={`subject-${subject.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <span className="font-black text-purple-600 text-sm">
                                  {subject.code}
                                </span>
                                <span className="text-gray-600 text-sm ml-2">
                                  {subject.name}
                                </span>
                              </label>
                              {isSelected && (
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={selectedSubject?.credits || 3}
                                  onChange={(e) => {
                                    const newCredits = parseInt(e.target.value);
                                    setSelectedSubjects(
                                      selectedSubjects.map((s) =>
                                        s.subject === subject.id
                                          ? { ...s, credits: newCredits }
                                          : s,
                                      ),
                                    );
                                  }}
                                  className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold text-sm"
                                  placeholder="Credits"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  {courseIntakeStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setCourseIntakeStep(1)}
                      className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => resetCourseIntakeModal()}
                    className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-black text-sm uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                  >
                    {courseIntakeStep === 1
                      ? "Next"
                      : editingCourseIntake
                        ? "Update"
                        : "Create"}
                  </button>
                </div>
              </form>
            </ModernModal>

            {/* Fee Modal */}
            <ModernModal
              open={showFeeModal}
              onOpenChange={setShowFeeModal}
              title={editingFee ? "Edit Fee Structure" : "Create Fee Structure"}
              subtitle="Configure course-intake fees"
              avatarChar={editingFee ? "E" : "+"}
              avatarColor="bg-green-600"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingFee) {
                    void handleUpdateFee();
                  } else {
                    void handleCreateFee();
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Course-Intake
                  </label>
                  <select
                    value={feeForm.course_intake}
                    onChange={(e) =>
                      setFeeForm({ ...feeForm, course_intake: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                    required
                    disabled={!!editingFee}
                  >
                    <option value="">Select Course-Intake</option>
                    {courseIntakesWithoutFees.map((ci) => (
                      <option key={ci.id} value={ci.id}>
                        {ci.expand?.course?.code} - {ci.expand?.intake?.code}
                      </option>
                    ))}
                    {editingFee && (
                      <option value={editingFee.course_intake}>
                        {editingFee.expand?.course_intake?.expand?.course?.code}{" "}
                        -{" "}
                        {editingFee.expand?.course_intake?.expand?.intake?.code}
                      </option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Registration Fee (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={feeForm.registration_fee}
                      onChange={(e) =>
                        setFeeForm({
                          ...feeForm,
                          registration_fee: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Course Fee (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={feeForm.course_fee}
                      onChange={(e) =>
                        setFeeForm({
                          ...feeForm,
                          course_fee: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={feeForm.duration}
                    onChange={(e) =>
                      setFeeForm({
                        ...feeForm,
                        duration: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                    placeholder="6"
                    required
                  />
                </div>

                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                      Total Fee:
                    </span>
                    <span className="text-2xl font-black text-green-600">
                      LKR{" "}
                      {(
                        feeForm.registration_fee + feeForm.course_fee
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeeModal(false);
                      setEditingFee(null);
                      setFeeForm({
                        course_intake: "",
                        registration_fee: 0,
                        course_fee: 0,
                        duration: 0,
                      });
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-black text-sm uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                  >
                    {editingFee ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </ModernModal>

            {/* Template Modal */}
            <ModernModal
              open={showTemplateModal}
              onOpenChange={setShowTemplateModal}
              title={
                editingTemplate ? "Edit Template" : "Create Course Template"
              }
              subtitle="Define a reusable course template"
              avatarChar={editingTemplate ? "E" : "+"}
              avatarColor={editingTemplate ? "bg-blue-600" : "bg-purple-600"}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingTemplate) {
                    void handleUpdateTemplate();
                  } else {
                    void handleCreateTemplate();
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Suggested Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={templateForm.course_code}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        course_code: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-bold uppercase"
                    placeholder="e.g., CS, IT, MATH"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Prefix or full code suggestion
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    value={templateForm.course_name}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        course_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-bold"
                    placeholder="e.g., Introduction to Programming"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={templateForm.course_description}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        course_description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium resize-none"
                    rows={4}
                    placeholder="Course overview or learning objectives..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateModal(false);
                      setEditingTemplate(null);
                      setTemplateForm({
                        course_code: "",
                        course_name: "",
                        course_description: "",
                      });
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black text-sm uppercase tracking-widest hover:shadow-lg transition-all"
                  >
                    {editingTemplate ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </ModernModal>
          </>
        )}
      </div>
    </div>
</div>
  );
}
