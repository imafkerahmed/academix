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

  // Mock data for outstanding dues
  const mockDues: PaymentDue[] = [
    {
      amount: 1200,
      currency: "USD",
      dueDate: "2026-02-15",
      description: "Spring 2026 Tuition (Installment 2)",
      course: "Spring 2026 Tuition",
    },
    {
      amount: 300,
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
    <div className="border border-gray-300 shadow-lg rounded-xl w-full h-full p-4 bg-white flex flex-col">
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
          {duesForRotation.length > 1 && (
            <div className="mt-2 flex items-center gap-1">
              {duesForRotation.map((_, idx) => (
                <span
                  key={`dot-${idx}`}
                  className={`inline-block w-1.5 h-1.5 rounded-full ${idx === dueIndex ? "bg-red-600" : "bg-red-300"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Last Payment (compact) */}
        <div className="border border-gray-200 bg-gray-50 rounded-lg p-3">
          <div className="text-[11px] text-gray-700 font-semibold">
            Last Payment
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-xl font-bold text-gray-800 leading-tight">
              {lastPaid
                ? formatCurrency(lastPaid.amount, lastPaid.currency)
                : "—"}
            </div>
            <div
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
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
          <div className="text-[11px] text-gray-600 mt-0.5 leading-snug truncate">
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
      {showPayModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closePayModal}
          aria-modal
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={closePayModal}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="textt -lg font-semibold mb-4 uppercase">RAISE</div>
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
          </div>
        </div>
      )}

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
  courseOptions: string[];
};

function PaymentHistoryModal({
  onClose,
  history,
  mockDues,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl relative transition-transform duration-300 scale-100 animate-zoomIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold uppercase">Payment History</div>
          <div>
            <select
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Course</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((row) => (
                <tr key={row.id} className="border-t border-gray-200">
                  <td className="py-2 px-3 text-gray-700">{row.date}</td>
                  <td className="py-2 px-3 text-gray-700">
                    {row.course || "—"}
                  </td>
                  <td className="py-2 px-3 text-gray-700">{row.description}</td>
                  <td className="py-2 px-3 font-medium">
                    {row.status === "Outstanding" ? (
                      <span className="text-red-700 font-bold">
                        {formatCurrency(row.amount, row.currency)}
                      </span>
                    ) : row.status === "Pending" && row.amount === 0 ? (
                      "—"
                    ) : (
                      formatCurrency(row.amount, row.currency)
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {row.status === "Outstanding" ? (
                      <span className="text-red-600 font-semibold">
                        Outstanding
                      </span>
                    ) : (
                      <span>{row.status}</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {row.receiptUrl ? (
                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() =>
                          setPreview({
                            url: row.receiptUrl!,
                            type: row.receiptUrl!.endsWith(".pdf")
                              ? "pdf"
                              : "image",
                          })
                        }
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview && (
          <ReceiptPreviewModal
            preview={preview}
            onClose={() => setPreview(null)}
          />
        )}
      </div>
    </div>
  );
}

type ReceiptPreviewModalProps = {
  preview: { url: string; type: string };
  onClose: () => void;
};

function ReceiptPreviewModal({ preview, onClose }: ReceiptPreviewModalProps) {
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
        <div className="flex items-center justify-between mb-4">
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
