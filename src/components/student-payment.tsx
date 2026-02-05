"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
// PaymentHistoryModal is now inlined below for easier maintenance

type PaymentStatus = "Paid" | "Pending" | "Failed";

type PaymentDue = {
  amount: number;
  currency: string;
  dueDate: string; // YYYY-MM-DD
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
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  receiptUrl?: string;
  course?: string;
};

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export default function StudentPayment() {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock data for course fees
  const courseFees: CourseInfo[] = [
    {
      courseName: "Spring 2026 Tuition",
      totalFee: 3600, // Total course fee
      currency: "USD",
    },
    {
      courseName: "Physics Lab",
      totalFee: 600,
      currency: "USD",
    },
  ];

  // Mock data for outstanding dues (current installment)
  const mockDues: PaymentDue[] = [
    {
      amount: 1200, // Current installment due
      currency: "USD",
      dueDate: "2026-02-15",
      description: "Spring 2026 Tuition (Installment 2)",
      course: "Spring 2026 Tuition",
    },
    {
      amount: 300, // Current installment due
      currency: "USD",
      dueDate: "2026-02-20",
      description: "Physics Lab Fee",
      course: "Physics Lab",
    },
  ];

  // Mock data for history (stateful to reflect new submissions)
  const [history, setHistory] = useState<PaymentHistoryItem[]>([
    {
      id: "pmt-001",
      date: "2026-01-15",
      description: "Spring 2026 Tuition (Installment 1)",
      amount: 1200,
      currency: "USD",
      status: "Paid",
      receiptUrl: "/sample-receipt.pdf",
      course: "Spring 2026 Tuition",
    },
    {
      id: "pmt-002",
      date: "2025-11-10",
      description: "Exam Fee",
      amount: 150,
      currency: "USD",
      status: "Paid",
      receiptUrl: "/sample-receipt.pdf",
      course: "Exam",
    },
    {
      id: "pmt-003",
      date: "2025-10-05",
      description: "Library Fine",
      amount: 25,
      currency: "USD",
      status: "Failed",
      course: "Library",
    },
  ]);

  const courseOptions = useMemo(() => {
    const duesCourses = mockDues
      .map((d) => d.course)
      .filter(Boolean) as string[];
    const historyCourses = history
      .map((h) => h.course)
      .filter(Boolean) as string[];
    return uniq([...duesCourses, ...historyCourses].sort());
  }, [mockDues, history]);

  const outstandingTotal = useMemo(
    () => mockDues.reduce((sum, d) => sum + (d.amount || 0), 0),
    [mockDues],
  );
  const earliestDue = useMemo(() => {
    if (!mockDues.length) return undefined;
    return [...mockDues].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  }, [mockDues]);
  const lastPaid = useMemo(() => {
    const paid = history.filter((h) => h.status === "Paid");
    const list = paid.length ? paid : history;
    if (!list.length) return undefined;
    return [...list].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [history]);

  // Rotate through outstanding dues when multiple exist
  const duesForRotation = useMemo(() => [...mockDues], [mockDues]);
  const [dueIndex, setDueIndex] = useState(0);
  React.useEffect(() => {
    if (duesForRotation.length <= 1) {
      setDueIndex(0);
      return;
    }
    const id = setInterval(() => {
      setDueIndex((i) => (i + 1) % duesForRotation.length);
    }, 3500);
    return () => clearInterval(id);
  }, [duesForRotation.length]);

  // Helper for consistent currency formatting (avoid SSR/CSR mismatch)
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount,
    );

  const onFilesSelected = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    const urls: string[] = [];
    arr.forEach((f) => {
      if (f.type.startsWith("image/")) urls.push(URL.createObjectURL(f));
      if (f.type === "application/pdf") urls.push(URL.createObjectURL(f));
    });
    setFiles(arr);
    setPreviews(urls);
    setFileError("");
  };

  const clearUploads = () => {
    setFileError("");
    setFiles([]);
    previews.forEach((u) => URL.revokeObjectURL(u));
    setPreviews([]);
  };

  const closePayModal = () => {
    clearUploads();
    setSelectedCourse("");
    setRemarks("");
    setShowPayModal(false);
  };

  React.useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [showSuccess]);

  // Prevent background scrolling when modals are open
  React.useEffect(() => {
    if (showPayModal || showSuccess || showHistoryModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showPayModal, showSuccess, showHistoryModal]);

  // Pre-select if only one course
  React.useEffect(() => {
    if (courseOptions.length === 1 && !selectedCourse) {
      setSelectedCourse(courseOptions[0]);
    }
  }, [courseOptions.length, selectedCourse]);

  const handleSubmitReceipt = async () => {
    if (courseOptions.length > 0 && !selectedCourse) {
      setFileError("Please select a course.");
      return;
    }
    if (files.length === 0) {
      setFileError("Please upload at least one receipt file.");
      return;
    }
    setProcessing(true);
    await new Promise((res) => setTimeout(res, 1000));

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const fileNames = files.map((f) => f.name).join(", ");
    const selectedDue = selectedCourse
      ? mockDues.find((d) => d.course === selectedCourse)
      : undefined;

    const pending: PaymentHistoryItem = {
      id: `pmt-${Date.now()}`,
      date: dateStr,
      description: `Receipt submitted${
        selectedCourse ? ` [Course: ${selectedCourse}]` : ""
      }: ${fileNames}${remarks ? ` — ${remarks}` : ""}`,
      amount: 0,
      currency: selectedDue?.currency || "USD",
      status: "Pending",
      course: selectedCourse || undefined,
    };

    setHistory((prev) => [pending, ...prev]);
    setProcessing(false);
    setShowPayModal(false);
    clearUploads();
    setSelectedCourse("");
    setRemarks("");
    setShowSuccess(true);
  };

  return (
    <div className="border border-gray-300 shadow-lg rounded-xl w-full h-full px-6 py-4 bg-white flex flex-col">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold">Payments</h2>
      </div>

      {/* Summaries */}
      <div className="mt-4 space-y-3">
        {/* Outstanding Summary (carousel per course) */}
        <div className="border border-red-300 bg-red-50 rounded-lg p-4">
          <div className="text-xs text-red-700 font-semibold">Outstanding</div>
          <div className="relative mt-2 h-16 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {duesForRotation.length > 0 ? (
                duesForRotation.slice(dueIndex, dueIndex + 1).map((d) => (
                  <motion.div
                    key={`${d.course}-${d.dueDate}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-red-700">
                        {formatCurrency(d.amount, d.currency)}
                      </div>
                      <div className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold max-w-[60%] truncate">
                        {d.course || "Course"}
                      </div>
                    </div>
                    <div className="text-xs text-red-700 mt-1">
                      Due: {d.dueDate}
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="no-dues"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 flex items-center text-xs text-red-700"
                >
                  No outstanding dues
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Dots removed per request to reduce visual height */}
        </div>

        {/* Last Payment (extra-compact) */}
        <div className="border border-gray-200 bg-gray-50 rounded-lg p-2">
          <div className="text-[10px] text-gray-700 font-semibold">
            Last Payment
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <div className="text-lg font-bold text-gray-800 leading-tight">
              {lastPaid
                ? formatCurrency(lastPaid.amount, lastPaid.currency)
                : "—"}
            </div>
            <div
              className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                lastPaid?.status === "Paid"
                  ? "bg-green-100 text-green-700"
                  : lastPaid?.status === "Pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-200 text-gray-700"
              }`}
            >
              {lastPaid?.status ?? "N/A"}
            </div>
          </div>
          <div className="text-[10px] text-gray-600 mt-0 leading-snug truncate">
            {lastPaid
              ? `Date: ${lastPaid.date}${lastPaid.course ? ` — ${lastPaid.course}` : ""}`
              : "No payment history"}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="mt-auto pt-4 w-full flex flex-col gap-2">
        <button
          className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          onClick={() => setShowPayModal(true)}
        >
          RAISE NEW PAYMENTS
        </button>
        <button
          className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          onClick={() => setShowHistoryModal(true)}
        >
          VIEW ALL PAYMENTS
        </button>
      </div>

      {/* Submit Receipt Modal */}
      <AnimatePresence>
        {showPayModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={closePayModal}
            aria-modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 24, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 16, scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                onClick={closePayModal}
                aria-label="Close"
              >
                &times;
              </button>
              <div className="textt -lg font-semibold mb-4 uppercase">
                RAISE PAYMENT
              </div>
              <div className="space-y-3">
                {/* Course selection inside modal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Course
                  </label>
                  <select
                    className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="">Select a course</option>
                    {courseOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {selectedCourse && (
                    <div className="mt-3 border border-red-300 bg-red-50 rounded-lg p-3">
                      {(() => {
                        const d = mockDues.find(
                          (x) => x.course === selectedCourse,
                        );
                        return d ? (
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-red-700 font-semibold">
                                Outstanding
                              </span>
                              <span className="text-base font-bold text-red-700">
                                {formatCurrency(d.amount, d.currency)}
                              </span>
                            </div>
                            <div className="text-xs text-red-600 mt-1">
                              Due: {d.dueDate}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-red-600">
                            No outstanding for the selected course.
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Upload + remarks gated by course */}
                {!courseOptions.length || selectedCourse ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700">
                      Receipt Files
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      multiple
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onChange={(e) => onFilesSelected(e.target.files)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks (optional)
                      </label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        rows={3}
                        placeholder="Any notes for the admin..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-red-600">
                    Select a course to continue.
                  </div>
                )}

                {fileError && (
                  <div className="text-xs text-red-600">{fileError}</div>
                )}
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {previews.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt="Receipt preview"
                        className="w-full h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
                {files.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{files.length} file(s) selected</span>
                    <button
                      type="button"
                      className="text-indigo-600 hover:underline"
                      onClick={clearUploads}
                    >
                      Clear
                    </button>
                  </div>
                )}
                <button
                  className="w-full mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 uppercase"
                  disabled={
                    processing ||
                    files.length === 0 ||
                    (courseOptions.length > 0 && !selectedCourse)
                  }
                  onClick={handleSubmitReceipt}
                >
                  {processing ? "Submitting..." : "Submit Receipt"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success toast */}
      <AnimatePresence>
        {showSuccess && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            aria-modal
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-9 h-9 text-green-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <div className="text-lg font-semibold text-gray-800">
                Payment submitted successfully
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Payment will be verified by the admin shortly.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* History modal */}
      {showHistoryModal && (
        <PaymentHistoryModal
          onClose={() => setShowHistoryModal(false)}
          history={history}
          mockDues={mockDues}
          courseFees={courseFees}
          courseOptions={courseOptions}
        />
      )}
    </div>
  );
}

// Inlined PaymentHistoryModal for easier maintenance
type PaymentHistoryModalProps = {
  onClose: () => void;
  history: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
    status: "Paid" | "Pending" | "Failed";
    receiptUrl?: string;
    course?: string;
  }>;
  mockDues: Array<{
    amount: number;
    currency: string;
    dueDate: string;
    description?: string;
    course?: string;
  }>;
  courseFees: Array<{
    courseName: string;
    totalFee: number;
    currency: string;
  }>;
  courseOptions: string[];
};

function PaymentHistoryModal({
  onClose,
  history,
  mockDues,
  courseFees,
  courseOptions,
}: PaymentHistoryModalProps) {
  type ModalPaymentStatus = "Paid" | "Pending" | "Failed" | "Outstanding";
  type HistoryRow = {
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
    status: ModalPaymentStatus;
    course?: string;
    receiptUrl?: string;
  };

  const [filterCourse, setFilterCourse] = useState("");
  const [preview, setPreview] = useState<null | { url: string; type: string }>(
    null,
  );

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount,
    );

  const outstandingRows: HistoryRow[] = useMemo(
    () =>
      mockDues
        .filter((d) => !filterCourse || d.course === filterCourse)
        .map((d) => ({
          id: `due-${d.course}-${d.dueDate}`,
          date: d.dueDate,
          description: d.description || d.course || "",
          amount: d.amount,
          currency: d.currency,
          status: "Outstanding" as ModalPaymentStatus,
          course: d.course,
          receiptUrl: undefined,
        })),
    [mockDues, filterCourse],
  );

  const filteredHistory: HistoryRow[] = (
    filterCourse ? history.filter((h) => h.course === filterCourse) : history
  ).map((h) => ({ ...h }));

  const allRows: HistoryRow[] = [...outstandingRows, ...filteredHistory];

  // Calculate summary statistics
  // Current Due = Current installment amount due
  const currentDue = useMemo(
    () =>
      mockDues
        .filter((d) => !filterCourse || d.course === filterCourse)
        .reduce((sum, d) => sum + d.amount, 0),
    [mockDues, filterCourse],
  );

  // Total Paid = Sum of all successful payments
  const totalPaid = useMemo(
    () =>
      history
        .filter((h) => h.status === "Paid")
        .filter((h) => !filterCourse || h.course === filterCourse)
        .reduce((sum, h) => sum + h.amount, 0),
    [history, filterCourse],
  );

  // Balance = Total course fees - Total paid
  const balance = useMemo(() => {
    const totalCourseFees = courseFees
      .filter((c) => !filterCourse || c.courseName === filterCourse)
      .reduce((sum, c) => sum + c.totalFee, 0);
    return totalCourseFees - totalPaid;
  }, [courseFees, totalPaid, filterCourse]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl md:rounded-3xl w-full max-w-4xl shadow-2xl relative max-h-[95vh] md:max-h-[90vh] flex flex-col m-2 md:m-4"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 50, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="relative p-4 md:p-6 pb-3 md:pb-4 border-b border-gray-200">
          <button
            className="absolute top-4 md:top-6 right-4 md:right-6 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 pr-10">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg
                className="w-5 h-5 md:w-7 md:h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                Payment History
              </h2>
              <p className="text-xs md:text-sm text-gray-500 truncate">
                View transactions & dues
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
            <div
              className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg md:rounded-xl p-2 md:p-3 border-2 border-red-200"
              title="Current installment due"
            >
              <div className="text-[10px] md:text-xs font-semibold text-red-700 mb-0.5 md:mb-1 uppercase tracking-wide">
                Due Now
              </div>
              <div className="text-sm md:text-xl font-bold text-red-700 truncate">
                {formatCurrency(currentDue, "USD")}
              </div>
            </div>
            <div
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg md:rounded-xl p-2 md:p-3 border-2 border-green-200"
              title="Total amount paid so far"
            >
              <div className="text-[10px] md:text-xs font-semibold text-green-700 mb-0.5 md:mb-1 uppercase tracking-wide">
                Total Paid
              </div>
              <div className="text-sm md:text-xl font-bold text-green-700 truncate">
                {formatCurrency(totalPaid, "USD")}
              </div>
            </div>
            <div
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg md:rounded-xl p-2 md:p-3 border-2 border-blue-200"
              title="Remaining balance to pay"
            >
              <div className="text-[10px] md:text-xs font-semibold text-blue-700 mb-0.5 md:mb-1 uppercase tracking-wide">
                Remaining
              </div>
              <div className="text-sm md:text-xl font-bold text-blue-700 truncate">
                {formatCurrency(balance, "USD")}
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <select
              className="flex-1 text-xs md:text-sm border-2 border-gray-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-3">
          {allRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">
                No payment records found
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Your payment history will appear here
              </p>
            </div>
          ) : (
            allRows.map((row, idx) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`relative rounded-lg md:rounded-2xl transition-all hover:shadow-lg overflow-hidden ${
                  row.status === "Outstanding"
                    ? "bg-gradient-to-r from-red-50 to-orange-50 border-l-4 md:border-l-0 md:border-2 border-red-500 md:border-red-300 md:hover:border-red-400"
                    : row.status === "Paid"
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 md:border-l-0 md:border-2 border-green-500 md:border-green-300 md:hover:border-green-400"
                      : row.status === "Pending"
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 md:border-l-0 md:border-2 border-amber-500 md:border-amber-300 md:hover:border-amber-400"
                        : "bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 md:border-l-0 md:border-2 border-gray-500 md:border-gray-300 md:hover:border-gray-400"
                }`}
              >
                {/* Mobile Compact Bar View */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between p-2.5">
                    <div className="flex-1 min-w-0">
                      {/* Course Tag & Description */}
                      <div className="flex items-center gap-2 mb-1">
                        {row.course && (
                          <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/70 text-gray-700 border border-gray-300 uppercase tracking-wide">
                            {row.course}
                          </span>
                        )}
                        {row.status === "Outstanding" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                            <svg
                              className="w-2.5 h-2.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                            DUE
                          </span>
                        ) : row.status === "Paid" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold">
                            <svg
                              className="w-2.5 h-2.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            PAID
                          </span>
                        ) : row.status === "Pending" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                            <svg
                              className="w-2.5 h-2.5 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-500 text-white text-[9px] font-bold">
                            FAILED
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-semibold text-gray-900 leading-tight truncate mb-0.5">
                        {row.description}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                        <span className="font-mono">{row.id}</span>
                        <span>•</span>
                        <span>{row.date}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <div
                        className={`text-base font-bold whitespace-nowrap ${
                          row.status === "Outstanding"
                            ? "text-red-700"
                            : row.status === "Paid"
                              ? "text-green-700"
                              : "text-gray-700"
                        }`}
                      >
                        {row.status === "Pending" && row.amount === 0
                          ? "—"
                          : formatCurrency(row.amount, row.currency)}
                      </div>
                      {row.receiptUrl && (
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold shadow-sm"
                          onClick={() =>
                            setPreview({
                              url: row.receiptUrl!,
                              type: row.receiptUrl!.endsWith(".pdf")
                                ? "pdf"
                                : "image",
                            })
                          }
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          VIEW
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop View (existing design) */}
                <div className="hidden md:block p-5">
                  {/* Status Badge */}
                  <div className="absolute top-5 right-5">
                    {row.status === "Outstanding" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-md">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Outstanding
                      </span>
                    ) : row.status === "Paid" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold shadow-md">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Paid
                      </span>
                    ) : row.status === "Pending" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md">
                        <svg
                          className="w-3.5 h-3.5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-500 text-white text-xs font-bold shadow-md">
                        Failed
                      </span>
                    )}
                  </div>

                  <div className="pr-32">
                    {/* Payment ID & Course Tag */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {row.id}
                      </span>
                      {row.course && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/60 backdrop-blur-sm text-gray-700 border border-gray-200">
                          {row.course}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <h3 className="text-base font-semibold text-gray-900 mb-1 leading-tight line-clamp-2">
                      {row.description}
                    </h3>

                    {/* Date and Amount */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium">{row.date}</span>
                      </div>

                      <div
                        className={`text-xl font-bold ${
                          row.status === "Outstanding"
                            ? "text-red-700"
                            : row.status === "Paid"
                              ? "text-green-700"
                              : "text-gray-700"
                        }`}
                      >
                        {row.status === "Pending" && row.amount === 0
                          ? "—"
                          : formatCurrency(row.amount, row.currency)}
                      </div>
                    </div>

                    {/* Receipt Button */}
                    {row.receiptUrl && (
                      <button
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md transition-all hover:shadow-lg"
                        onClick={() =>
                          setPreview({
                            url: row.receiptUrl!,
                            type: row.receiptUrl!.endsWith(".pdf")
                              ? "pdf"
                              : "image",
                          })
                        }
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Receipt
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {preview && (
          <ReceiptPreviewModal
            preview={preview}
            onClose={() => setPreview(null)}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

type ReceiptPreviewModalProps = {
  preview: { url: string; type: string };
  onClose: () => void;
};

function ReceiptPreviewModal({ preview, onClose }: ReceiptPreviewModalProps) {
  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex items-center justify-between mb-4 pr-12">
          <div className="text-lg font-semibold">Receipt Preview</div>
          <div className="flex gap-2">
            <button
              className="text-gray-600 hover:text-indigo-600"
              onClick={() => window.print()}
              title="Print"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 9V2h12v7"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"
                />
                <rect width="12" height="8" x="6" y="14" rx="2" />
              </svg>
            </button>
            <a
              className="text-gray-600 hover:text-indigo-600"
              href={preview.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              title="Download"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 10l5 5 5-5M12 15V3"
                />
              </svg>
            </a>
          </div>
        </div>
        <div className="flex justify-center items-center min-h-[300px]">
          {preview.type === "pdf" ? (
            <iframe
              src={preview.url}
              className="w-full h-[400px] border rounded"
              title="PDF Preview"
            />
          ) : (
            <img
              src={preview.url}
              alt="Receipt"
              className="max-h-[400px] w-auto rounded border"
            />
          )}
        </div>
      </div>
    </div>
  );
}
