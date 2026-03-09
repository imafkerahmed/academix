"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  CreditCard,
} from "lucide-react";

interface PaymentOption {
  id: string;
  label: string;
  amount: number;
  currency: string;
  status: string;
  payment_type?: string;
  [key: string]: any;
}

interface RaisePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCourse: string;
  registrationNumber?: string;
  paymentOptions: PaymentOption[];
  onSubmit: (data: {
    selectedInvoice: PaymentOption;
    files: File[];
    remarks: string;
  }) => Promise<void>;
  theme: { bg: string; text: string; border: string };
}

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export function RaisePaymentModal({
  isOpen,
  onClose,
  activeCourse,
  registrationNumber,
  paymentOptions,
  onSubmit,
  theme,
}: RaisePaymentModalProps) {
  const [modalStep, setModalStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentOption | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const resetForm = () => {
    setFiles([]);
    setPreviews([]);
    setFileError("");
    setRemarks("");
    setSelectedInvoice(null);
    setModalStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const onFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    const urls = arr.map((f) => URL.createObjectURL(f));
    setFiles(arr);
    setPreviews(urls);
    setFileError("");
  };

  const handleSubmit = async () => {
    if (!selectedInvoice) {
      setFileError("Please choose an amount to pay.");
      return;
    }
    if (files.length === 0) {
      setFileError("Please upload at least one receipt image.");
      return;
    }
    setProcessing(true);
    try {
      await onSubmit({ selectedInvoice, files, remarks });
      handleClose();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            {/* Header */}
            <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-white relative z-10 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
                  <CreditCard size={28} />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
                    Raise New <span className="text-indigo-600">Payment</span>
                  </h2>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                    Submit fee receipt for verification
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={28} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/30">
              {/* Course indicator */}
              <div
                className={`p-6 rounded-[2rem] border ${theme.bg} ${theme.border} flex items-center gap-4`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.bg} ${theme.text} font-black text-sm`}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Managing Payment For
                    </p>
                    {registrationNumber && (
                      <span className="px-2 py-0.5 rounded-md bg-gray-100/80 text-gray-500 text-[9px] font-black tracking-widest uppercase">
                        {registrationNumber}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    {activeCourse || "General Account"}
                  </h4>
                </div>
              </div>

              {!activeCourse ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
                  <p className="text-sm font-black text-gray-600 uppercase tracking-widest">
                    No course selected
                  </p>
                </div>
              ) : paymentOptions.length === 0 ? (
                /* Empty State: No Pending Payments */
                <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-green-50/50">
                    <CheckCircle className="text-green-500" size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                    You're All Caught Up!
                  </h3>
                  <p className="text-sm font-bold text-gray-400 max-w-sm mx-auto leading-relaxed">
                    There are no pending invoices or outstanding payments required for this course at the moment.
                  </p>
                </div>
              ) : (
                <>
                  {/* Step 1: Select amount */}
                  {modalStep === 1 ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                          1. Select Outstanding Liability
                        </label>
                        <div className="flex flex-col space-y-3">
                          {paymentOptions.map((opt) => {
                            const isSelected = selectedInvoice?.id === opt.id;
                            return (
                              <label
                                key={opt.id}
                                onClick={() => setSelectedInvoice(opt)}
                                className={`group relative overflow-hidden flex items-center justify-between p-5 bg-white rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                                  isSelected
                                    ? "border-indigo-500 shadow-lg shadow-indigo-100/50 bg-indigo-50/10"
                                    : "border-gray-100 hover:border-indigo-200 hover:shadow-md"
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                )}
                                <div className="relative z-10 flex items-center gap-5">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300 bg-white group-hover:border-indigo-300"}`}>
                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <h5 className={`text-sm font-black uppercase tracking-tight ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                                        {opt.label}
                                      </h5>
                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${isSelected ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                                        {opt.payment_type === "registration" ? "Reg. Fee" : opt.payment_type === "upfront" ? "Upfront" : "Installment"}
                                      </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                      Due: {opt.date ? new Date(opt.date).toLocaleDateString() : 'Now'}
                                    </p>
                                  </div>
                                </div>
                                <div className="relative z-10 text-right">
                                  <span className={`text-xl font-black tracking-tighter ${isSelected ? "text-indigo-600" : "text-gray-900"}`}>
                                    {formatCurrency(opt.amount, opt.currency)}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: Upload & Remarks */
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                      {selectedInvoice && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-[2rem] border-2 border-indigo-100 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16" />
                          <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                              Selected Liability
                            </p>
                            <h4 className="text-xl font-black text-gray-900 tracking-tight mt-1 uppercase">
                              {selectedInvoice.label}
                            </h4>
                          </div>
                          <div className="relative z-10 text-left md:text-right mt-4 md:mt-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Amount strictly required
                            </p>
                            <p className="text-3xl font-black text-indigo-600 tracking-tighter mt-1">
                              {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                          2. Upload Receipt(s)
                        </label>
                        <div className="relative group">
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            onChange={(e) => onFilesSelected(e.target.files)}
                          />
                          <div className="w-full border-2 border-dashed border-gray-300 bg-gray-50/80 rounded-[2.5rem] p-16 text-center group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all duration-300">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                              <Plus className="text-gray-400 group-hover:text-indigo-600 transition-colors" size={28} />
                            </div>
                            <p className="text-lg font-black text-gray-600 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                              Drag & Drop Payment Slips Here
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                              Supports JPG, PNG, PDF up to 10MB
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* File Previews */}
                      {previews.length > 0 && (
                        <div className="space-y-3">
                           <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                            Attached Documents ({previews.length})
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {previews.map((src, i) => (
                              <div
                                key={i}
                                className="relative group/doc aspect-square rounded-[2rem] overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center"
                              >
                                <img src={src} className="w-full h-full object-cover" alt={`Receipt ${i + 1}`} />
                                <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover/doc:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newFiles = [...files];
                                      const newPreviews = [...previews];
                                      newFiles.splice(i, 1);
                                      newPreviews.splice(i, 1);
                                      setFiles(newFiles);
                                      setPreviews(newPreviews);
                                    }}
                                    className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                                  >
                                    <X size={20} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                          3. Additional Remarks <span className="text-gray-300">(Optional)</span>
                        </label>
                        <textarea
                          className="w-full bg-white border-2 border-gray-100 rounded-[2rem] p-6 text-sm font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none min-h-[120px] resize-none placeholder:text-gray-300"
                          placeholder="E.g., Transaction ID #XY12345, or date of transfer..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                        />
                      </div>

                      {fileError && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in duration-300">
                          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                          <p className="text-red-600 font-black text-xs uppercase tracking-widest">
                            {fileError}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Actions */}
            {activeCourse && paymentOptions.length > 0 && (
              <div className="p-8 border-t border-gray-100 bg-white flex items-center gap-4 flex-shrink-0">
                {modalStep === 2 ? (
                  <>
                    <button
                      className="flex-1 py-5 rounded-2xl bg-gray-50 text-gray-500 font-black text-[10px] tracking-widest hover:bg-gray-100 hover:text-gray-900 transition-all uppercase active:scale-95 border-2 border-transparent"
                      onClick={() => setModalStep(1)}
                    >
                      Back to Invoices
                    </button>
                    <button
                      className="flex-[2] py-5 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-indigo-600 disabled:border-transparent"
                      disabled={processing || files.length === 0}
                      onClick={handleSubmit}
                    >
                      {processing ? (
                        <>
                          <span className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                          Uploading Verification...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Confirm & Submit Payment
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="flex-1 py-5 rounded-2xl bg-gray-50 text-gray-500 font-black text-[10px] tracking-widest hover:bg-gray-100 hover:text-gray-900 transition-all uppercase active:scale-95 border-2 border-transparent"
                      onClick={handleClose}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-[2] py-5 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-indigo-600 disabled:border-transparent"
                      disabled={!selectedInvoice}
                      onClick={() => setModalStep(2)}
                    >
                      Proceed to Payment
                      <ArrowRight size={18} />
                    </button>
                  </>
                )}
              </div>
            )}
            
            {/* Alt Footer for Empty State */}
            {activeCourse && paymentOptions.length === 0 && (
              <div className="p-8 border-t border-gray-100 bg-white flex items-center justify-center flex-shrink-0">
                 <button
                    className="py-5 px-12 rounded-2xl bg-gray-900 text-white font-black text-[10px] tracking-widest shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all uppercase active:scale-95"
                    onClick={handleClose}
                  >
                    Close Window
                  </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
