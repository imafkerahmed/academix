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
} from "lucide-react";

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

interface Attendee {
  id: string;
  joined_at?: string;
  left_at?: string;
  status: string;
  expand?: {
    class?: ZoomClass;
    attendee?: any;
  };
}

export default function ClassManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ZoomClass[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Authentication disabled for UI development
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const classesPromise = pb
        .collection("classes")
        .getFullList({
          sort: "-start_time",
        })
        .catch(() => []);

      const attendeesPromise = pb
        .collection("class_attendees")
        .getFullList({
          expand: "class,attendee",
        })
        .catch(() => []);

      const [classesData, attendeesData] = await Promise.all([
        classesPromise,
        attendeesPromise,
      ]);

      setClasses((classesData as any) || []);
      setAttendees((attendeesData as any) || []);
      setLoading(false);
    } catch (error) {
      setClasses([]);
      setAttendees([]);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getClassStats = () => {
    const scheduled = classes.filter((c) => c.status === "scheduled").length;
    const inProgress = classes.filter((c) => c.status === "in_progress").length;
    const completed = classes.filter((c) => c.status === "completed").length;
    const cancelled = classes.filter((c) => c.status === "cancelled").length;
    const totalAttendees = attendees.filter(
      (a) => a.status === "attended",
    ).length;

    return { scheduled, inProgress, completed, cancelled, totalAttendees };
  };

  const stats = getClassStats();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch = classItem.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (filter === "all") return matchesSearch;
    return matchesSearch && classItem.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminSidebar
        activeTab="classes"
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
              Online Class Management
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor all Zoom classes and attendance
            </p>
          </div>

          {/* Stats Carousel */}
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

          {/* Actions Bar */}
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search classes..."
            action={
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Plus size={20} />
                Schedule New Class
              </button>
            }
          >
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({classes.length})
            </button>
            <button
              onClick={() => setFilter("scheduled")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "scheduled"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Scheduled ({stats.scheduled})
            </button>
            <button
              onClick={() => setFilter("in_progress")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "in_progress"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              In Progress ({stats.inProgress})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "completed"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed ({stats.completed})
            </button>
          </AdminActionBar>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {classItem.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {classItem.description || "No description"}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg ml-3">
                    <Video className="text-blue-600" size={20} />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar size={16} className="text-gray-400" />
                    <span>
                      {new Date(classItem.start_time).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                    <span className="mx-1">•</span>
                    <Clock size={16} className="text-gray-400" />
                    <span>
                      {new Date(classItem.start_time).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>

                  {classItem.duration && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock size={16} className="text-gray-400" />
                      <span>Duration: {classItem.duration} minutes</span>
                    </div>
                  )}

                  {classItem.expand?.host && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Users size={16} className="text-gray-400" />
                      <span>Host: {classItem.expand.host.name}</span>
                    </div>
                  )}

                  {classItem.is_recurring && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Recurring - {classItem.recurrence_day}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      classItem.status,
                    )}`}
                  >
                    {classItem.status.replace("_", " ")}
                  </span>

                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                      View Details
                    </button>
                    {classItem.zoom_meeting_id && (
                      <span className="text-gray-400">
                        • ID: {classItem.zoom_meeting_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredClasses.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 text-center py-12">
              <p className="text-gray-500">No classes found</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
