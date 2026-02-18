"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pb, { logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Search,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Menu,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Layers,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  role: string;
  accountStatus: string;
  created: string;
}

export default function StudentManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    try {
      const records = await pb
        .collection("users")
        .getFullList({
          filter: 'role = "student"',
          sort: "-created",
        })
        .catch(() => []);

      setStudents((records as any) || []);
      setLoading(false);
    } catch (error) {
      setStudents([]);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await pb.collection("users").delete(id);
        setStudents(students.filter((s) => s.id !== id));
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.accountStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black text-xs uppercase tracking-widest">
            Initialising Directory...
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
              <Users size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Student <span className="text-indigo-600">Database</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <Layers size={14} className="text-indigo-400" />
                Centralized Enrollment Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 uppercase">
              <UserPlus size={18} />
              ADD NEW STUDENT
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <StatsCarousel
            stats={[
              {
                title: "Total Students",
                value: students.length,
                icon: Users,
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                title: "Active",
                value: students.filter((s) => s.accountStatus === "active")
                  .length,
                icon: CheckCircle,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Disabled",
                value: students.filter((s) => s.accountStatus === "disabled")
                  .length,
                icon: XCircle,
                bgColor: "bg-red-50",
                iconColor: "text-red-600",
              },
              {
                title: "This Month",
                value: students.filter(
                  (s) =>
                    new Date(s.created).getMonth() === new Date().getMonth(),
                ).length,
                icon: Calendar,
                bgColor: "bg-indigo-50",
                iconColor: "text-indigo-600",
              },
            ]}
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by name, email or reg ID..."
            action={
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 gap-3 transition-all focus-within:ring-2 focus-within:ring-indigo-500/10">
                  <Filter size={14} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="all">ALL STUDENTS</option>
                    <option value="active">ACTIVE ONLY</option>
                    <option value="disabled">DISABLED</option>
                  </select>
                </div>
              </div>
            }
          />
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000 group">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Identity
                  </th>
                  <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Contact & Reach
                  </th>
                  <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Location
                  </th>
                  <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Account status
                  </th>
                  <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Enrolled
                  </th>
                  <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group/row hover:bg-indigo-50/30 transition-all duration-300"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all duration-300 scale-100 group-hover/row:scale-110">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 group-hover/row:text-indigo-600 transition-colors uppercase tracking-tight">
                            {student.name}
                          </span>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                            REG-{student.id.slice(0, 6).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-xs font-bold text-gray-600">
                          <Mail size={12} className="mr-2 text-indigo-400" />
                          {student.email}
                        </div>
                        <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <Phone size={10} className="mr-2 text-gray-300" />
                          {student.mobile}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest">
                        <MapPin size={14} className="mr-2 text-indigo-300" />
                        {student.city}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <Badge
                        className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-none shadow-sm ${
                          student.accountStatus === "active"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {student.accountStatus}
                      </Badge>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className="text-sm font-black text-gray-400 italic">
                        {new Date(student.created).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-end gap-2 pr-4 opacity-40 group-hover/row:opacity-100 transition-opacity duration-300">
                        <button className="p-3 bg-white border border-gray-100 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-3 bg-white border border-gray-100 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-900 hover:text-white transition-all shadow-sm">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-24 bg-gray-50/30">
              <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300 mx-auto mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                No results found
              </h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
                Adjust your filters or try a different search term
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
