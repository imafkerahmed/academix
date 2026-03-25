"use client";

import React, { useState } from "react";
import Sidebar from "@/components/lecturer/Sidebar";
import { BaseDashboardLayout } from "@/components/dashboard/layout/BaseDashboardLayout";
import pb from "@/lib/pocketbase";

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userName] = useState<string>(() => {
    const user = pb.authStore.model;
    return user?.name || user?.username || "Lecturer";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <BaseDashboardLayout
      sidebarComponent={<Sidebar lecturerName={userName} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />}
      userRoleInitial="L"
    >
      {children}
    </BaseDashboardLayout>
  );
}
