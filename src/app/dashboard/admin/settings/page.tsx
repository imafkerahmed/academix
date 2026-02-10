"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Settings,
  User,
  BookOpen,
  Building2,
  DollarSign,
  Menu,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Authentication disabled for UI development
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminSidebar
        activeTab="settings"
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
              System Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Configure platform settings and manage resources
            </p>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <User className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    User Management
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add and manage students, lecturers, and admin accounts
                  </p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Manage Users →
                  </button>
                </div>
              </div>
            </div>

            {/* Subject Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <BookOpen className="text-green-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Subject Management
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create and manage subjects for courses
                  </p>
                  <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                    Manage Subjects →
                  </button>
                </div>
              </div>
            </div>

            {/* Branch Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Building2 className="text-purple-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Branch Settings
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure branch locations and settings
                  </p>
                  <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    Manage Branches →
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <DollarSign className="text-orange-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Payment Settings
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure payment options and fee structures
                  </p>
                  <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                    Manage Payments →
                  </button>
                </div>
              </div>
            </div>

            {/* System Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Settings className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    System Configuration
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    General system settings and preferences
                  </p>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Configure System →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Settings pages for user, subject, and other
              management features are coming soon. For now, manage these
              directly through the respective section pages.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
