"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentPayment from "@/components/student-payment";
import {
  CreditCard,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Loader2,
  Lock,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

export default function StudentPaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = React.useState<string | null>(
    null,
  );
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  // compute totals for selected course
  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount,
    );

  const { totalPaid, totalBalance, totalDueThisMonth } = React.useMemo(() => {
    const course = selectedCourse;
    const courseInstallments = installments.filter((i) =>
      enrolledCourses.find((c) => c.name === course && c.id === i.enrollment),
    );
    const coursePayments = payments.filter((p) =>
      enrolledCourses.find((c) => c.name === course && c.id === p.enrollment),
    );
    const paid = coursePayments
      .filter((p) => p.verified || p.status === "Paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDue = courseInstallments.reduce(
      (sum, i) => sum + (i.amount || 0),
      0,
    );
    const balance = totalDue - paid;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let dueThisMonth = courseInstallments
      .filter(
        (i) =>
          new Date(i.due_date).getMonth() === currentMonth &&
          new Date(i.due_date).getFullYear() === currentYear,
      )
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    // include any unpaid registration or upfront fees regardless of date
    const regUpfrontDue = coursePayments
      .filter(
        (p) =>
          !p.verified &&
          (p.payment_type === "registration" || p.payment_type === "upfront"),
      )
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    dueThisMonth += regUpfrontDue;

    return {
      totalPaid: paid,
      totalBalance: balance,
      totalDueThisMonth: dueThisMonth,
    };
  }, [selectedCourse, installments, payments, enrolledCourses]);

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
        setLoading(false);
        setIsAccountDisabled(true);
        return;
      }

      if (!latestUser?.id) {
        router.push("/login");
        return;
      }

      fetchEnrollments(latestUser.id);
    };

    checkAccountStatus();
  }, [router]);

  const fetchEnrollments = async (studentId: string) => {
    try {
      // Fetch enrollments for the student
      const enrollmentRecords = await pb.collection("enrollments").getFullList({
        filter: `student = "${studentId}"`,
        expand: "course",
      });
      // Transform enrollments into course format
      const courseList = enrollmentRecords.map((enrollment: any) => ({
        id: enrollment.id,
        name: enrollment.expand?.course?.name || enrollment.id,
        icon: BookOpen,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      }));
      setEnrolledCourses(courseList);
      // Auto-select if only one course
      if (courseList.length === 1) {
        setSelectedCourse(courseList[0].name);
      }

      // Fetch installments for all enrollments
      const enrollmentIds = enrollmentRecords.map((e: any) => e.id);
      const installmentsData = await pb.collection("installments").getFullList({
        filter: enrollmentIds
          .map((id: string) => `enrollment = "${id}"`)
          .join(" || "),
        sort: "due_date",
      });
      setInstallments(installmentsData);

      // Fetch payments for all enrollments
      const paymentsData = await pb.collection("payments").getFullList({
        filter: enrollmentIds
          .map((id: string) => `enrollment = "${id}"`)
          .join(" || "),
        sort: "date_paid",
      });
      setPayments(paymentsData);
    } catch (error: any) {
      console.error("Error fetching enrollments/payments/installments:", error);
      if (error?.status === 403 || error?.status === 404) {
        toast.error("Permission denied. Please log in again.");
        setLoading(false);
        await pb.authStore.clear();
        router.push("/login");
        return;
      }
      setEnrolledCourses([]);
      setInstallments([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

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
            onClick={async () => {
              await pb.authStore.clear();
              router.push("/login");
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!selectedCourse && enrolledCourses.length > 1 ? (
        <motion.div
          key="selection"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 mx-auto mb-6"
              >
                <CreditCard size={40} />
              </motion.div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                Select a <span className="text-indigo-600">Course</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                Choose a program to manage your financial records
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-6">
              {enrolledCourses.map((course, idx) => (
                <motion.button
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                  onClick={() => setSelectedCourse(course.name)}
                  className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 text-left transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-2 hover:border-indigo-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150" />
                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-2xl ${course.bg} ${course.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm font-black`}
                    >
                      <course.icon size={28} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                      {course.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-loose flex items-center gap-2">
                      Manage Payments
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
              <div className="flex items-center gap-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50"
                >
                  <CreditCard size={32} />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    My <span className="text-indigo-600">Payments</span>
                  </h1>
                  {enrolledCourses.length > 1 && (
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="mt-1 px-3 py-1 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 rounded-lg text-[10px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-all"
                    >
                      Switch Course
                    </button>
                  )}
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                    <TrendingUp size={14} className="text-indigo-400" />
                    {selectedCourse} • Financial Overview
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("open-pay-modal", {
                      detail: { course: selectedCourse },
                    }),
                  )
                }
                className="px-4 py-2 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-tighter"
              >
                Raise New Payment
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 items-start">
            {/* Main Section - Activity & Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="lg:col-span-12 space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-500">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Total Paid
                  </h3>
                  <p className="text-3xl font-black text-gray-900">
                    {formatCurrency(totalPaid, "USD")}
                  </p>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                      <CreditCard size={20} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Total Balance
                  </h3>
                  <p className="text-3xl font-black text-gray-900">
                    {formatCurrency(totalBalance, "USD")}
                  </p>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-500">
                      <Clock size={20} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Due This Month
                  </h3>
                  <p className="text-3xl font-black text-gray-900">
                    {formatCurrency(totalDueThisMonth, "USD")}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    Recent <span className="text-indigo-600">Transactions</span>
                  </h2>
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("open-history-modal"),
                      )
                    }
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
                  >
                    View All
                  </button>
                </div>
                <StudentPayment
                  selectedCourse={selectedCourse || undefined}
                  installments={installments}
                  payments={payments}
                  enrolledCourses={enrolledCourses}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
