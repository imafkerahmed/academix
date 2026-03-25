"use client";

import React from "react";
import { RouteLink } from "@/components/ui/route-link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardBreadcrumbsProps {
  items: BreadcrumbItem[];
  homeHref: string;
  homeLabel: string;
}

export function DashboardBreadcrumbs({
  items,
  homeHref,
  homeLabel,
}: DashboardBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 mb-6 group/nav overflow-x-auto no-scrollbar py-2 lg:hidden">
      <RouteLink
        href={homeHref}
        className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"
      >
        <Home size={12} className="text-indigo-400" />
        {homeLabel}
      </RouteLink>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
          {item.href ? (
            <RouteLink
              href={item.href}
              className="text-[10px] font-black text-gray-400 hover:text-indigo-600 transition-all uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md active:scale-95"
            >
              {item.label}
            </RouteLink>
          ) : (
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm shadow-indigo-100/50">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
