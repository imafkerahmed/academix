import React from "react";

export function SidebarLogo() {
  return (
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
  );
}
