"use client";

import React from "react";
import StudentPayment from "@/components/student-payment";
import { CreditCard, TrendingUp } from "lucide-react";

export default function StudentPaymentsPage() {
  return (
    <>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <CreditCard size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              My <span className="text-indigo-600">Payments</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-400" />
              Financial Records
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
        <StudentPayment />
      </div>
    </>
  );
}
