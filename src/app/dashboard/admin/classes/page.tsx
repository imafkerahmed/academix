"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pb, { getCurrentUser, logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Video,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Play,
  Eye,
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

  useEffect(() => {
    // Authentication disabled for UI development
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [classesData, attendeesData] = await Promise.all([
        pb.collection("classes").getFullList({
          expand: "host,zoom_account",
          sort: "-start_time",
        }),
        pb.collection("attendees").getFullList({
          expand: "class,attendee",
          sort: "-created",
        }),
      ]);

      setClasses(classesData as any);
      setAttendees(attendeesData as any);
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

  const getClassStats = () => {
    const scheduled = classes.filter((c) => c.status === "scheduled").length;
    const inProgress = classes.filter((c) => c.status === "in_progress").length;
    const completed = classes.filter((c) => c.status === "completed").length;
    const totalAttendees = attendees.filter(
      (a) => a.status === "attended",
    ).length;

    return { scheduled, inProgress, completed, totalAttendees };
  };

  const stats = getClassStats();

  const filteredClasses = classes.filter((classItem) => {
    if (filter === "all") return true;
    return classItem.status === filter;
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
      <AdminSidebar activeTab="classes" onLogout={handleLogout} />
      <div className="bg-gray-50 min-h-screen lg:ml-64">
        <main className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Online Class Management
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor all Zoom classes and attendance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.scheduled}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Calendar className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.inProgress}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Play className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completed}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="text-gray-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attendees</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.totalAttendees}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Users className="text-purple-600" size={24} />
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
            </div>
          </div>

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
