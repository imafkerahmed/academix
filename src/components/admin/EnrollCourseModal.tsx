"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  BookOpen,
  CreditCard,
  Building2,
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

interface CourseIntake {
  id: string;
  intake: string;
  course_fee?: number;
  registration_fee?: number;
  duration?: number;
  expand?: {
    course?: { id: string; name: string; code: string };
    intake?: { id: string; code: string; name: string };
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

  // Data arrays
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [courseIntakes, setCourseIntakes] = useState<CourseIntake[]>([]);

  // Selected State
  const [selectedIntakeId, setSelectedIntakeId] = useState("");
  const [selectedCourseIntakeId, setSelectedCourseIntakeId] = useState("");
  const [paymentOption, setPaymentOption] = useState<
    "full_payment" | "installments_only" | "upfront_installments"
  >("full_payment");

  // Payment configuration
  const [includeRegistrationFee, setIncludeRegistrationFee] = useState(true);
  const [discountType, setDiscountType] = useState<
    "percentage" | "flat" | null
  >(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [feeCalculation, setFeeCalculation] =
    useState<EnrollmentFeeCalculation | null>(null);

  // Fetch intakes on open
  useEffect(() => {
    if (isOpen) {
      fetchIntakes();
      setSelectedIntakeId("");
      setSelectedCourseIntakeId("");
      setPaymentOption("full_payment");
      setIncludeRegistrationFee(true);
      setDiscountType(null);
      setDiscountValue(0);
      setFeeCalculation(null);
    }
  }, [isOpen]);

  // Fetch specific courses when intake changes
  useEffect(() => {
    if (selectedIntakeId) {
      fetchCoursesForIntake(selectedIntakeId);
    } else {
      setCourseIntakes([]);
    }
  }, [selectedIntakeId]);

  // Recalculate fees when payment options change
  useEffect(() => {
    if (selectedCourseIntakeId) {
      const selectedCourse = courseIntakes.find(
        (c) => c.id === selectedCourseIntakeId,
      );
      if (selectedCourse?.course_fee && selectedCourse?.duration) {
        const calc = calculateEnrollmentFees(
          selectedCourse.course_fee,
          selectedCourse.registration_fee || 0,
          selectedCourse.duration,
          paymentOption,
          includeRegistrationFee,
          discountType,
          discountValue,
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
        .collection("course_intakes")
        .getFullList<CourseIntake>({
          filter: `intake = "${intakeId}"`,
          expand: "course,intake",
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

    setLoading(true);
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
      const registrationNumber = await generateRegistrationNumber(
        selectedIntake.code,
        selectedCourse.expand?.course?.code || "COURSE",
      );

      // Fetch course_intake_fees to link
      const feeRecords = await pb.collection("course_intake_fees").getFullList({
        filter: `course_intake="${selectedCourseIntakeId}"`,
      });
      const courseIntakeFeeId = feeRecords[0]?.id || null;

      // Create enrollment with all fields
      const enrollmentRecord = await pb.collection("enrollments").create({
        student: studentId,
        registration_number: registrationNumber,
        course_intake: selectedCourseIntakeId,
        course_intake_fees: courseIntakeFeeId,

        // Payment configuration
        payment_option: paymentOption,
        registration_fee: includeRegistrationFee,

        // Discount details
        discount_type: discountType,
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

      // Create initial payment record(s) for upfront amount
      if (feeCalculation.upfront_payment > 0) {
        let paymentType: "registration" | "upfront" = "upfront";
        if (includeRegistrationFee && paymentOption === "full_payment") {
          paymentType = "registration";
        } else if (
          includeRegistrationFee &&
          feeCalculation.upfront_payment ===
            feeCalculation.registration_fee_amount
        ) {
          paymentType = "registration";
        }

        const paymentReferenceId = generatePaymentReferenceId(
          registrationNumber,
          paymentType,
        );

        await pb.collection("payments").create({
          reference_Id: paymentReferenceId,
          enrollment: enrollmentRecord.id,
          student: studentId,
          amount: feeCalculation.upfront_payment,
          payment_type: paymentType,
          date_paid: null,
          verified: false,
          bank_name: "",
          remarks: `Auto-generated ${paymentType} payment - Awaiting student payment confirmation`,
        });
      }

      // Create installment schedule if payment plan has installments
      if (feeCalculation.installment_count > 0) {
        const enrollmentDate = new Date();
        let firstDueDate = new Date(enrollmentDate);

        if (paymentOption === "upfront_installments") {
          firstDueDate.setMonth(firstDueDate.getMonth() + 2);
        } else {
          firstDueDate.setMonth(firstDueDate.getMonth() + 1);
        }

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

      toast.success(
        `Enrolled successfully! Registration: ${registrationNumber}`,
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      if (!isSuperuserOnlyError(error)) {
        console.error("Error creating enrollment:", error);
      }
      toast.error(
        isSuperuserOnlyError(error)
          ? "You don't have permission to perform this action."
          : error?.message || "Failed to create enrollment.",
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
        {/* Step 1: Intake */}
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

        {/* Step 2: Course Selection */}
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
                const courseInfo = c.expand?.course;
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
                        {courseInfo?.code || "N/A"} • {c.duration || "—"} Months
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
                        {c.course_fee
                          ? `LKR ${c.course_fee.toLocaleString()}`
                          : "See Advisor"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 3: Payment Type */}
        {selectedCourseIntakeId && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
              <CreditCard size={12} className="text-indigo-400" />
              3. Payment Structure
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "full_payment", label: "Full Payment" },
                { id: "installments_only", label: "Installments" },
                { id: "upfront_installments", label: "Upfront Installment" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPaymentOption(type.id as any)}
                  className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    paymentOption === type.id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
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
            disabled={loading || !selectedCourseIntakeId}
            className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Building2 size={16} />
            )}
            {loading ? "Enrolling..." : "Confirm Enrollment"}
          </button>
        </div>
      </div>
    </ModernModal>
  );
}
