"use client";

import React from "react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarItem } from "./SidebarItem";
import { SidebarProfile } from "./SidebarProfile";
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
  activeTab: string;
  menuItems: MenuItem[];
  userName: string;
  userRole: string;
  onLogout: () => void;
  profileLink?: string;
}

export function DashboardSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  menuItems,
  userName,
  userRole,
  onLogout,
  profileLink,
}: DashboardSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-950/20 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsSidebarOpen?.(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-50 transition-all duration-500 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64 shadow-2xl shadow-indigo-900/[0.02]`}
      >
        <SidebarLogo />

        <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <div className="px-4 mb-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              MENU
            </span>
          </div>
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                {...item}
                isActive={activeTab === item.id}
                onClick={() => setIsSidebarOpen?.(false)}
              />
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-50">
          <SidebarProfile
            name={userName}
            role={userRole}
            onLogout={onLogout}
            profileLink={profileLink}
          />
        </div>
      </aside>
    </>
  );
}
