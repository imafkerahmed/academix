"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pb, { logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";
import {
  Video,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Play,
  Eye,
  Menu,
  Plus,
  ArrowRight,
  Monitor,
  Activity,
  User,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ZoomClass {
  id: string;
  title: string;
  description?: string;
  zoom_meeting_id?: string;
  start_time: string;
  duration: number;
  status: string;
  is_recurring: boolean;
  recurrence_day?: string;
  expand?: {
    host?: any;
    zoom_account?: any;
  };
}

export default function ClassManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ZoomClass[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const records = await pb
        .collection("classes")
        .getFullList({
          sort: "-start_time",
        })
        .catch(() => []);

      setClasses((records as any) || []);
      setLoading(false);
    } catch (error) {
      setClasses([]);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const stats = {
    scheduled: classes.filter((c) => c.status === "scheduled").length,
    inProgress: classes.filter((c) => c.status === "in_progress").length,
    completed: classes.filter((c) => c.status === "completed").length,
    cancelled: classes.filter((c) => c.status === "cancelled").length,
  };

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch = classItem.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (filter === "all") return matchesSearch;
    return matchesSearch && classItem.status === filter;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black text-xs uppercase tracking-widest">
            Syncing Class Schedules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen lg:ml-64 font-sans">
      <AdminSidebar
        activeTab="classes"
        onLogout={handleLogout}
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
            <Video size={20} />
          </div>
        </div>

        {/* Page Header Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
              <Monitor size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Class <span className="text-indigo-600">Scheduler</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <Activity size={14} className="text-indigo-400" />
                Real-time Session Monitoring
              </p>
            </div>
          </div>
          <button className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 uppercase">
            <Plus size={18} />
            SCHEDULE CLASS
          </button>
        </div>

        {/* Stats Carousel */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <StatsCarousel
            stats={[
              {
                title: "Scheduled",
                value: stats.scheduled,
                icon: Calendar,
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                title: "In Progress",
                value: stats.inProgress,
                icon: Play,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Completed",
                value: stats.completed,
                icon: CheckCircle,
                bgColor: "bg-gray-100",
                iconColor: "text-gray-600",
              },
              {
                title: "Cancelled",
                value: stats.cancelled,
                icon: XCircle,
                bgColor: "bg-red-50",
                iconColor: "text-red-600",
              },
            ]}
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search sessions by title..."
            action={
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: "all", label: "ALL", color: "blue" },
                  { id: "scheduled", label: "SCHEDULED", color: "blue" },
                  { id: "in_progress", label: "LIVE", color: "green" },
                  { id: "completed", label: "HISTORY", color: "gray" },
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

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {filteredClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col gap-6 ring-1 ring-gray-950/[0.02]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 overflow-hidden ${
                      classItem.status === "in_progress"
                        ? "bg-green-100 text-green-600 animate-pulse ring-4 ring-green-50"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    <Video size={24} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                      {classItem.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          classItem.status === "scheduled"
                            ? "bg-blue-600"
                            : classItem.status === "in_progress"
                              ? "bg-green-600"
                              : classItem.status === "cancelled"
                                ? "bg-red-600"
                                : "bg-gray-400"
                        } text-white`}
                      >
                        {classItem.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
                <button className="p-3 bg-gray-50 rounded-xl text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                  <Eye size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-1 border border-transparent group-hover:border-indigo-100/50 transition-all duration-500">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} className="text-indigo-400" /> Date &
                    Time
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {new Date(classItem.start_time).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                    <span className="text-indigo-500 mx-2">•</span>
                    {new Date(classItem.start_time).toLocaleTimeString(
                      "en-US",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-1 border border-transparent group-hover:border-indigo-100/50 transition-all duration-500">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} className="text-indigo-400" /> Host
                  </span>
                  <span className="text-sm font-bold text-gray-900 truncate">
                    {classItem.expand?.host?.name || "Administrator"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl">
                    <Clock size={12} />
                    <span className="text-[10px] font-black tracking-widest">
                      {classItem.duration} MIN
                    </span>
                  </div>
                  {classItem.zoom_meeting_id && (
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl">
                      <Hash size={12} />
                      <span className="text-[10px] font-black tracking-widest">
                        ID: {classItem.zoom_meeting_id.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
                <button className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform">
                  View details <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-200 mx-auto mb-6">
              <Video size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
              No sessions found
            </h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
              Try clearing your filters or search terms
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
