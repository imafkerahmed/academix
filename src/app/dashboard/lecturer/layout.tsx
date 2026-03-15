"use client";

import React, { useState } from "react";
import Sidebar from "@/components/lecturer/Sidebar";
import { SessionWarningModal } from "@/components/SessionWarningModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Menu, Layout as LayoutIcon } from "lucide-react";
import pb from "@/lib/pocketbase";

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName] = useState<string>(() => {
    const user = pb.authStore.model;
    return user?.name || user?.username || "Lecturer";
  });

  const { showWarning, timeRemaining, extendSession, forceLogout } =
    useSessionTimeout({
      timeoutMinutes: 120, // 2 hours
      warningMinutes: 0, // no warning
      enabled: true,
    });

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <Sidebar
        lecturerName={userName}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <SessionWarningModal
        isOpen={showWarning}
        timeRemaining={timeRemaining}
        onExtend={extendSession}
        onLogout={forceLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden transition-all duration-300">
        <main className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-500"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">
              Academix
            </h1>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <LayoutIcon size={20} />
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
