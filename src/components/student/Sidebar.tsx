"use client";

import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/pocketbase";
import { DashboardSidebar, MenuItem } from "@/components/dashboard/sidebar";

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "DASHBOARD",
    icon: LayoutDashboard,
    href: "/dashboard/student",
  },
  {
    id: "courses",
    label: "MY COURSES",
    icon: BookOpen,
    href: "/dashboard/student/courses",
  },
  {
    id: "payments",
    label: "PAYMENTS",
    icon: CreditCard,
    href: "/dashboard/student/payments",
  },
  {
    id: "profile",
    label: "PROFILE",
    icon: User,
    href: "/dashboard/student/profile",
  },
];

export default function StudentSidebar({
  studentName = "Student",
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  studentName?: string;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab based on pathname
  const activeTab =
    menuItems.find((item) =>
      item.href === "/dashboard/student"
        ? pathname === item.href
        : pathname?.startsWith(item.href)
    )?.id || "dashboard";

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  return (
    <DashboardSidebar
      isSidebarOpen={isSidebarOpen || false}
      setIsSidebarOpen={setIsSidebarOpen}
      activeTab={activeTab}
      menuItems={menuItems}
      userName={studentName}
      userRole="Student"
      onLogout={handleLogout}
      profileLink="/dashboard/student/profile"
    />
  );
}
