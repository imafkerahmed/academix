"use client";
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { logout } from "@/lib/pocketbase";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const adminName = "Admin User";
  const onLogout = () => {
    logout();
    router.replace("/login");
  };
  const pathname = usePathname();

  // Hide sidebar for specific admin subpages
  const hideSidebar =
    /^\/dashboard\/admin\/intakes\/[^/]+$/.test(pathname ?? "") ||
    /^\/dashboard\/admin\/intakes\/[^/]+\/[^/]+$/.test(pathname ?? "") ||
    /^\/dashboard\/admin\/assignments\/[^/]+$/.test(pathname ?? "");

  return (
    <div className="flex min-h-screen">
      {!hideSidebar && (
        <AdminSidebar
          adminName={adminName}
          onLogout={onLogout}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}
      <div className="flex-1 flex flex-col min-h-screen">
        {!hideSidebar && (
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg uppercase tracking-tighter text-gray-900">
                Academix
              </span>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <span className="font-bold text-xs">A</span>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 bg-gray-50 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
