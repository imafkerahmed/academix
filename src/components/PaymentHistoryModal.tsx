import React, { useMemo, useState } from "react";

// Local type definitions to avoid cross-file import issues
type PaymentStatus = "Paid" | "Pending" | "Failed" | "Outstanding";

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
  status: "Paid" | "Pending" | "Failed";
  receiptUrl?: string;
  course?: string;
};

type HistoryRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  course?: string;
  receiptUrl?: string;
};

export type PaymentHistoryModalProps = {
  onClose: () => void;
  history: PaymentHistoryItem[];
  mockDues: PaymentDue[];
  courseOptions: string[];
};

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  onClose,
  history,
  mockDues,
  courseOptions,
}) => {
  const [filterCourse, setFilterCourse] = useState("");
  const [preview, setPreview] = useState<null | { url: string; type: string }>(
    null,
  );

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount,
    );

  // Outstanding dues for all courses
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
          status: "Outstanding" as PaymentStatus,
          course: d.course,
          receiptUrl: undefined,
        })),
    [mockDues, filterCourse],
  );
  // Payment history filtered
  const filteredHistory: HistoryRow[] = (
    filterCourse ? history.filter((h) => h.course === filterCourse) : history
  ).map((h) => ({ ...h }));
  // Combine outstanding and history
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
};

type ReceiptPreviewModalProps = {
  preview: { url: string; type: string };
  onClose: () => void;
};

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  preview,
  onClose,
}) => {
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
};
