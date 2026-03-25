import React from "react";
import { RouteLink } from "@/components/ui/route-link";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  isActive: boolean;
  onClick?: () => void;
}

export function SidebarItem({
  label,
  icon: IconComponent,
  href,
  isActive,
  onClick,
}: SidebarItemProps) {
  return (
    <li>
      <RouteLink
        href={href}
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.25rem] transition-all duration-300 group ${
          isActive
            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
            : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
      >
        <IconComponent
          size={18}
          strokeWidth={isActive ? 2.5 : 2}
          className={`${
            isActive ? "scale-110" : "group-hover:scale-110"
          } transition-transform duration-300`}
        />
        <span
          className={`text-[11px] font-black uppercase tracking-widest ${
            isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"
          }`}
        >
          {label}
        </span>
        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        )}
      </RouteLink>
    </li>
  );
}
