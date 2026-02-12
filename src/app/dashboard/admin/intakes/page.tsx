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
  ChevronRight,
  Search,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";
import { useRouter } from "next/navigation";
import { ModernModal } from "@/components/ui/modern-modal";
import { Badge } from "@/components/ui/badge";

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
    .filter((intake) => {
      const status = getStatus(intake);
      if (tab === "active") return status === "active" || status === "upcoming";
      return status === "completed";
    });

  function handleCreateIntake(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
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
    <div className="bg-gray-50 min-h-screen lg:ml-64 font-sans">
      <AdminSidebar
        activeTab="intakes"
        onLogout={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-500"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">
            Academix
          </h1>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Calendar size={20} />
          </div>
        </div>

        {/* Page Header Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
              <Layers size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Intake <span className="text-indigo-600">Management</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-400" />
                Academic Term & Lifecycle Management
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 uppercase"
          >
            <Plus size={18} />
            CREATE NEW INTAKE
          </button>
        </div>

        {/* Stats Section */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                title: "Active Courses",
                value: courses.length,
                icon: BookOpen,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Active Enrollments",
                value: courseIntakes.length,
                icon: Layers,
                bgColor: "bg-purple-50",
                iconColor: "text-purple-600",
              },
              {
                title: "System Uptime",
                value: "99.9%",
                icon: Layers,
                bgColor: "bg-indigo-50",
                iconColor: "text-indigo-600",
              },
            ]}
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search intakes by code..."
            action={
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: "active", label: "ACTIVE & UPCOMING" },
                  { id: "completed", label: "HISTORICAL ARCHIVE" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id as any)}
                    className={`px-8 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${
                      tab === t.id
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

        {/* Intakes Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000 group">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Intake Identity
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Term Duration
                  </th>
                  <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Operational status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {filteredIntakes.map((intake) => {
                  const status = getStatus(intake);
                  return (
                    <tr
                      key={intake.id}
                      className="group/row hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/admin/intakes/${intake.id}`)
                      }
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all">
                            <Layers size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 group-hover/row:text-indigo-600 transition-colors uppercase tracking-tight">
                              {intake.code}
                            </span>
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                              INTAKE-ARCH-ID: {intake.id.padStart(3, "0")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-xs font-bold text-gray-900">
                            {new Date(intake.start_date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                            <ArrowRight
                              size={10}
                              className="mx-2 text-indigo-400"
                            />
                            {new Date(intake.end_date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">
                            Academic Cycle
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <Badge
                          className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-none shadow-sm ${
                            status === "active"
                              ? "bg-green-500 text-white"
                              : status === "upcoming"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-400 text-white"
                          }`}
                        >
                          {status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredIntakes.length === 0 && (
            <div className="text-center py-24 bg-gray-50/30">
              <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300 mx-auto mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                No cycles found
              </h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
                Adjust time filters or clear search query
              </p>
            </div>
          )}
        </div>
      </main>

      <ModernModal
        open={showModal}
        onOpenChange={setShowModal}
        title="Create New Intake"
        subtitle="Define the schedule for a new academic intake."
        avatarChar="+"
        avatarColor="bg-indigo-600"
      >
        <form onSubmit={handleCreateIntake} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Intake Code
              </label>
              <input
                type="text"
                placeholder="e.g. JAN2026"
                value={newIntake.code}
                onChange={(e) =>
                  setNewIntake({ ...newIntake, code: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newIntake.start_date}
                  onChange={(e) =>
                    setNewIntake({ ...newIntake, start_date: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newIntake.end_date}
                  onChange={(e) =>
                    setNewIntake({ ...newIntake, end_date: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest"
            >
              CREATE INTAKE
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2 rounded-xl font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
            >
              CANCEL
            </button>
          </div>
        </form>
      </ModernModal>
    </div>
  );
}
