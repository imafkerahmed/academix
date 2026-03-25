"use client";

import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  FileText,
  CheckCircle,
  Download,
  Printer,
  X,
} from "lucide-react";
import { RaisePaymentModal } from "@/components/student/RaisePaymentModal";

// Types
// Types used in sub-components deleted if unused here

interface StudentPaymentProps {
  selectedCourse?: string;
  installments?: {
    id: string;
    due_date: string;
    remarks?: string;
    amount: number;
    status: string;
    enrollment: string;
    payment_type?: string;
  }[];
  payments?: {
    id: string;
    date_paid?: string;
    created?: string;
    remarks?: string;
    amount: number;
    verified: boolean;
    enrollment: string;
    payment_type: string;
    reference_Id?: string;
  }[];
  enrolledCourses?: {
    id: string;
    name: string;
    registration_number?: string;
  }[];
  globalCurrency?: string;
  paymentInstructions?: string;
}

export default function StudentPayment({
  selectedCourse,
  installments = [],
  payments = [],
  enrolledCourses = [],
  globalCurrency = "USD",
  paymentInstructions = "",
}: StudentPaymentProps) {
  // Find registration and upfront payments for the course
  // registrationPayments and upfrontPayments should be filtered from the mapped paymentFeed below
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [activeCourse, setActiveCourse] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Course theme mapping
  const courseThemes: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    "Graphic Design": {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
    },
    "Web Development": {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
    },
    Exam: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
    },
    Library: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-100",
    },
  };

  const getTheme = (name?: string) =>
    courseThemes[name || ""] || {
      bg: "bg-gray-50",
      text: "text-gray-500",
      border: "border-gray-100",
    };

  // Real data will be fetched from PocketBase via props
  const courseOptions = useMemo(() => enrolledCourses.map((c) => c.name), [enrolledCourses]);

  const closePayModal = () => {
    setShowPayModal(false);
  };

  useEffect(() => {
    if (selectedCourse && selectedCourse !== activeCourse) {
      setTimeout(() => setActiveCourse(selectedCourse), 0);
    } else if (courseOptions.length === 1 && !activeCourse) {
      setTimeout(() => setActiveCourse(courseOptions[0]), 0);
    }
  }, [selectedCourse, courseOptions, activeCourse]);

  useEffect(() => {
    const handleOpenPay = (e: CustomEvent<{ course?: string }>) => {
      if (e.detail?.course) setActiveCourse(e.detail.course);
      setShowPayModal(true);
    };
    const handleOpenHistory = () => setShowHistoryModal(true);

    window.addEventListener("open-pay-modal", handleOpenPay as EventListener);
    window.addEventListener("open-history-modal", handleOpenHistory as EventListener);
    return () => {
      window.removeEventListener("open-pay-modal", handleOpenPay as EventListener);
      window.removeEventListener(
        "open-history-modal",
        handleOpenHistory as EventListener,
      );
    };
  }, []);

  // Group installments and payments by course
  const course = selectedCourse;
  // Map installments to feed items
  const installmentFeed = useMemo(() => {
    const relevantInstallments = installments.filter((i) =>
      enrolledCourses.find((c) => c.name === course && c.id === i.enrollment),
    );
    return relevantInstallments.map((i) => ({
      id: i.id,
      date: i.due_date,
      description: i.remarks || "Installment Due",
      amount: i.amount,
      currency: globalCurrency,
      status: i.status === "paid" ? "Paid" : "Pending",
      course,
      payment_type: i.payment_type || "installment", // Ensure payment_type exists
      reference_Id: undefined as string | undefined,
    }));
  }, [installments, enrolledCourses, course, globalCurrency]);

  // Map payments to feed items
  const paymentFeed = useMemo(() => {
    const relevantPayments = payments.filter((p) =>
      enrolledCourses.find((c) => c.name === course && c.id === p.enrollment),
    );
    return relevantPayments.map((p) => ({
      id: p.id,
      date: p.date_paid || p.created || "",
      description: p.remarks || "Payment",
      amount: p.amount,
      currency: globalCurrency,
      status: p.verified ? "Paid" : "Pending",
      course,
      payment_type: p.payment_type,
      reference_Id: p.reference_Id,
    }));
  }, [payments, enrolledCourses, course, globalCurrency]);

  // derive combined history from installments and payments feeds
  const history = useMemo(
    () => [...installmentFeed, ...paymentFeed],
    [installmentFeed, paymentFeed],
  );

  // Get current month/year
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  // Filter pending installments for current month
  const pendingThisMonth = installmentFeed.filter(
    (i) =>
      i.status === "Pending" &&
      new Date(i.date).getMonth() === currentMonth &&
      new Date(i.date).getFullYear() === currentYear,
  );

  // Calculate total balance for the selected course
  const totalBalance = useMemo(() => {
    // Sum all pending installment amounts for the selected course
    return installmentFeed
      .filter((i) => i.status === "Pending")
      .reduce((sum, i) => sum + i.amount, 0);
  }, [installmentFeed]);

  // prepare options for pay modal
  const paymentOptions = useMemo(() => {
    // start with due this month installments
    let opts = pendingThisMonth.map((i) => ({
      ...i,
      label: i.description,
    }));

    // additionally include any pending registration/upfront payments
    const extra = paymentFeed
      .filter(
        (p) =>
          p.status === "Pending" &&
          (p.payment_type === "registration" || p.payment_type === "upfront"),
      )
      .map((p) => ({
        id: p.id,
        date: p.date,
        description: p.description,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        course: p.course,
        payment_type: p.payment_type,
        reference_Id: p.reference_Id,
        label:
          p.payment_type === "registration"
            ? "Registration Fee"
            : "Upfront Fee",
      }));

    opts = [...opts, ...extra];

    if (opts.length > 0) return opts;

    // fallback option: full balance
    return [
      {
        id: "full",
        label: "Full Balance",
        amount: totalBalance,
        currency: globalCurrency,
        status: "Pending",
        reference_Id: undefined as string | undefined,
      },
    ];
  }, [pendingThisMonth, totalBalance, paymentFeed, globalCurrency]);
  // Find registration and upfront payments using payment_type field
  // Show registration and upfront payments for the selected course, regardless of status
  const registrationPayments = paymentFeed.filter(
    (p) => p.payment_type === "registration",
  );
  const upfrontPayments = paymentFeed.filter(
    (p) => p.payment_type === "upfront",
  );

  let filteredFeed;
  if (pendingThisMonth.length > 0) {
    filteredFeed = [
      ...pendingThisMonth,
      ...registrationPayments,
      ...upfrontPayments,
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  } else {
    // Always show registration and upfront payments, plus up to 3 most recent verified payments
    const verifiedPayments = [
      ...registrationPayments,
      ...upfrontPayments,
      ...paymentFeed.filter(
        (p) =>
          p.status === "Paid" &&
          p.payment_type !== "registration" &&
          p.payment_type !== "upfront",
      ),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    filteredFeed = verifiedPayments.slice(0, 3);
  }

  const handleSubmitReceipt = async (
    _data: { // eslint-disable-line @typescript-eslint/no-unused-vars
      selectedInvoice: unknown;
      files: File[];
      remarks: string;
    }
  ) => {
    await new Promise((r) => setTimeout(r, 1500));
    setShowPayModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount,
    );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Financial Timeline Ledger */}
      <div className="relative pl-12 space-y-12">
        {/* The Axis Line */}
        <div
          className="absolute left-6 top-2 bottom-2 w-0.5 bg-dashed bg-gray-100/50"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent, #E5E7EB 50%, transparent)",
            backgroundSize: "1px 12px",
          }}
        />

        {filteredFeed.map((item, idx) => {
          const theme = getTheme(item.course);
          const isPending = item.status === "Pending";
          const isPaid = item.status === "Paid";

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative group"
            >
              {/* Milestone Node */}
              <div
                className={`absolute -left-[30px] top-4 w-5 h-5 rounded-full border-4 border-white shadow-lg transition-all duration-500 z-10 
                ${
                  isPaid
                    ? "bg-green-500 ring-4 ring-green-100"
                    : isPending
                      ? "bg-amber-500 ring-4 ring-amber-100"
                      : "bg-red-500 ring-4 ring-red-100"
                } 
                group-hover:scale-125`}
              />

              {/* Ledger Card */}
              <div className="bg-white rounded-[2rem] border border-gray-100 p-6 flex items-center justify-between transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/30 hover:-translate-y-1 relative overflow-hidden group/card">
                {/* Subtle Background Pattern */}
                <div
                  className={`absolute top-0 right-0 w-24 h-24 ${theme.bg} rounded-full -mr-12 -mt-12 opacity-50 transition-transform duration-700 group-hover/card:scale-150`}
                />

                <div className="flex items-center gap-6 relative z-10">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                      isPaid
                        ? "bg-green-50 text-green-600"
                        : isPending
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-lg tracking-tight group-hover/card:text-indigo-600 transition-colors">
                      {item.payment_type === "registration"
                        ? "Registration Fee"
                        : item.payment_type === "upfront"
                          ? "Upfront Fee"
                          : item.description}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>{item.date}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                      <span className={`${theme.text}`}>
                        {item.course || "General"}
                      </span>
                      {item.reference_Id && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                          <span className="text-gray-500">Ref: {item.reference_Id}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-8 relative z-10">
                  <div className="hidden sm:block">
                    <div
                      className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 bg-gray-50/50 flex items-center gap-2 ${
                        isPaid
                          ? "text-green-600 border-green-100"
                          : isPending
                            ? "text-amber-600 border-amber-100"
                            : "text-red-600 border-red-100"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-green-500" : isPending ? "bg-amber-500" : "bg-red-500"}`}
                      />
                      {item.status}
                    </div>
                  </div>
                  <p className="font-black text-2xl text-gray-900 tracking-tighter">
                    {formatCurrency(item.amount, item.currency)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredFeed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
            <CreditCard className="text-gray-300 mb-4" size={32} />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Timeline is currently empty
            </p>
          </div>
        )}
      </div>

      {/* Raise Payment Modal */}
      <RaisePaymentModal
        isOpen={showPayModal}
        onClose={closePayModal}
        activeCourse={activeCourse}
        registrationNumber={
          enrolledCourses.find((c) => c.name === activeCourse)
            ?.registration_number
        }
        paymentOptions={paymentOptions}
        onSubmit={handleSubmitReceipt}
        theme={getTheme(activeCourse)}
        paymentInstructions={paymentInstructions}
      />

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-white rounded-3xl shadow-2xl p-6 flex items-center gap-4 border border-green-100"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="font-black text-gray-900 uppercase tracking-tight">
                Receipt Uploaded
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Awaiting admin verification
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <PaymentHistoryModal
            onClose={() => setShowHistoryModal(false)}
            history={history}
            courseOptions={courseOptions}
            selectedCourse={selectedCourse}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component: Financial History Modal
function PaymentHistoryModal({
  onClose,
  history,
  courseOptions,
  selectedCourse,
}: {
  onClose: () => void;
  history: {
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
    status: string;
    course?: string;
    payment_type?: string;
    reference_Id?: string;
  }[];
  courseOptions: string[];
  selectedCourse?: string;
}) {
  const [filterCourse, setFilterCourse] = useState(selectedCourse || "");

  useEffect(() => {
    if (selectedCourse && selectedCourse !== filterCourse) {
      setTimeout(() => setFilterCourse(selectedCourse), 0);
    }
  }, [selectedCourse, filterCourse]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount,
    );

  const mergedRows = useMemo(() => {
    // Show all verified payments (including registration/upfront) and pending
    // payments only if they fall in the current month/year
    
    const allPayments = history.map((h) => ({ ...h, type: "Payment" }));
    return allPayments
      .filter((r: {
        id: string;
        date: string;
        description: string;
        amount: number;
        currency: string;
        status: string;
        course?: string;
        payment_type?: string;
        reference_Id?: string;
        type: string;
      }) => {
        if (filterCourse && r.course !== filterCourse) return false;
        return true;
      })
      .sort(
        (a: { date: string }, b: { date: string }) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
  }, [history, filterCourse]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
      >
        <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
              Finance <span className="text-indigo-600">Sync</span>
            </h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
              Comprehensive Account Statement
            </p>
          </div>
          <div className="flex items-center gap-6">
            {!selectedCourse && (
              <select
                className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <option value="">All Streams</option>
                {courseOptions.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={onClose}
              className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-4 bg-gray-50/30">
          {mergedRows.length > 0 ? (
            mergedRows.map((row) => (
              <div
                key={row.id}
                className="bg-white rounded-[2.5rem] p-8 border border-gray-100 flex items-center justify-between transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-8">
                  <div
                    className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black shadow-sm transition-all duration-500 ${
                      row.status === "Paid"
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : row.status === "Pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : row.status === "Outstanding"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {row.type === "Invoice" ? (
                      <FileText size={28} />
                    ) : (
                      <CheckCircle size={28} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-xl tracking-tight transition-colors group-hover:text-indigo-600">
                      {row.payment_type === "registration"
                        ? "Registration Fee"
                        : row.payment_type === "upfront"
                          ? "Upfront Fee"
                          : row.description}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                      <span>{row.date}</span>
                      <span className="w-2 h-2 rounded-full bg-gray-200" />
                      <span className="text-indigo-400">
                        {row.course || "System Fee"}
                      </span>
                      {row.reference_Id && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-gray-200" />
                          <span className="text-gray-500">Ref: {row.reference_Id}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-12">
                  <div>
                    <p className="font-black text-2xl text-gray-900 tracking-tighter">
                      {formatCurrency(row.amount, row.currency)}
                    </p>
                    <div
                      className={`mt-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 ${
                        row.status === "Paid"
                          ? "bg-green-50 text-green-600 border-green-200"
                          : row.status === "Pending"
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-red-50 text-red-600 border-red-200"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${row.status === "Paid" ? "bg-green-600" : row.status === "Pending" ? "bg-amber-600" : "bg-red-600"}`}
                      />
                      {row.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-12 h-12 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-all">
                      <Printer size={20} />
                    </button>
                    <button className="w-12 h-12 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-all">
                      <Download size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-dashed border-gray-100 opacity-60">
              <FileText className="text-gray-200 mb-6" size={64} />
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
                No Financial Records Found
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
