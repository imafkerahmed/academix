"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Plus,
  Calendar,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  Layers,
  Menu,
} from "lucide-react";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";
import { useRouter } from "next/navigation";

const mockIntakes = [
  {
    id: "1",
    code: "JAN2026",
    start_date: "2026-01-01",
    end_date: "2026-06-30",
    created: "2025-12-01",
  },
  {
    id: "2",
    code: "JUL2025",
    start_date: "2025-07-01",
    end_date: "2025-12-31",
    created: "2025-06-01",
  },
  {
    id: "3",
    code: "JAN2025",
    start_date: "2025-01-01",
    end_date: "2025-06-30",
    created: "2024-12-01",
  },
  {
    id: "4",
    code: "JUL2026",
    start_date: "2026-07-01",
    end_date: "2026-12-31",
    created: "2026-06-01",
  },
];

const mockCourses = [
  { id: "c1", name: "Mathematics", code: "MATH101", created: "2025-01-01" },
  { id: "c2", name: "Physics", code: "PHYS101", created: "2025-01-01" },
];

const mockCourseIntakes = [
  {
    id: "ci1",
    course: "c1",
    intake: "1",
    start_date: "2026-01-01",
    end_date: "2026-06-30",
  },
  {
    id: "ci2",
    course: "c2",
    intake: "2",
    start_date: "2025-07-01",
    end_date: "2025-12-31",
  },
];

export default function IntakeCourseManagement() {
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newIntake, setNewIntake] = useState({
    code: "",
    start_date: "",
    end_date: "",
  });

  // Use mock data directly
  const intakes = mockIntakes;
  const courses = mockCourses;
  const courseIntakes = mockCourseIntakes;

  // Helper to determine status
  const getStatus = (intake: {
    id?: string;
    code?: string;
    start_date: any;
    end_date: any;
    created?: string;
  }) => {
    const today = new Date();
    const startDate = new Date(intake.start_date);
    const endDate = new Date(intake.end_date);
    if (today < startDate) return "upcoming";
    if (today > endDate) return "completed";
    return "active";
  };

  // Filter intakes by tab and search
  const filteredIntakes = intakes
    .filter((intake) =>
      intake.code.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((intake) => getStatus(intake) === tab);

  function handleCreateIntake(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    // Add new intake to mockIntakes (for demo, just update state)
    mockIntakes.push({
      id: (mockIntakes.length + 1).toString(),
      code: newIntake.code,
      start_date: newIntake.start_date,
      end_date: newIntake.end_date,
      created: new Date().toISOString().split("T")[0],
    });
    setShowModal(false);
    setNewIntake({ code: "", start_date: "", end_date: "" });
  }
  const router = useRouter();

  return (
    <>
      <AdminSidebar
        activeTab="intakes"
        onLogout={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="bg-gray-50 min-h-screen lg:ml-64">
        <main className="p-4 md:p-6 lg:p-8">
          {/* Header */}
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Intake & Course Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage academic intakes and course offerings
            </p>
          </div>
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
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search intakes by code..."
            action={
              <button
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => setShowModal(true)}
              >
                <Plus size={20} />
                Create New Intake
              </button>
            }
          />
          <div className="mb-6 flex gap-2">
            <button
              className={`px-4 py-2 rounded ${tab === "active" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              onClick={() => setTab("active")}
            >
              Active
            </button>
            <button
              className={`px-4 py-2 rounded ${tab === "completed" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              onClick={() => setTab("completed")}
            >
              Completed
            </button>
          </div>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredIntakes.map((intake) => {
                      const status = getStatus(intake);
                      return (
                        <tr
                          key={intake.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard/admin/intakes/${intake.id}`)
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {intake.code}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(intake.start_date)
                              .toISOString()
                              .slice(0, 10)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(intake.end_date)
                              .toISOString()
                              .slice(0, 10)}
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredIntakes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No intakes found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Intake</h2>
            <form onSubmit={handleCreateIntake} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Intake Code
                </label>
                <input
                  type="text"
                  value={newIntake.code}
                  onChange={(e) =>
                    setNewIntake({ ...newIntake, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newIntake.start_date}
                  onChange={(e) =>
                    setNewIntake({ ...newIntake, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newIntake.end_date}
                  onChange={(e) =>
                    setNewIntake({ ...newIntake, end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 text-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
