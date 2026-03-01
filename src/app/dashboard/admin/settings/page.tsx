"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Settings,
  User,
  BookOpen,
  Building2,
  DollarSign,
  Menu,
  Shield,
  Layers,
  ArrowRight,
  ChevronRight,
  Layout,
  Bell,
  Cpu,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black text-xs uppercase tracking-widest">
            Accessing Kernel...
          </p>
        </div>
      </div>
    );
  }

  const settingSections = [
    {
      title: "User Management",
      desc: "Architect accounts for students, lecturers, and system architects",
      icon: User,
      color: "blue",
      link: "Manage Accounts",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      href: null,
    },
    {
      title: "Academic Structure",
      desc: "Configure subject hierarchies and course delivery parameters",
      icon: BookOpen,
      color: "green",
      link: "Configure Subjects",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      href: "/dashboard/admin/settings/academic",
    },
    {
      title: "Operational Units",
      desc: "Manage regional branch locations and physical infrastructure",
      icon: Building2,
      color: "purple",
      link: "Manage Branches",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      href: null,
    },
    {
      title: "Financial Protocol",
      desc: "Define fee structures, registration costs, and payment gateways",
      icon: DollarSign,
      color: "orange",
      link: "Finances & Gateways",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      href: null,
    },
    {
      title: "Visual & System UI",
      desc: "Personalize the dashboad theme, logos, and global aesthetics",
      icon: Layout,
      color: "indigo",
      link: "Customize UI",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      href: null,
    },
    {
      title: "Communications Hub",
      desc: "Sync notification triggers and system-wide broadcast rules",
      icon: Bell,
      color: "amber",
      link: "System Alerts",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      href: null,
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen lg:ml-64 font-sans">
      <main className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Page Header Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
              <Shield size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Access <span className="text-indigo-600">Control</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <Layers size={14} className="text-indigo-400" />
                Global System Configuration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Kernel Mode: Active
              </span>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {settingSections.map((s, idx) => {
            const CardContent = (
              <div className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col gap-6 ring-1 ring-gray-950/[0.02]">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-14 h-14 ${s.iconBg} ${s.iconColor} rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-indigo-600 group-hover:text-white shadow-sm`}
                  >
                    <s.icon size={24} />
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-none">
                    {s.title}
                  </h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-4 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform flex items-center gap-2">
                    {s.link} <ArrowRight size={14} />
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-100 group-hover:bg-indigo-400 transition-colors" />
                </div>
              </div>
            );

            return s.href ? (
              <Link key={idx} href={s.href}>
                {CardContent}
              </Link>
            ) : (
              <div key={idx}>{CardContent}</div>
            );
          })}
        </div>

        {/* System Summary Footer */}
        <div className="bg-indigo-900 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group shadow-2xl shadow-indigo-900/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl group-hover:scale-150 transition-transform duration-1000" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-white border border-white/20 shadow-inner">
                <Cpu size={36} className="animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  System Infrastructure
                </h2>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">
                  v2.4.0 High-Performance Engine
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                  Environment
                </span>
                <span className="text-white font-black text-lg">
                  PRODUCTION
                </span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                  Status
                </span>
                <span className="text-green-400 font-black text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />{" "}
                  OPTIMIZED
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
