"use client";

import React from "react";
import { RouteLink } from "@/components/ui/route-link";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  DollarSign,
  Video,
  Settings,
  LogOut,
} from "lucide-react";

type ProfileDropdownProps = {
  adminName: string;
  onLogout: () => void;
};

function ProfileDropdown({ adminName, onLogout }: ProfileDropdownProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700 font-bold text-lg">
          {adminName.charAt(0)}
        </span>
        <span className="font-medium flex-1 text-left">{adminName}</span>
        <svg
          className={`h-4 w-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <button
            onClick={() => {
              setOpen(false);
              window.location.href = "/dashboard/admin/profile";
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            View Profile
          </button>
          <button
            onClick={onLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

interface AdminSidebarProps {
  adminName?: string;
  activeTab: string;
  onLogout: () => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}

export default function AdminSidebar({
  adminName = "Admin User",
  activeTab,
  onLogout,
  isSidebarOpen = false,
  setIsSidebarOpen,
}: AdminSidebarProps) {
  const menuItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard/admin",
    },
    {
      id: "students",
      label: "Student Management",
      icon: Users,
      href: "/dashboard/admin/students",
    },
    {
      id: "intakes",
      label: "Intake & Courses",
      icon: GraduationCap,
      href: "/dashboard/admin/intakes",
    },
    {
      id: "assignments",
      label: "Assignments",
      icon: FileText,
      href: "/dashboard/admin/assignments",
    },
    {
      id: "payments",
      label: "Payments",
      icon: DollarSign,
      href: "/dashboard/admin/payments",
    },
    {
      id: "classes",
      label: "Online Classes",
      icon: Video,
      href: "/dashboard/admin/classes",
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen?.(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64`}
      >
        {/* Logo/Title */}
        <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-center">
          <span className="text-2xl font-extrabold tracking-wide text-black">
            ACADEMIX
          </span>
        </div>
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id}>
                  <RouteLink
                    href={item.href}
                    onClick={() => setIsSidebarOpen?.(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <IconComponent size={20} />
                    <span className="font-medium">{item.label}</span>
                  </RouteLink>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Profile/Logout Dropdown */}
        <div className="p-4 border-t border-gray-200">
          <ProfileDropdown adminName={adminName} onLogout={onLogout} />
        </div>
      </aside>
    </>
  );
}
