"use client";

import React from "react";
import { GraduationCap, TrendingUp } from "lucide-react";
import IntakesTree, { type Intake } from "@/components/lecturer/IntakesTree";
import pb from "@/lib/pocketbase";

export default function IntakesPage() {
  const [intakes, setIntakes] = React.useState<Intake[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchIntakes = async () => {
      try {
        const user = pb.authStore.model;
        if (!user?.id) return;

        const res = await fetch(`/api/lecturer/intakes?lecturerId=${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch intakes");
        
        setIntakes(data.records || []);
      } catch (err: unknown) {
        console.error("Error loading intakes:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load your assigned subjects. Please try again later.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchIntakes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-[2rem] border border-red-100 mt-8">
        <p className="text-red-600 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <GraduationCap size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              My <span className="text-indigo-600">Intakes</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-400" />
              Managed Academic Terms & Courses
            </p>
          </div>
        </div>
      </div>
      <IntakesTree intakes={intakes} />
    </>
  );
}
