"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import {
  Home,
  GraduationCap,
  FileEdit,
  FolderOpen,
} from "lucide-react";
import { DashboardSidebar, MenuItem } from "@/components/dashboard/sidebar";

interface SidebarProps {
  lecturerName: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  lecturerName,
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { id: "dashboard", href: "/dashboard/lecturer", icon: Home, label: "DASHBOARD" },
    {
      id: "intakes",
      href: "/dashboard/lecturer/intakes",
      icon: GraduationCap,
      label: "INTAKES",
    },
    {
      id: "assignments",
      href: "/dashboard/lecturer/assignments",
      icon: FileEdit,
      label: "ASSIGNMENTS",
    },
    {
      id: "materials",
      href: "/dashboard/lecturer/materials",
      icon: FolderOpen,
      label: "MATERIALS",
    },
  ];

  const handleLogout = () => {
    pb.authStore.clear();
    router.replace("/login");
  };

  const currentPath = pathname || "";
  const activeTab =
    menuItems.find((item) =>
      item.href === "/dashboard/lecturer"
        ? currentPath === "/dashboard/lecturer"
        : currentPath.startsWith(item.href)
    )?.id || "dashboard";

  return (
    <DashboardSidebar
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      activeTab={activeTab}
      menuItems={menuItems}
      userName={lecturerName}
      userRole="Lecturer"
      onLogout={handleLogout}
    />
  );
}
