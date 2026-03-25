"use client";

import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { BaseDashboardLayout } from "@/components/dashboard/layout/BaseDashboardLayout";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/pocketbase";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const adminName = "Admin User";
  
  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  // Hide sidebar for specific admin subpages
  const hideSidebarPaths = (pathname: string) =>
    /^\/dashboard\/admin\/intakes\/[^/]+$/.test(pathname) ||
    /^\/dashboard\/admin\/intakes\/[^/]+\/[^/]+$/.test(pathname) ||
    /^\/dashboard\/admin\/assignments\/[^/]+$/.test(pathname);

  return (
    <BaseDashboardLayout
      sidebarComponent={
        <AdminSidebar adminName={adminName} onLogout={onLogout} />
      }
      userRoleInitial="A"
      hideSidebarPaths={hideSidebarPaths}
    >
      {children}
    </BaseDashboardLayout>
  );
}
