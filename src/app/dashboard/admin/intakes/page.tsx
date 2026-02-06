"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pb, { getCurrentUser, logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Plus,
  Calendar,
  BookOpen,
  Users,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

interface Intake {
  id: string;
  code: string;
  start_date: string;
  end_date: string;
  created: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  created: string;
}

interface CourseIntake {
  id: string;
  course: string;
  intake: string;
  start_date: string;
  end_date: string;
  expand?: {
    course?: Course;
    intake?: Intake;
  };
}

export default function IntakeCourseManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"intakes" | "courses">("intakes");
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseIntakes, setCourseIntakes] = useState<CourseIntake[]>([]);

  useEffect(() => {
    // Authentication disabled for UI development
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [intakesData, coursesData, courseIntakesData] = await Promise.all([
        pb.collection("intakes").getFullList({ sort: "-created" }),
        pb.collection("courses").getFullList({ sort: "-created" }),
        pb.collection("course_intakes").getFullList({
          expand: "course,intake",
          sort: "-created",
        }),
      ]);

      setIntakes(intakesData as any);
      setCourses(coursesData as any);
      setCourseIntakes(courseIntakesData as any);
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

  const handleDeleteIntake = async (id: string) => {
    if (confirm("Are you sure you want to delete this intake?")) {
      try {
        await pb.collection("intakes").delete(id);
        setIntakes(intakes.filter((i) => i.id !== id));
      } catch (error) {
        console.error("Error deleting intake:", error);
        alert("Failed to delete intake");
      }
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      try {
        await pb.collection("courses").delete(id);
        setCourses(courses.filter((c) => c.id !== id));
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Failed to delete course");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminSidebar activeTab="intakes" onLogout={handleLogout} />
      <div className="bg-gray-50 min-h-screen lg:ml-64">
        <main className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Intake & Course Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage academic intakes and course offerings
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("intakes")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "intakes"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={20} />
                  Intakes ({intakes.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("courses")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "courses"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={20} />
                  Courses ({courses.length})
                </div>
              </button>
            </nav>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Intakes</p>
              <p className="text-2xl font-bold text-gray-900">
                {intakes.length}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-green-600">
                {courses.length}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Active Course-Intakes</p>
              <p className="text-2xl font-bold text-blue-600">
                {courseIntakes.length}
              </p>
            </div>
          </div>

          {/* Intakes Tab Content */}
          {activeTab === "intakes" && (
            <div className="space-y-4">
              {/* Add Button */}
              <div className="flex justify-end">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Plus size={20} />
                  Create New Intake
                </button>
              </div>

              {/* Intakes List */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Intake Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {intakes.map((intake) => {
                        const today = new Date();
                        const startDate = new Date(intake.start_date);
                        const endDate = new Date(intake.end_date);
                        const status =
                          today < startDate
                            ? "upcoming"
                            : today > endDate
                              ? "completed"
                              : "active";

                        return (
                          <tr key={intake.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {intake.code}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(intake.start_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(intake.end_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : status === "upcoming"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  <Eye size={18} />
                                </button>
                                <button className="text-green-600 hover:text-green-900">
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteIntake(intake.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {intakes.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No intakes found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Courses Tab Content */}
          {activeTab === "courses" && (
            <div className="space-y-4">
              {/* Add Button */}
              <div className="flex justify-end">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Plus size={20} />
                  Create New Course
                </button>
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-500">{course.code}</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <BookOpen className="text-blue-600" size={20} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(course.created).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {courses.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 text-center py-12">
                  <p className="text-gray-500">No courses found</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
