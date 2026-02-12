"use client";
import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminName = "Admin User";
  const onLogout = () => {};
  return (
    <div className="flex min-h-screen">
      <AdminSidebar adminName={adminName} onLogout={onLogout} />
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
