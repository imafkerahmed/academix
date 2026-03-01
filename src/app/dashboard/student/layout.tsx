"use client";

import { useState } from "react";
import Sidebar from "@/components/student/Sidebar";
import { SessionWarningModal } from "@/components/SessionWarningModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Menu, LayoutDashboard } from "lucide-react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { showWarning, timeRemaining, extendSession, forceLogout } =
    useSessionTimeout({
      timeoutMinutes: 120, // 2 hours
      warningMinutes: 0, // no warning
      enabled: true,
    });

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar
        studentName="Afker Ahmed"
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <SessionWarningModal
        isOpen={showWarning}
        timeRemaining={timeRemaining}
        onExtend={extendSession}
        onLogout={forceLogout}
      />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Mobile Header - Visible only on mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-gray-900 tracking-tighter uppercase">
              Academix
            </h1>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <span className="font-bold text-xs">S</span>
            </div>
          </div>
        </div>

        <main className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
