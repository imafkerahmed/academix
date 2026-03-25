"use client";

import React from "react";
import { DashboardSidebar, ADMIN_MENU_ITEMS } from "@/components/dashboard/sidebar";
import { BaseDashboardLayout } from "@/components/dashboard/layout/BaseDashboardLayout";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/pocketbase";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const adminName = "Admin User";
  
  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  function getActiveTab(path: string) {
    if (path.startsWith("/dashboard/admin/students")) return "students";
    if (path.startsWith("/dashboard/admin/intakes")) return "intakes";
    if (path.startsWith("/dashboard/admin/assignments")) return "assignments";
    if (path.startsWith("/dashboard/admin/payments")) return "payments";
    if (path.startsWith("/dashboard/admin/classes")) return "classes";
    if (path.startsWith("/dashboard/admin/settings")) return "settings";
    return "overview";
  }

  const activeTab = getActiveTab(pathname || "");

  // Hide sidebar for specific admin subpages
  const hideSidebarPaths = (pathname: string) =>
    /^\/dashboard\/admin\/intakes\/[^/]+$/.test(pathname) ||
    /^\/dashboard\/admin\/intakes\/[^/]+\/[^/]+$/.test(pathname) ||
    /^\/dashboard\/admin\/assignments\/[^/]+$/.test(pathname);

  return (
    <BaseDashboardLayout
      sidebarComponent={
        <DashboardSidebar 
          isSidebarOpen={false} 
          activeTab={activeTab}
          menuItems={ADMIN_MENU_ITEMS}
          userName={adminName}
          userRole="Admin"
          onLogout={onLogout}
        />
      }
      userRoleInitial="A"
      hideSidebarPaths={hideSidebarPaths}
    >
      {children}
    </BaseDashboardLayout>
  );
}
