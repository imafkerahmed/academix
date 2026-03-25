"use client";

import React from "react";
import { ChevronRight, LogOut, User } from "lucide-react";
import { RouteLink } from "@/components/ui/route-link";

interface SidebarProfileProps {
  name: string;
  role: string;
  onLogout: () => void;
  profileLink?: string;
}

export function SidebarProfile({
  name,
  role,
  onLogout,
  profileLink,
}: SidebarProfileProps) {
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
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col flex-1 text-left overflow-hidden">
          <span className="font-black text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-1">
            {role}
          </span>
          <span className="font-bold text-sm text-gray-900 truncate">
            {name}
          </span>
        </div>
        <ChevronRight
          size={14}
          className={`text-gray-300 transition-transform duration-300 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-4 bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-300">
          {profileLink && (
            <RouteLink
              href={profileLink}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full text-left px-5 py-3 text-xs font-black text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all uppercase tracking-widest"
            >
              <User size={14} />
              VIEW PROFILE
            </RouteLink>
          )}
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
