"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  BookOpen,
  CreditCard,
  DollarSign,
  Check,
} from "lucide-react";
import { ModernModal } from "@/components/ui/modern-modal";
import pb, { isSuperuserOnlyError } from "@/lib/pocketbase";
import { toast } from "sonner";
import {
  calculateEnrollmentFees,
  EnrollmentFeeCalculation,
} from "@/lib/feeCalculator";
import {
  generateRegistrationNumber,
  rollbackRegistrationNumber,
  generateInstallmentId,
  generatePaymentReferenceId,
} from "@/lib/registrationNumberGenerator";

interface EnrollCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
}

interface Intake {
  id: string;
  code: string;
  name: string;
}

interface CourseIntakeFee {
  id: string;
  course_intake: string;
  course_fee: number;
  registration_fee: number;
  duration: number;
  expand?: {
    course_intake: {
      expand?: {
        course: { id: string; name: string; code: string };
      };
    };
  };
}

export function EnrollCourseModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
}: EnrollCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [courseIntakes, setCourseIntakes] = useState<CourseIntakeFee[]>([]);

  const [selectedIntakeId, setSelectedIntakeId] = useState("");
  const [selectedCourseIntakeId, setSelectedCourseIntakeId] = useState("");
  const [paymentOption, setPaymentOption] = useState<
    "full_payment" | "installments_only" | "upfront_installments"
  >("full_payment");

  const [includeRegistrationFee, setIncludeRegistrationFee] = useState(true);
  const [discountType, setDiscountType] = useState<
    "percentage" | "flat" | null
  >(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [customUpfrontAmount, setCustomUpfrontAmount] = useState(0);
  const [feeCalculation, setFeeCalculation] =
    useState<EnrollmentFeeCalculation | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchIntakes();
      setSelectedIntakeId("");
      setSelectedCourseIntakeId("");
      setPaymentOption("full_payment");
      setIncludeRegistrationFee(true);
      setDiscountType(null);
      setDiscountValue(0);
      setCustomUpfrontAmount(0);
      setFeeCalculation(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIntakeId) {
      fetchCoursesForIntake(selectedIntakeId);
    } else {
      setCourseIntakes([]);
    }
  }, [selectedIntakeId]);

  useEffect(() => {
    if (selectedCourseIntakeId) {
      const selectedCourse = courseIntakes.find(
        (c) => c.id === selectedCourseIntakeId,
      );
      if (
        selectedCourse?.course_fee !== undefined &&
        selectedCourse?.duration !== undefined
      ) {
        const calc = calculateEnrollmentFees(
          selectedCourse.course_fee,
          selectedCourse.registration_fee || 0,
          selectedCourse.duration,
          paymentOption,
          includeRegistrationFee,
          discountType,
          discountValue,
          customUpfrontAmount,
        );
        setFeeCalculation(calc);
      }
    } else {
      setFeeCalculation(null);
    }
  }, [
    selectedCourseIntakeId,
    paymentOption,
    includeRegistrationFee,
    discountType,
    discountValue,
    customUpfrontAmount,
    courseIntakes,
  ]);

  const fetchIntakes = async () => {
    try {
      const records = await pb.collection("intakes").getFullList<Intake>({
        sort: "-created",
      });
      setIntakes(records);
    } catch (error) {
      if (!isSuperuserOnlyError(error)) {
        console.error("Error fetching intakes:", error);
      }
      toast.error("Failed to load intakes");
    }
  };

  const fetchCoursesForIntake = async (intakeId: string) => {
    setFetchingData(true);
    try {
      const records = await pb
        .collection("course_intake_fees")
        .getFullList<CourseIntakeFee>({
          filter: `course_intake.intake = "${intakeId}"`,
          expand: "course_intake.course",
        });
      setCourseIntakes(records);
    } catch (error) {
      if (!isSuperuserOnlyError(error)) {
        console.error("Error fetching courses:", error);
      }
      toast.error("Failed to load courses");
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourseIntakeId) {
      toast.error("Please select a course to enroll.");
      return;
    }

    if (paymentOption === "upfront_installments" && customUpfrontAmount <= 0) {
      toast.error("Please enter an upfront amount greater than 0");
      return;
    }

    setLoading(true);
    let registrationNumber: string | null = null;
    try {
      const selectedCourse = courseIntakes.find(
        (c) => c.id === selectedCourseIntakeId,
      );
      const selectedIntake = intakes.find((i) => i.id === selectedIntakeId);

      if (!selectedCourse || !selectedIntake) {
        toast.error("Invalid intake or course selection");
        return;
      }

      if (!feeCalculation) {
        toast.error("Fee calculation not available");
        return;
      }

      // Generate unique registration number
      registrationNumber = await generateRegistrationNumber(
        selectedIntake.code,
        selectedCourse.expand?.course_intake?.expand?.course?.code || "COURSE",
      );

      const courseIntakeFeeId = selectedCourse.id;
      const courseIntakeId = selectedCourse.course_intake;

      // Create enrollment with all fields
      const enrollmentRecord = await pb.collection("enrollments").create({
        student: studentId,
        registration_number: registrationNumber,
        course_intake: courseIntakeId,
        course_intake_fees: courseIntakeFeeId,

        // Payment configuration
        payment_option: paymentOption,
        registration_fee: includeRegistrationFee,

        // Discount details
        discount_type: discountType || "",
        discount: feeCalculation.discount_amount,

        // Fee breakdown
        total_course_fee: feeCalculation.total_course_fee,
        fee_after_discount: feeCalculation.fee_after_discount,
        upfront_payment: feeCalculation.upfront_payment,
        installment_amount: feeCalculation.installment_amount,
        installment_count: feeCalculation.installment_count,
        months_remaining: feeCalculation.months_remaining,

        // Status fields
        enrollment_date: new Date().toISOString(),
        enrollement_status: "enrolled",
        certificate_status: "pending",
        remarks: discountType
          ? `Enrolled with ${discountType} discount of ${discountValue}${discountType === "percentage" ? "%" : " LKR"}`
          : "",
      });

      try {
        // Registration fee — always a separate record
        if (
          includeRegistrationFee &&
          feeCalculation.registration_fee_amount > 0
        ) {
          await pb.collection("payments").create({
            reference_Id: generatePaymentReferenceId(
              registrationNumber,
              "registration",
            ),
            enrollment: enrollmentRecord.id,
            student: studentId,
            amount: feeCalculation.registration_fee_amount,
            payment_type: "registration",
            verified: false,
            bank_name: "",
            remarks: "Registration fee - one-time enrollment charge",
          });
        }

        // Course fee upfront portion — separate record
        const coursePortion =
          feeCalculation.upfront_payment -
          (includeRegistrationFee ? feeCalculation.registration_fee_amount : 0);
        if (coursePortion > 0) {
          const coursePayType =
            paymentOption === "full_payment" ? "full_payment" : "upfront";
          await pb.collection("payments").create({
            reference_Id: generatePaymentReferenceId(
              registrationNumber,
              coursePayType,
            ),
            enrollment: enrollmentRecord.id,
            student: studentId,
            amount: coursePortion,
            payment_type: coursePayType,
            verified: false,
            bank_name: "",
            remarks: `Auto-generated ${coursePayType} payment - Awaiting student payment confirmation`,
          });
        }

        // Create installment schedule if payment plan has installments
        if (feeCalculation.installment_count > 0) {
          const enrollmentDate = new Date();
          const firstDueDate = new Date(enrollmentDate);

          if (paymentOption === "upfront_installments") {
            // First installment starts the month after the upfront payment
            firstDueDate.setMonth(firstDueDate.getMonth() + 1);
          }
          // installments_only: first installment due same month as enrollment

          for (let i = 1; i <= feeCalculation.installment_count; i++) {
            const dueDate = new Date(firstDueDate);
            dueDate.setMonth(dueDate.getMonth() + (i - 1));

            const installmentId = generateInstallmentId(registrationNumber, i);

            await pb.collection("installments").create({
              installement_id: installmentId,
              enrollment: enrollmentRecord.id,
              due_date: dueDate.toISOString().split("T")[0],
              amount: feeCalculation.installment_amount,
              status: "pending",
              remarks: `Installment ${i} of ${feeCalculation.installment_count}`,
            });
          }
        }
      } catch (paymentError: unknown) {
        const err = paymentError as { message?: string; data?: unknown };
        console.error("Payment/installment creation error:", err?.message, err?.data);
      }

      toast.success(
        `Enrolled successfully! Registration: ${registrationNumber}`,
      );
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (registrationNumber) {
        await rollbackRegistrationNumber(registrationNumber);
      }
      if (!isSuperuserOnlyError(err)) {
        console.error("Error creating enrollment:", err);
      }
      toast.error(
        isSuperuserOnlyError(err)
          ? "You don't have permission to perform this action."
          : err?.message || "Failed to create enrollment.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernModal
      open={isOpen}
      onOpenChange={(v) => !v && onClose()}
      title="Enroll New Course"
      subtitle="Add a new academic pathway to this student's profile."
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
            <Calendar size={12} className="text-indigo-400" />
            1. Select Academic Intake
          </label>
          <select
            value={selectedIntakeId}
            onChange={(e) => {
              setSelectedIntakeId(e.target.value);
              setSelectedCourseIntakeId(""); // Reset course on intake change
            }}
            className="w-full bg-white border-2 border-indigo-50 rounded-xl p-4 text-xs font-bold text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer outline-none"
          >
            <option value="">-- Choose an Intake --</option>
            {intakes.map((intake) => (
              <option key={intake.id} value={intake.id}>
                {intake.name} ({intake.code})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
            <BookOpen size={12} className="text-indigo-400" />
            2. Available Courses
          </label>
          <div className="space-y-2">
            {!selectedIntakeId ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Select an intake to view courses
                </p>
              </div>
            ) : fetchingData ? (
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
                  Loading available courses...
                </p>
              </div>
            ) : courseIntakes.length === 0 ? (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                  No courses available for this intake.
                </p>
              </div>
            ) : (
              courseIntakes.map((c) => {
                const courseInfo = c.expand?.course_intake?.expand?.course;
                const isSelected = selectedCourseIntakeId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCourseIntakeId(c.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100"
                        : "bg-white border-gray-100 hover:border-indigo-200"
                    }`}
                  >
                    <div>
                      <h4
                        className={`text-sm font-black uppercase tracking-tight ${isSelected ? "text-indigo-900" : "text-gray-900"}`}
                      >
                        {courseInfo?.name || "Unknown Course"}
                      </h4>
                      <p
                        className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${isSelected ? "text-indigo-500" : "text-gray-400"}`}
                      >
                        {courseInfo?.code || "N/A"} • {c.duration || "0"} Months
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? "text-indigo-400" : "text-gray-400"}`}
                      >
                        Total Fee
                      </p>
                      <p
                        className={`text-xs font-black ${isSelected ? "text-indigo-600" : "text-gray-900"}`}
                      >
                        LKR {c.course_fee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {selectedCourseIntakeId && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
              <CreditCard size={12} className="text-indigo-400" />
              Payment Structure
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: "full_payment",
                  label: "Full Payment",
                  desc: "Entire course fee upfront",
                },
                {
                  id: "installments_only",
                  label: "Full Installments",
                  desc: "Full fee in monthly installments",
                },
                {
                  id: "upfront_installments",
                  label: "Upfront + Installments",
                  desc: "Enter upfront; balance monthly",
                },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setPaymentOption(
                      type.id as
                        | "full_payment"
                        | "installments_only"
                        | "upfront_installments",
                    );
                    if (type.id !== "upfront_installments")
                      setCustomUpfrontAmount(0);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    paymentOption === type.id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  <div
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      paymentOption === type.id ? "text-white" : ""
                    }`}
                  >
                    {type.label}
                  </div>
                  <div
                    className={`text-[9px] font-medium mt-0.5 ${
                      paymentOption === type.id
                        ? "text-indigo-200"
                        : "text-gray-400"
                    }`}
                  >
                    {type.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Upfront Amount */}
            {paymentOption === "upfront_installments" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                  <CreditCard size={10} className="text-indigo-400" />
                  Upfront Amount (LKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={feeCalculation?.fee_after_discount ?? undefined}
                  step="100"
                  value={customUpfrontAmount || ""}
                  onChange={(e) =>
                    setCustomUpfrontAmount(parseFloat(e.target.value) || 0)
                  }
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all placeholder:text-gray-300"
                />
                {feeCalculation && customUpfrontAmount > 0 && (
                  <p className="text-[9px] font-medium text-gray-400 ml-1">
                    Balance LKR{" "}
                    {Math.max(
                      0,
                      feeCalculation.fee_after_discount - customUpfrontAmount,
                    ).toLocaleString()}{" "}
                    →{" "}
                    {courseIntakes.find((c) => c.id === selectedCourseIntakeId)
                      ?.duration
                      ? (courseIntakes.find(
                          (c) => c.id === selectedCourseIntakeId,
                        )?.duration ?? 1) - 1
                      : 0}{" "}
                    installments
                  </p>
                )}
              </div>
            )}

            {/* Registration Fee Toggle */}
            {selectedCourseIntakeId &&
              (() => {
                const course = courseIntakes.find(
                  (c) => c.id === selectedCourseIntakeId,
                );
                const regFee = course?.registration_fee || 0;
                if (regFee <= 0) return null;
                return (
                  <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border-2 border-gray-100">
                    <div>
                      <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                        Registration Fee
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 mt-0.5">
                        LKR {regFee.toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${
                        includeRegistrationFee
                          ? "bg-indigo-600 ring-4 ring-indigo-100"
                          : "bg-gray-300"
                      }`}
                      onClick={() =>
                        setIncludeRegistrationFee(!includeRegistrationFee)
                      }
                    >
                      <span
                        className={`inline-block h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${
                          includeRegistrationFee
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })()}

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                <DollarSign size={12} className="text-green-500" />
                Discount Options
              </label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={discountType || ""}
                  onChange={(e) => {
                    setDiscountType(
                      (e.target.value as "percentage" | "flat") || null,
                    );
                    setDiscountValue(0);
                  }}
                  className="px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all outline-none"
                >
                  <option value="">No Discount</option>
                  <option value="percentage">Percentage %</option>
                  <option value="flat">Flat Amount</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step={discountType === "percentage" ? "1" : "100"}
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  disabled={!discountType}
                  placeholder={discountType === "percentage" ? "e.g. 10%" : "e.g. 5000"}
                  className="col-span-2 px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl text-xs font-bold text-gray-900 disabled:bg-gray-50 disabled:text-gray-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Detailed Fee Breakdown (New) */}
            {feeCalculation && (
              <div className="mt-4 p-5 bg-gradient-to-br from-indigo-50/50 to-white rounded-2xl border-2 border-indigo-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                    Fee Calculation Breakdown
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-gray-400 uppercase tracking-widest">
                      Course Fee
                    </span>
                    <span className="font-black text-gray-900">
                      LKR {feeCalculation.total_course_fee.toLocaleString()}
                    </span>
                  </div>

                  {feeCalculation.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-emerald-500 uppercase tracking-widest">
                        Discount Applied
                      </span>
                      <span className="font-black text-emerald-500">
                        - LKR {feeCalculation.discount_amount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {includeRegistrationFee && feeCalculation.registration_fee_amount > 0 && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-gray-400 uppercase tracking-widest">
                        Registration Fee
                      </span>
                      <span className="font-black text-gray-900">
                        LKR {feeCalculation.registration_fee_amount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 mt-1 border-t border-indigo-100/50">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                          {paymentOption === "installments_only"
                            ? "Initial Payment"
                            : paymentOption === "full_payment"
                              ? "Total Combined Fee"
                              : "Upfront Payment"}
                        </p>
                        <p className="text-xl font-black text-indigo-600">
                          LKR {feeCalculation.upfront_payment.toLocaleString()}
                        </p>
                      </div>
                      {feeCalculation.installment_count > 0 && (
                        <div className="text-right">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            {feeCalculation.installment_count}x Installments
                          </p>
                          <p className="text-xs font-black text-gray-900">
                            LKR {feeCalculation.installment_amount.toLocaleString()}
                            <span className="text-[9px] text-gray-400 ml-1">/mo</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black text-[10px] tracking-widest hover:bg-gray-200 transition-all uppercase active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedCourseIntakeId || !feeCalculation}
            className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {!feeCalculation && selectedCourseIntakeId
              ? "Calculating Fees..."
              : loading
                ? "Enrolling..."
                : "Complete Enrollment"}
          </button>
        </div>
      </div>
    </ModernModal>
  );
}
