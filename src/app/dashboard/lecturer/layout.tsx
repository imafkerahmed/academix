"use client";

import React, { useState } from "react";
import { DashboardSidebar, LECTURER_MENU_ITEMS } from "@/components/dashboard/sidebar";
import { BaseDashboardLayout } from "@/components/dashboard/layout/BaseDashboardLayout";
import pb from "@/lib/pocketbase";
import { usePathname, useRouter } from "next/navigation";

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [userName] = useState<string>(() => {
    const user = pb.authStore.model;
    return user?.name || user?.username || "Lecturer";
  });

  const handleLogout = () => {
    pb.authStore.clear();
    router.replace("/login");
  };

  const currentPath = pathname || "";
  const activeTab =
    LECTURER_MENU_ITEMS.find((item) =>
      item.href === "/dashboard/lecturer"
        ? currentPath === "/dashboard/lecturer"
        : currentPath.startsWith(item.href)
    )?.id || "dashboard";

  return (
    <BaseDashboardLayout
      sidebarComponent={
        <DashboardSidebar 
          isSidebarOpen={false}
          activeTab={activeTab}
          menuItems={LECTURER_MENU_ITEMS}
          userName={userName}
          userRole="Lecturer"
          onLogout={handleLogout}
        />
      }
      userRoleInitial="L"
    >
      {children}
    </BaseDashboardLayout>
  );
}
