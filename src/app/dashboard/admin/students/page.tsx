"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import pb, { isSuperuserOnlyError } from "@/lib/pocketbase";
import {
  Search,
  Filter,
  UserPlus,
  Edit,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Layers,
  BookOpen,
} from "lucide-react";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";
import { Badge } from "@/components/ui/badge";
import { RegisterStudentModal } from "@/components/admin/RegisterStudentModal";
import { DashboardLoader } from "@/components/dashboard/shared/DashboardLoader";

interface Student {
  id: string;
  userId: string;
  avatar: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  role: string;
  accountStatus: string;
  academicStatus: string;
  created: string;
  expand?: {
    enrollments_via_student?: Array<{
      expand?: {
        course_intake?: {
          expand?: {
            course?: {
              name: string;
              code: string;
            };
          };
        };
      };
    }>;
  };
}

export default function StudentManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [academicFilter, setAcademicFilter] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;
  const [totalItems, setTotalItems] = useState(0);

  // Registration & Enrollment Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<
    { id: string; name: string; email: string } | undefined
  >(undefined);

  const fetchStudents = useCallback(async (page = 1, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const result = await pb.collection("users").getList(page, perPage, {
        filter: `role = "student" ${
          statusFilter !== "all" ? ` && accountStatus = "${statusFilter}"` : ""
        } ${
          academicFilter !== "all"
            ? ` && academicStatus = "${academicFilter}"`
            : ""
        } ${
          searchQuery
            ? ` && (name ~ "${searchQuery}" || email ~ "${searchQuery}" || userId ~ "${searchQuery}")`
            : ""
        }`,
        sort: "-created",
        expand: "enrollments_via_student.course_intake.course",
      });

      setStudents(result.items as unknown as Student[]);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
      setLoading(false);
    } catch (error) {
      if (!isSuperuserOnlyError(error)) {
        console.error("Failed to fetch students:", error);
      }
      setStudents([]);
      setTotalPages(1);
      setTotalItems(0);
      setLoading(false);
    }
  }, [statusFilter, academicFilter, searchQuery]);

  useEffect(() => {
    const silent = !isInitialMount.current;
    isInitialMount.current = false;
    const init = async () => {
      await fetchStudents(currentPage, silent);
    };
    init();
  }, [fetchStudents, currentPage]);


  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleAcademicFilterChange = (filter: string) => {
    setAcademicFilter(filter);
    setCurrentPage(1);
  };

  const filteredStudents = students;

  return (
    <div className="space-y-8">
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
                Student and Enrollment Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEnrollTarget(undefined);
                setIsRegisterModalOpen(true);
              }}
              className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 uppercase"
            >
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
                value: totalItems,
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
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by name, email or reg ID..."
            action={
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 gap-3 transition-all focus-within:ring-2 focus-within:ring-indigo-500/10">
                  <Filter size={14} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="all">ALL STUDENTS</option>
                    <option value="active">ACTIVE ONLY</option>
                    <option value="disabled">DISABLED</option>
                  </select>
                </div>
                <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 gap-3 transition-all focus-within:ring-2 focus-within:ring-indigo-500/10">
                  <BookOpen size={14} className="text-gray-400" />
                  <select
                    value={academicFilter}
                    onChange={(e) => handleAcademicFilterChange(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="all">ACADEMIC STATUS</option>
                    <option value="enrolled">ENROLLED</option>
                    <option value="pending">PENDING</option>
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
                    UserID
                  </th>
                  <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Student Name
                  </th>
                  <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Enrolled Courses
                  </th>
                  <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Status
                  </th>
                  <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20">
                      <DashboardLoader inline={true} message="Loading Student Directory..." />
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group/row hover:bg-indigo-50/30 transition-all duration-300"
                  >
                    <td className="px-10 py-6">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl tracking-widest shadow-sm border border-indigo-100/50">
                        {student.userId ||
                          `REG-${student.id.slice(0, 6).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        {student.avatar ? (
                          <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-sm border-2 border-white ring-4 ring-indigo-50/50 grayscale group-hover/row:grayscale-0 transition-all duration-300">
                            <Image
                              src={pb.files.getUrl(
                                student,
                                student.avatar,
                              )}
                              alt={student.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm border-2 border-white ring-4 ring-indigo-50/50 group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all duration-300">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-black text-gray-900 group-hover/row:text-indigo-600 transition-colors uppercase tracking-tight">
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                        {student.expand?.enrollments_via_student?.length ? (
                          student.expand.enrollments_via_student.map(
                            (enrollment, idx) => {
                              const course =
                                enrollment.expand?.course_intake?.expand
                                  ?.course;
                              if (!course) return null;
                              return (
                                <Badge
                                  key={idx}
                                  className="bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-default"
                                >
                                  {course.name}
                                </Badge>
                              );
                            },
                          )
                        ) : (
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic leading-loose">
                            No Active <br /> Enrollments
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Badge
                          className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] border-none shadow-sm w-20 justify-center ${
                            student.accountStatus === "active"
                              ? "bg-emerald-500 text-white shadow-emerald-100"
                              : "bg-rose-500 text-white shadow-rose-100"
                          }`}
                        >
                          {student.accountStatus}
                        </Badge>
                        <Badge
                          className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] border-none shadow-sm w-20 justify-center ${
                            student.academicStatus === "enrolled"
                              ? "bg-indigo-500 text-white shadow-indigo-100"
                              : "bg-amber-500 text-white shadow-amber-100"
                          }`}
                        >
                          {student.academicStatus || "pending"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/admin/students/${student.id}`)
                        }
                        className="p-3 bg-white border border-gray-100 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group-hover/row:shadow-md active:scale-95"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-24 bg-gray-50/30">
                      <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300 mx-auto mb-6">
                        <Search size={40} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                        No results found
                      </h3>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
                        Adjust your filters or try a different search term
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && !loading && (
            <div className="px-10 py-6 border-t border-gray-50 flex items-center justify-between bg-white">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing Page{" "}
                <span className="text-indigo-600">{currentPage}</span> of{" "}
                {totalPages} ({totalItems} records)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className="px-4 py-2 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                        currentPage === i + 1
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                          : "text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className="px-4 py-2 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      <RegisterStudentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => { void fetchStudents(currentPage, true); }}
        enrollOnly={enrollTarget}
      />
    </div>
  );
}
