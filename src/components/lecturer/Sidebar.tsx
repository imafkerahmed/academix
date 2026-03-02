"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  GraduationCap,
  FileEdit,
  FolderOpen,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  lecturerName: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

function ProfileDropdown({
  lecturerName,
  onLogout,
}: {
  lecturerName: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300 group border border-transparent hover:border-indigo-100"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-indigo-100 shadow-lg group-hover:scale-110 transition-transform">
          {lecturerName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col flex-1 text-left overflow-hidden">
          <span className="font-black text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-1">
            Lecturer
          </span>
          <span className="font-bold text-sm text-gray-900 truncate">
            {lecturerName}
          </span>
        </div>
        <ChevronRight
          size={14}
          className={`text-gray-300 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-4 bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full text-left px-5 py-3 text-xs font-black text-red-500 hover:bg-red-50 rounded-2xl transition-all uppercase tracking-widest mt-1"
          >
            <LogOut size={14} />
            LOG OUT
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  lecturerName,
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard/lecturer", icon: Home, label: "DASHBOARD" },
    {
      href: "/dashboard/lecturer/intakes",
      icon: GraduationCap,
      label: "INTAKES",
    },
    {
      href: "/dashboard/lecturer/assignments",
      icon: FileEdit,
      label: "ASSIGNMENTS",
    },
    {
      href: "/dashboard/lecturer/materials",
      icon: FolderOpen,
      label: "MATERIALS",
    },
  ];

  const handleLogout = () => {
    pb.authStore.clear();
    router.replace("/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-950/20 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-50 transition-all duration-500 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64 shadow-2xl shadow-indigo-900/[0.02]`}
      >
        {/* Logo/Title */}
        <div className="px-8 py-12 flex flex-col justify-center gap-2 group cursor-default">
          <h2 className="text-2xl font-black tracking-tighter text-gray-900 flex items-center gap-1.5">
            <span className="group-hover:text-indigo-600 transition-colors duration-500">
              ACADE
            </span>
            <span className="text-indigo-600 group-hover:text-gray-900 transition-colors duration-500">
              MIX
            </span>
            <span className="w-2 h-2 rounded-full bg-indigo-600 group-hover:scale-150 transition-transform duration-500" />
          </h2>
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-8 bg-indigo-600 rounded-full" />
            <div className="h-0.5 w-2 bg-indigo-200 rounded-full group-hover:w-12 transition-all duration-700" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2">
          <div className="px-4 mb-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              MENU
            </span>
          </div>
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const currentPath = pathname || "";
              const isActive =
                item.href === "/dashboard/lecturer"
                  ? currentPath === "/dashboard/lecturer"
                  : currentPath.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.25rem] transition-all duration-300 group ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                        : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
                    }`}
                  >
                    <IconComponent
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform duration-300`}
                    />
                    <span
                      className={`text-[11px] font-black uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile/Logout Dropdown */}
        <div className="p-4 border-t border-gray-50">
          <ProfileDropdown
            lecturerName={lecturerName}
            onLogout={handleLogout}
          />
        </div>
      </aside>
    </>
  );
}
