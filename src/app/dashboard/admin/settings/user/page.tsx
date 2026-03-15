"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Shield,
  GraduationCap,
  User,
  Plus,
  Search,
  Pencil,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import { RegisterStaffModal } from "@/components/admin/RegisterStaffModal";
import pb, { isSuperuserOnlyError } from "@/lib/pocketbase";
import { toast } from "sonner";

interface StaffUser {
  id: string;
  userId: string;
  name: string;
  nameinitials: string;
  email: string;
  role: "admin" | "lecturer";
  gender: string;
  dateOfBirth: string;
  IdentificationDocument: string;
  countryCode: string;
  mobile: string;
  whatsapp: string;
  address: string;
  city: string;
  branch: string;
  accountStatus: string;
  designation: string;
  field: string;
  mainDepartment: string;
  subDepartment: string;
  hiredOn: string;
  internalNotes: string;
  created: string;
  avatar: string;
  collectionId: string;
}

export default function UserManagementPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "lecturer">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [defaultRole, setDefaultRole] = useState<"admin" | "lecturer">("admin");
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const filter =
        roleFilter === "all"
          ? '(role="admin" || role="lecturer")'
          : `role="${roleFilter}"`;

      const records = await pb.collection("users").getFullList<StaffUser>({
        filter,
        sort: "-created",
      });

      setUsers(records);
    } catch (error) {
      if (!isSuperuserOnlyError(error)) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getAvatarUrl = (user: StaffUser) => {
    if (user.avatar) {
      return pb.files.getURL(user, user.avatar, { thumb: "100x100" });
    }
    return null;
  };

  const adminCount = users.filter((u) => u.role === "admin").length;
  const lecturerCount = users.filter((u) => u.role === "lecturer").length;

  return (
    <div className="bg-gray-50 min-h-screen lg:ml-64 font-sans">
      <main className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Breadcrumbs */}
        <AdminBreadcrumbs
          items={[
            { label: "Settings", href: "/dashboard/admin/settings" },
            { label: "User Management" },
          ]}
        />

        {/* Header */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
              <User size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                User <span className="text-indigo-600">Management</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                Manage admin & lecturer accounts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setDefaultRole("admin");
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={18} /> CREATE ACCOUNT
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <User size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Total Accounts
              </span>
              <p className="text-3xl font-black text-gray-900">
                {users.length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Shield size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Administrators
              </span>
              <p className="text-3xl font-black text-gray-900">{adminCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
              <GraduationCap size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Lecturers
              </span>
              <p className="text-3xl font-black text-gray-900">
                {lecturerCount}
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            {(["all", "admin", "lecturer"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setRoleFilter(f)}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  roleFilter === f
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                {f === "all"
                  ? "All Roles"
                  : f === "admin"
                    ? "Admins"
                    : "Lecturers"}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or email..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <User size={48} className="text-gray-300 mb-4" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {searchQuery
                  ? "No accounts match your search"
                  : "No accounts created yet"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Click &quot;CREATE ACCOUNT&quot; to add a new staff member
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <tr>
                    <th className="px-8 py-5 text-left">User</th>
                    <th className="px-6 py-5 text-left">User ID</th>
                    <th className="px-6 py-5 text-left">Role</th>
                    <th className="px-6 py-5 text-left">Branch</th>
                    <th className="px-6 py-5 text-left">Designation</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => {
                    const avatarUrl = getAvatarUrl(user);
                    return (
                      <tr
                        key={user.id}
                        className="group hover:bg-indigo-50/30 transition-all"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                              {avatarUrl ? (
                                <Image
                                  src={avatarUrl}
                                  alt={user.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-black text-gray-400">
                                  {user.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {user.name}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
                            {user.userId}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <Badge
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              user.role === "admin"
                                ? "bg-blue-500 text-white"
                                : "bg-violet-500 text-white"
                            }`}
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-gray-500">
                          {user.branch || "—"}
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-gray-500">
                          {user.designation || "—"}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <Badge
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              user.accountStatus === "active"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {user.accountStatus || "active"}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2.5 rounded-xl border border-indigo-100 text-indigo-500 hover:bg-indigo-50 transition-all"
                            title="Edit Account"
                          >
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Staff Modal */}
      <RegisterStaffModal
        isOpen={showCreateModal || !!editingUser}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
        }}
        onSuccess={() => fetchUsers()}
        defaultRole={editingUser?.role || defaultRole}
        editUser={editingUser}
      />
    </div>
  );
}
