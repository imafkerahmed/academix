"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  GraduationCap,
  FileEdit,
  FolderOpen,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  lecturerName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  lecturerName,
  activeTab,
  onTabChange,
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const menuItems = [
    { id: "Dashboard", icon: Home, label: "Dashboard" },
    { id: "Intakes", icon: GraduationCap, label: "Intakes" },
    { id: "Assignments", icon: FileEdit, label: "Assignments" },
    { id: "Materials", icon: FolderOpen, label: "Materials" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-gray-900 tracking-wide">
                ACADEMIX
              </h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 ml-2"
              aria-label="Close sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-xl">
              {lecturerName.charAt(0)}
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-800 truncate max-w-full">
              {lecturerName}
            </p>
            <p className="text-xs text-gray-500">Lecturer</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === item.id
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <IconComponent size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => console.log("Settings clicked")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
          <button
            onClick={() => console.log("Logout clicked")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all mt-2"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
