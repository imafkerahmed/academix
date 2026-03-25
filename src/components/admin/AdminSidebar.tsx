"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  DollarSign,
  Video,
  Settings,
} from "lucide-react";
import { DashboardSidebar, MenuItem } from "@/components/dashboard/sidebar";

interface AdminSidebarProps {
  adminName?: string;
  onLogout: () => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}

export default function AdminSidebar({
  adminName = "Admin User",
  onLogout,
  isSidebarOpen = false,
  setIsSidebarOpen,
}: AdminSidebarProps) {
  const pathname = usePathname();

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

  const menuItems: MenuItem[] = [
    {
      id: "overview",
      label: "DASHBOARD",
      icon: LayoutDashboard,
      href: "/dashboard/admin",
    },
    {
      id: "students",
      label: "STUDENT DATABASE",
      icon: Users,
      href: "/dashboard/admin/students",
    },
    {
      id: "intakes",
      label: "ACADEMIC TERMS",
      icon: GraduationCap,
      href: "/dashboard/admin/intakes",
    },
    {
      id: "assignments",
      label: "ASSIGNMENT HUB",
      icon: FileText,
      href: "/dashboard/admin/assignments",
    },
    {
      id: "payments",
      label: "FINANCE & AUDIT",
      icon: DollarSign,
      href: "/dashboard/admin/payments",
    },
    {
      id: "classes",
      label: "CLASS SCHEDULER",
      icon: Video,
      href: "/dashboard/admin/classes",
    },
    {
      id: "settings",
      label: "SYSTEM SETTINGS",
      icon: Settings,
      href: "/dashboard/admin/settings",
    },
  ];

  return (
    <DashboardSidebar
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      activeTab={activeTab}
      menuItems={menuItems}
      userName={adminName}
      userRole="Admin"
      onLogout={onLogout}
    />
  );
}
