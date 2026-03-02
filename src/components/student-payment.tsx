"use client";

import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Printer,
  X,
  ArrowRight,
} from "lucide-react";

// Types
type PaymentStatus = "Paid" | "Pending" | "Failed";

type PaymentDue = {
  amount: number;
  currency: string;
  dueDate: string;
  description?: string;
  course?: string;
};

type CourseInfo = {
  courseName: string;
  totalFee: number;
  currency: string;
};

type PaymentHistoryItem = {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  receiptUrl?: string;
  course?: string;
};

interface StudentPaymentProps {
  selectedCourse?: string;
  installments?: any[];
  payments?: any[];
  enrolledCourses?: any[];
}

export default function StudentPayment({
  selectedCourse,
  installments = [],
  payments = [],
  enrolledCourses = [],
}: StudentPaymentProps) {
  // Find registration and upfront payments for the course
  // registrationPayments and upfrontPayments should be filtered from the mapped paymentFeed below
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [activeCourse, setActiveCourse] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [modalStep, setModalStep] = useState(1); // 1 = choose amount, 2 = upload/remarks
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [processing, setProcessing] = useState(false);
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
  const courseOptions = enrolledCourses.map((c) => c.name);

  const onFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    const urls = arr.map((f) => URL.createObjectURL(f));
    setFiles(arr);
    setPreviews(urls);
    setFileError("");
  };

  const resetForm = () => {
    if (!selectedCourse) setActiveCourse("");
    setFiles([]);
    setPreviews([]);
    setFileError("");
    setRemarks("");
    setSelectedInvoice(null);
    setModalStep(1);
  };

  const closePayModal = () => {
    resetForm();
    setShowPayModal(false);
  };

  useEffect(() => {
    if (selectedCourse) {
      setActiveCourse(selectedCourse);
    } else if (courseOptions.length === 1 && !activeCourse) {
      setActiveCourse(courseOptions[0]);
    }
  }, [selectedCourse, courseOptions, activeCourse]);

  useEffect(() => {
    const handleOpenPay = (e: any) => {
      if (e.detail?.course) setActiveCourse(e.detail.course);
      setSelectedInvoice(null);
      setShowPayModal(true);
    };
    const handleOpenHistory = () => setShowHistoryModal(true);

    window.addEventListener("open-pay-modal", handleOpenPay as any);
    window.addEventListener("open-history-modal", handleOpenHistory as any);
    return () => {
      window.removeEventListener("open-pay-modal", handleOpenPay as any);
      window.removeEventListener(
        "open-history-modal",
        handleOpenHistory as any,
      );
    };
  }, []);

  // Group installments and payments by course
  const course = selectedCourse;
  const courseInstallments = installments.filter((i) =>
    enrolledCourses.find((c) => c.name === course && c.id === i.enrollment),
  );
  const coursePayments = payments.filter((p) =>
    enrolledCourses.find((c) => c.name === course && c.id === p.enrollment),
  );
  // Map installments to feed items
  const installmentFeed = courseInstallments.map((i) => ({
    id: i.id,
    date: i.due_date,
    description: i.remarks || "Installment Due",
    amount: i.amount,
    currency: "USD",
    status: i.status === "paid" ? "Paid" : "Pending",
    course,
    payment_type: i.payment_type || "installment", // Ensure payment_type exists
  }));
  // Map payments to feed items
  const paymentFeed = coursePayments.map((p) => ({
    id: p.id,
    date: p.date_paid || p.created || "",
    description: p.remarks || "Payment",
    amount: p.amount,
    currency: "USD",
    status: p.verified ? "Paid" : "Pending",
    course,
    payment_type: p.payment_type,
  }));

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
        currency: "USD",
        status: "Pending",
      },
    ];
  }, [pendingThisMonth, totalBalance, paymentFeed]);
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

  const handleSubmitReceipt = async () => {
    if (courseOptions.length > 0 && !activeCourse) {
      setFileError("Please select a course.");
      return;
    }
    if (!selectedInvoice) {
      setFileError("Please choose an amount to pay.");
      return;
    }
    if (files.length === 0) {
      setFileError("Please upload at least one receipt image.");
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));

    // TODO: Integrate with PocketBase payments API
    setProcessing(false);
    setShowPayModal(false);
    resetForm();
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
      <AnimatePresence>
        {showPayModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePayModal}
          >
            <motion.div
              className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.95 }}
            >
              <button
                className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all font-bold"
                onClick={closePayModal}
              >
                <X size={24} />
              </button>

              <div className="text-3xl font-black mb-10 uppercase tracking-tighter text-gray-900">
                Raise New <span className="text-indigo-600">Payment</span>
              </div>

              <div className="space-y-8">
                {/* Course Indicator */}
                <div
                  className={`p-8 rounded-[2.5rem] border ${getTheme(activeCourse).bg} ${getTheme(activeCourse).border} relative overflow-hidden group transition-all duration-700`}
                >
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">
                      Manage Payment For
                    </p>
                    <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                      {activeCourse || "General Account"}
                    </h4>
                  </div>
                </div>

                {activeCourse ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    {/* two-step wizard inside modal */}
                    {modalStep === 1 ? (
                      <>
                        <fieldset className="space-y-4">
                          <legend className="text-sm font-black text-gray-500 uppercase tracking-widest ml-1">
                            Select Amount to Pay
                          </legend>
                          {paymentOptions.map((opt: any) => (
                            <label
                              key={opt.id}
                              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-lg cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <input
                                  type="radio"
                                  name="invoice"
                                  value={opt.id}
                                  checked={selectedInvoice?.id === opt.id}
                                  onChange={() => setSelectedInvoice(opt)}
                                  className="form-radio h-5 w-5 text-indigo-600"
                                />
                                <span className="text-sm font-bold text-gray-900">
                                  {opt.label}
                                </span>
                              </div>
                              <span className="inline-block px-3 py-1 text-xs font-black uppercase tracking-wide bg-gray-100 rounded-full">
                                {formatCurrency(opt.amount, opt.currency)}
                              </span>
                            </label>
                          ))}
                        </fieldset>

                        <div className="text-right">
                          <button
                            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white font-black py-3 px-6 rounded-[2rem] shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50"
                            disabled={!selectedInvoice}
                            onClick={() => setModalStep(2)}
                          >
                            Continue
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {selectedInvoice && (
                          <div className="text-sm font-bold text-gray-700">
                            Amount to pay:{" "}
                            {formatCurrency(
                              selectedInvoice.amount,
                              selectedInvoice.currency,
                            )}
                          </div>
                        )}

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4">
                            Upload Multi-receipts
                          </label>
                          <div className="relative group">
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                              onChange={(e) => onFilesSelected(e.target.files)}
                            />
                            <div className="w-full border-4 border-dashed border-gray-50 bg-gray-50/30 rounded-[2.5rem] p-12 text-center group-hover:border-indigo-100 group-hover:bg-indigo-50/10 transition-all duration-500">
                              <Plus
                                className="mx-auto text-gray-300 group-hover:text-indigo-600 mb-4"
                                size={40}
                              />
                              <p className="text-lg font-black text-gray-500 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                Drop files or click
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4">
                            Remarks
                          </label>
                          <textarea
                            className="w-full bg-gray-50 border-gray-100 rounded-[2rem] p-8 text-sm font-bold focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all outline-none min-h-[140px]"
                            placeholder="Type any instructions..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                        </div>

                        <div className="flex justify-between mt-6">
                          <button
                            className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 font-black py-3 px-6 rounded-[2rem] hover:bg-gray-300 transition-all"
                            onClick={() => setModalStep(1)}
                          >
                            Back
                          </button>
                          <button
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-black py-3 px-6 rounded-[2rem] shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50"
                            disabled={
                              processing || !activeCourse || files.length === 0
                            }
                            onClick={handleSubmitReceipt}
                          >
                            {processing
                              ? "Uploading Data..."
                              : "Confirm & Submit"}
                            {!processing && <ArrowRight size={18} />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                    <AlertCircle
                      className="mx-auto text-amber-500 mb-4"
                      size={48}
                    />
                    <p className="text-sm font-black text-gray-600 uppercase tracking-widest">
                      Please select an amount to pay
                    </p>
                  </div>
                )}

                {previews.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto py-2 px-2 scrollbar-hide">
                    {previews.map((src, i) => (
                      <div
                        key={i}
                        className="relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-lg"
                      >
                        <img src={src} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <button
                      onClick={resetForm}
                      className="flex-shrink-0 w-20 h-20 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black uppercase text-[10px]"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {fileError && (
                  <p className="text-red-600 font-black text-xs text-center">
                    {fileError}
                  </p>
                )}

                <button
                  className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-1 transition-all duration-300 uppercase tracking-tighter disabled:opacity-50 disabled:translate-y-0"
                  disabled={processing || !activeCourse || files.length === 0}
                  onClick={handleSubmitReceipt}
                >
                  {processing
                    ? "Uploading Data..."
                    : "Confirm Payment Submission"}
                  {!processing && <ArrowRight size={20} />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
}: any) {
  const [filterCourse, setFilterCourse] = useState(selectedCourse || "");

  useEffect(() => {
    // Sync with selectedCourse if it changes externally
    if (selectedCourse) setFilterCourse(selectedCourse);
  }, [selectedCourse]);

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
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const allPayments = history.map((h: any) => ({ ...h, type: "Payment" }));
    return allPayments
      .filter((r: any) => {
        if (filterCourse && r.course !== filterCourse) return false;
        if (r.status === "Paid") return true;
        if (r.status === "Pending") {
          const d = new Date(r.date);
          return (
            d.getMonth() === currentMonth && d.getFullYear() === currentYear
          );
        }
        return false;
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
            mergedRows.map((row: any) => (
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
