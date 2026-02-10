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
  Menu,
  Check,
  Layers,
} from "lucide-react";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";

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
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courseIntakes, setCourseIntakes] = useState<CourseIntake[]>([]);

  useEffect(() => {
    // Authentication disabled for UI development
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const intakesPromise = pb
        .collection("intakes")
        .getFullList({
          sort: "-start_date",
        })
        .catch(() => []);

      const coursesPromise = pb
        .collection("courses")
        .getFullList({
          sort: "name",
        })
        .catch(() => []);

      const courseIntakesPromise = pb
        .collection("course_intake")
        .getFullList({
          expand: "course,intake",
        })
        .catch(() => []);

      const [intakesData, coursesData, courseIntakesData] = await Promise.all([
        intakesPromise,
        coursesPromise,
        courseIntakesPromise,
      ]);

      setIntakes((intakesData as any) || []);
      setCourses((coursesData as any) || []);
      setCourseIntakes((courseIntakesData as any) || []);
      setLoading(false);
    } catch (error) {
      setIntakes([]);
      setCourses([]);
      setCourseIntakes([]);
      setLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredIntakes = intakes.filter((intake) =>
    intake.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
      <AdminSidebar
        activeTab="intakes"
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="bg-gray-50 min-h-screen lg:ml-64">
        <main className="p-4 md:p-6 lg:p-8">
          {/* Mobile header with hamburger */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide text-center flex-1">
                ACADEMIX
              </h1>
              <div className="w-10" aria-hidden="true" />
            </div>
          </div>
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

          {/* Stats */}
          {/* Stats Carousel */}
          <StatsCarousel
            stats={[
              {
                title: "Total Intakes",
                value: intakes.length,
                icon: Calendar,
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                title: "Total Courses",
                value: courses.length,
                icon: BookOpen,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Active Course-Intakes",
                value: courseIntakes.length,
                icon: Layers,
                bgColor: "bg-purple-50",
                iconColor: "text-purple-600",
              },
            ]}
          />

          {/* Intakes Tab Content */}
          {/* Actions Bar */}
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search intakes by code..."
            action={
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Plus size={20} />
                Create New Intake
              </button>
            }
          />

          {/* Intakes List */}
          <div className="space-y-4">
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
                    {filteredIntakes.map((intake) => {
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
        </main>
      </div>
    </>
  );
}
