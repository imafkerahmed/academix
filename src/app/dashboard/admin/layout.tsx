"use client";
import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname } from "next/navigation";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminName = "Admin User";
  const onLogout = () => {};
  const pathname = usePathname();

  // Hide sidebar for specific admin subpages
  const hideSidebar =
    /^\/dashboard\/admin\/intakes\/[^/]+$/.test(pathname ?? "") ||
    /^\/dashboard\/admin\/intakes\/[^/]+\/[^/]+$/.test(pathname ?? "") ||
    /^\/dashboard\/admin\/assignments\/[^/]+$/.test(pathname ?? "");

  return (
    <div className="flex min-h-screen">
      {!hideSidebar && (
        <AdminSidebar adminName={adminName} onLogout={onLogout} />
      )}
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
