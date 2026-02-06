"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pb, { getCurrentUser, logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react";

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

  useEffect(() => {
    // Authentication disabled for UI development
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [assignmentsData, submissionsData] = await Promise.all([
        pb.collection("assignments").getFullList({
          expand: "course_subject,marker",
          sort: "-created",
        }),
        pb.collection("assignment_submissions").getFullList({
          expand: "student,assignment",
          sort: "-created",
        }),
      ]);

      setAssignments(assignmentsData as any);
      setSubmissions(submissionsData as any);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getSubmissionStats = () => {
    const pending = submissions.filter(
      (s) => s.evaluation_status === "pending",
    ).length;
    const marked = submissions.filter(
      (s) => s.evaluation_status === "marked",
    ).length;
    const onTime = submissions.filter(
      (s) => s.submission_status === "on-time",
    ).length;
    const late = submissions.filter(
      (s) => s.submission_status === "due-passed",
    ).length;

    return { pending, marked, onTime, late };
  };

  const stats = getSubmissionStats();

  const filteredSubmissions = submissions.filter((submission) => {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminSidebar activeTab="assignments" onLogout={handleLogout} />
      <div className="bg-gray-50 min-h-screen lg:ml-64">
        <main className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Assignment Management
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor all assignments and submissions
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileText className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.pending}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Clock className="text-orange-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Marked</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.marked}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Late Submissions</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.late}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "pending"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setFilter("marked")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "marked"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Marked ({stats.marked})
              </button>
              <button
                onClick={() => setFilter("late")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "late"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Late ({stats.late})
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {submission.expand?.student?.name
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {submission.expand?.student?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.expand?.student?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {submission.expand?.assignment?.title ||
                            "Assignment #" + submission.assignment.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.submitted_at
                          ? new Date(
                              submission.submitted_at,
                            ).toLocaleDateString()
                          : "Not submitted"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            submission.evaluation_status === "marked"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {submission.evaluation_status}
                        </span>
                        {submission.submission_status === "due-passed" && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Late
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.grade ? (
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {submission.grade}
                            </span>
                            {submission.mark && (
                              <span className="text-gray-500 ml-1">
                                ({submission.mark}%)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Not graded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye size={18} />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No submissions found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
