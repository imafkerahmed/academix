"use client";

import { useEffect, useState } from "react";
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
  Layers,
  Search,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  issued_at: string;
  open_after_due: boolean;
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
}

export default function AssignmentManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const assignmentsPromise = pb
        .collection("assignments")
        .getFullList({
          expand: "course_subject,marker",
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
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const stats = {
    total: assignments.length,
    pending: submissions.filter((s) => s.evaluation_status === "pending")
      .length,
    marked: submissions.filter((s) => s.evaluation_status === "marked").length,
    late: submissions.filter((s) => s.submission_status === "due-passed")
      .length,
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const studentName = submission.expand?.student?.name || "";
    const assignmentTitle = submission.expand?.assignment?.title || "";
    const matchesSearch =
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "pending") return submission.evaluation_status === "pending";
    if (filter === "marked") return submission.evaluation_status === "marked";
    if (filter === "late") return submission.submission_status === "due-passed";
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
    <div className="bg-gray-50 min-h-screen lg:ml-64 font-sans">
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
                <Layers size={14} className="text-indigo-400" />
                Grading & Submission Analytics
              </p>
            </div>
          </div>
          <button className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 uppercase">
            <Plus size={18} />
            CREATE ASSIGNMENT
          </button>
        </div>

        {/* Stats Carousel */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <StatsCarousel
            stats={[
              {
                title: "Active Assignments",
                value: stats.total,
                icon: FileText,
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                title: "Pending Review",
                value: stats.pending,
                icon: Clock,
                bgColor: "bg-orange-50",
                iconColor: "text-orange-600",
              },
              {
                title: "Graded",
                value: stats.marked,
                icon: CheckCircle,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Late Entry",
                value: stats.late,
                icon: AlertCircle,
                bgColor: "bg-red-50",
                iconColor: "text-red-600",
              },
            ]}
          />
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search students or titles..."
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

        {/* Submissions Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000 group">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Student Identity
                  </th>
                  <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Target Assignment
                  </th>
                  <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Timestamps
                  </th>
                  <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Verification status
                  </th>
                  <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Academic Score
                  </th>
                  <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Controls
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="group/row hover:bg-indigo-50/30 transition-all duration-300"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all duration-300">
                          {submission.expand?.student?.name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 group-hover/row:text-indigo-600 transition-colors uppercase tracking-tight">
                            {submission.expand?.student?.name}
                          </span>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                            {submission.expand?.student?.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover/row:text-indigo-600 transition-all">
                          {submission.expand?.assignment?.title ||
                            "Unknown Assignment"}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <BookOpen size={10} className="text-indigo-400" />
                          {submission.expand?.assignment?.expand?.course_subject
                            ?.name || "CORE SUBJECT"}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-gray-900">
                          {submission.submitted_at
                            ? new Date(
                                submission.submitted_at,
                              ).toLocaleDateString("en-GB")
                            : "N/A"}
                        </span>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                          Date Submitted
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-none shadow-sm ${
                            submission.evaluation_status === "marked"
                              ? "bg-green-500 text-white"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {submission.evaluation_status}
                        </Badge>
                        {submission.submission_status === "due-passed" && (
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">
                            Entry: Latent
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      {submission.grade ? (
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-gray-900 leading-none">
                            {submission.grade}
                          </span>
                          <span className="text-[10px] font-black text-indigo-500 tracking-widest">
                            {submission.mark}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
                          In Evaluation
                        </span>
                      )}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-end gap-2 pr-2 opacity-40 group-hover/row:opacity-100 transition-opacity">
                        <button className="p-3 bg-white border border-gray-100 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                          <Eye size={16} />
                        </button>
                        <button className="p-3 bg-white border border-gray-100 rounded-xl text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm">
                          <Download size={16} />
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
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                No submissions recorded
              </h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
                Adjust filters or refine your search query
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
