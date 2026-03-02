"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Calendar from "@/components/Calendar";
import StudentBreadcrumbs from "@/components/student/StudentBreadcrumbs";
import { CalendarDays, TrendingUp, Lock } from "lucide-react";
import { motion } from "framer-motion";
import pb from "@/lib/pocketbase";

export default function CalendarPage() {
  const router = useRouter();
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  useEffect(() => {
    const checkAccountStatus = async () => {
      const currentUser = pb.authStore.model;
      if (!currentUser || currentUser.role !== "student") {
        router.push("/login");
        return;
      }

      // Refresh user auth to get latest account status from server
      try {
        await pb.collection("users").authRefresh();
      } catch (error) {
        console.log("Auth refresh failed:", error);
      }

      // Check account status from refreshed auth store
      const latestUser = pb.authStore.model;
      if (latestUser?.accountStatus === "disabled") {
        setIsAccountDisabled(true);
      }
    };

    checkAccountStatus();
  }, [router]);

  // Show disabled account message if account is disabled
  if (isAccountDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-12 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Lock size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Account Disabled
          </h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Your account has been disabled. Please contact the administrator for
            assistance.
          </p>
          <button
            onClick={() => {
              pb.authStore.clear();
              router.push("/login");
            }}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <StudentBreadcrumbs items={[{ label: "Calendar" }]} />

      {isAccountDisabled && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Account Disabled</h3>
              <p className="mt-1 text-sm text-red-700">
                Your account has been disabled. Please contact the administrator
                for assistance.
              </p>
            </div>
            <button
              onClick={async () => {
                await pb.authStore.clear();
                router.push("/login");
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </motion.div>
      )}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <CalendarDays size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Academic <span className="text-indigo-600">Calendar</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-400" />
              Schedule & Events
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
        <Calendar />
      </div>
    </>
  );
}
