"use client";

import React from "react";
import { DashboardSidebar, STUDENT_MENU_ITEMS } from "@/components/dashboard/sidebar";
import { BaseDashboardLayout } from "@/components/dashboard/layout/BaseDashboardLayout";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/pocketbase";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab based on pathname
  const activeTab =
    STUDENT_MENU_ITEMS.find((item) =>
      item.href === "/dashboard/student"
        ? pathname === item.href
        : pathname?.startsWith(item.href)
    )?.id || "dashboard";

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  return (
    <BaseDashboardLayout
      sidebarComponent={
        <DashboardSidebar 
          isSidebarOpen={false}
          activeTab={activeTab}
          menuItems={STUDENT_MENU_ITEMS}
          userName="Student" // This can be dynamic later
          userRole="Student"
          onLogout={handleLogout}
          profileLink="/dashboard/student/profile"
        />
      }
      userRoleInitial="S"
    >
      {children}
    </BaseDashboardLayout>
  );
}
