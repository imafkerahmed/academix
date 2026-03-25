"use client";

import { useState, useEffect, useCallback } from "react";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  BookOpen,
  Layers,
  Search,
  ArrowRight,
} from "lucide-react";
import { StatsCarousel } from "@/components/dashboard/shared/stats/StatsCarousel";
import { DashboardActionBar } from "@/components/dashboard/shared/DashboardActionBar";
import { useRouter } from "next/navigation";
import { ModernModal } from "@/components/ui/modern-modal";
import { Badge } from "@/components/ui/badge";
import { DashboardLoader } from "@/components/dashboard/shared/DashboardLoader";

interface Intake {
  id: string;
  code: string;
  start_date: string;
  end_date: string;
  intakeStatus: string;
  created: string;
}

// Stat type is only used for type checking in this file; the actual icon prop in stats array is a string for dynamic rendering in StatsCarousel.


export default function IntakeCourseManagement() {
  const [tab, setTab] = useState<"active" | "completed" | "disabled">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [coursesCount, setCoursesCount] = useState(0);
  const [enrollmentsCount, setEnrollmentsCount] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newIntake, setNewIntake] = useState({
    code: "",
    start_date: "",
    end_date: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [intakeRecords, courseRecords, enrollmentRecords] = await Promise.all([
        pb.collection("intakes").getFullList<Intake>({ sort: "-created" }),
        pb.collection("courses").getList(1, 1),
        pb.collection("enrollments").getList(1, 1),
      ]);
      setIntakes(intakeRecords);
      setCoursesCount(courseRecords.totalItems);
      setEnrollmentsCount(enrollmentRecords.totalItems);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Filter intakes by tab and search
  const filteredIntakes = intakes
    .filter((intake) =>
      intake.code.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((intake) => {
      const status = intake.intakeStatus;
      if (tab === "active") {
        // Show ongoing and pending intakes in active tab
        return status === "ongoing" || status === "pending" || !status;
      }
      if (tab === "completed") {
        // Show only completed intakes
        return status === "completed";
      }
      // Show only disabled intakes
      return status === "disabled";
    });

  function handleCreateIntake(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createIntake();
  }

  async function createIntake() {
    try {
      // Calculate status automatically based on dates
      const today = new Date();
      const startDate = new Date(newIntake.start_date);
      const endDate = new Date(newIntake.end_date);

      let calculatedStatus = "ongoing";
      if (today < startDate) calculatedStatus = "pending";
      else if (today > endDate) calculatedStatus = "completed";

      const data = {
        code: newIntake.code,
        start_date: newIntake.start_date,
        end_date: newIntake.end_date,
        intakeStatus: calculatedStatus,
      };

      await pb.collection("intakes").create(data);
      toast.success("Intake created successfully!");
      setShowModal(false);
      setNewIntake({
        code: "",
        start_date: "",
        end_date: "",
      });

      // Refresh the list
      void fetchData();
    } catch (error: unknown) {
      console.error("Error creating intake:", error);
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to create intake");
    }
  }
  const router = useRouter();

  return (
    <div className="space-y-8">
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
                Academic Intake and Course Management
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
                value: coursesCount,
                icon: BookOpen,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Total Enrollments",
                value: enrollmentsCount,
                icon: Layers,
                bgColor: "bg-purple-50",
                iconColor: "text-purple-600",
              },
              {
                title: "Academic Period",
                value: new Date().getFullYear(),
                icon: Layers,
                bgColor: "bg-indigo-50",
                iconColor: "text-indigo-600",
              },
            ]}
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <DashboardActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search intakes by code..."
            action={
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: "active", label: "ACTIVE" },
                  { id: "completed", label: "COMPLETED" },
                  { id: "disabled", label: "DISABLED" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id as "active" | "completed" | "disabled")}
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
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-20">
                      <DashboardLoader inline={true} message="Loading intakes..." />
                    </td>
                  </tr>
                ) : filteredIntakes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-24 bg-gray-50/30">
                      <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300 mx-auto mb-6">
                        <Search size={40} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                        No cycles found
                      </h3>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
                        {intakes.length === 0
                          ? "Create your first intake to get started"
                          : "Adjust time filters or clear search query"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredIntakes.map((intake) => {
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
                              intake.intakeStatus === "disabled"
                                ? "bg-red-600 text-white"
                                : intake.intakeStatus === "ongoing"
                                  ? "bg-green-500 text-white"
                                  : intake.intakeStatus === "completed"
                                    ? "bg-gray-400 text-white"
                                    : "bg-yellow-500 text-white"
                            }`}
                          >
                            {intake.intakeStatus || "N/A"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>


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
