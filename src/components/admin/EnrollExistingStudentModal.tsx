"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  CreditCard,
  DollarSign,
  Check,
  Search,
  Loader2,
  Users,
} from "lucide-react";
import { ModernModal } from "@/components/ui/modern-modal";
import { Badge } from "@/components/ui/badge";
import pb from "@/lib/pocketbase";
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

interface EnrollExistingStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  intakeId: string;
  courseIntakeId: string;
}

interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  mobile: string;
  academicStatus: string;
  avatar?: string;
}

export function EnrollExistingStudentModal({
  isOpen,
  onClose,
  onSuccess,
  intakeId,
  courseIntakeId,
}: EnrollExistingStudentModalProps) {
  const [stage, setStage] = useState(1); // 1: Select Student, 2: Payment Options
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  // Students
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Course fee details
  const [courseFee, setCourseFee] = useState(0);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [duration, setDuration] = useState(0);
  const [courseIntakeFeeId, setCourseIntakeFeeId] = useState("");
  const [intakeCode, setIntakeCode] = useState("");
  const [courseCode, setCourseCode] = useState("");

  // Payment options
  const [paymentOption, setPaymentOption] = useState<
    "full_payment" | "upfront_installments" | "installments_only"
  >("full_payment");
  const [includeRegistrationFee, setIncludeRegistrationFee] = useState(true);
  const [discountType, setDiscountType] = useState<
    "percentage" | "flat" | null
  >(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [feeCalculation, setFeeCalculation] =
    useState<EnrollmentFeeCalculation | null>(null);

  // Fetch students and course details when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPendingStudents();
      fetchCourseDetails();
      resetModal();
    }
  }, [isOpen, courseIntakeId]);

  // Recalculate fees when payment options change
  useEffect(() => {
    if (stage === 2 && courseFee > 0) {
      const calc = calculateEnrollmentFees(
        courseFee,
        registrationFee,
        duration,
        paymentOption,
        includeRegistrationFee,
        discountType,
        discountValue,
      );
      setFeeCalculation(calc);
    }
  }, [
    stage,
    courseFee,
    registrationFee,
    duration,
    paymentOption,
    includeRegistrationFee,
    discountType,
    discountValue,
  ]);

  function resetModal() {
    setStage(1);
    setSelectedStudent(null);
    setSearchQuery("");
    setPaymentOption("full_payment");
    setIncludeRegistrationFee(true);
    setDiscountType(null);
    setDiscountValue(0);
    setFeeCalculation(null);
  }

  async function fetchPendingStudents() {
    try {
      setFetchingStudents(true);

      // Get all students with pending academic status who are not already enrolled in this course
      const allStudents = await pb.collection("users").getFullList({
        filter: `role = "student" && academicStatus = "pending"`,
        sort: "name",
      });

      // Get already enrolled students in this course
      const enrollments = await pb.collection("enrollments").getFullList({
        filter: `course_intake = "${courseIntakeId}"`,
        fields: "student",
      });

      const enrolledStudentIds = enrollments.map((e: any) => e.student);

      // Filter out already enrolled students and map to Student interface
      const availableStudents: Student[] = allStudents
        .filter((s: any) => !enrolledStudentIds.includes(s.id))
        .map((s: any) => ({
          id: s.id,
          userId: s.userId || "",
          name: s.name || "",
          email: s.email || "",
          mobile: s.mobile || "",
          academicStatus: s.academicStatus || "pending",
          avatar: s.avatar || "",
        }));

      setStudents(availableStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setFetchingStudents(false);
    }
  }

  async function fetchCourseDetails() {
    try {
      // Fetch course_intake_fees
      const fees = await pb.collection("course_intake_fees").getFullList({
        filter: `course_intake = "${courseIntakeId}"`,
        expand: "course_intake.course,course_intake.intake",
      });

      if (fees.length > 0) {
        const fee = fees[0];
        setCourseFee(fee.course_fee);
        setRegistrationFee(fee.registration_fee);
        setDuration(fee.duration);
        setCourseIntakeFeeId(fee.id);

        // Get intake and course codes
        if (fee.expand?.course_intake?.expand?.intake?.code) {
          setIntakeCode(fee.expand.course_intake.expand.intake.code);
        }
        if (fee.expand?.course_intake?.expand?.course?.code) {
          setCourseCode(fee.expand.course_intake.expand.course.code);
        }
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to load course details");
    }
  }

  async function handleEnroll() {
    if (!selectedStudent || !feeCalculation) return;

    try {
      setLoading(true);

      // Generate registration number
      const registrationNumber = await generateRegistrationNumber(
        intakeCode,
        courseCode,
      );

      const enrollmentDate = new Date().toISOString().split("T")[0];

      // Create enrollment
      const enrollmentData = {
        student: selectedStudent.id,
        registration_number: registrationNumber,
        course_intake: courseIntakeId,
        course_intake_fees: courseIntakeFeeId,
        payment_option: paymentOption,
        registration_fee: includeRegistrationFee
          ? feeCalculation.registration_fee_amount
          : 0,
        discount_type: discountType || "",
        discount: feeCalculation.discount_amount,
        total_course_fee: feeCalculation.total_course_fee,
        fee_after_discount: feeCalculation.fee_after_discount,
        upfront_payment: feeCalculation.upfront_payment,
        installment_amount: feeCalculation.installment_amount,
        installment_count: feeCalculation.installment_count,
        months_remaining: feeCalculation.months_remaining,
        enrollment_date: enrollmentDate,
        enrollement_status: "active",
        certificate_status: "pending",
        remarks: "",
      };

      const enrollment = await pb
        .collection("enrollments")
        .create(enrollmentData);

      // Create payment record for upfront amount
      if (feeCalculation.upfront_payment > 0) {
        const paymentReferenceId = generatePaymentReferenceId(
          registrationNumber,
          "upfront",
        );

        await pb.collection("payments").create({
          reference_Id: paymentReferenceId,
          enrollment: enrollment.id,
          student: selectedStudent.id,
          amount: feeCalculation.upfront_payment,
          payment_type: "upfront",
          date_paid: null,
          verified: false,
          bank_name: "",
          remarks: "Upfront payment - pending verification",
        });
      }

      // Create installment records
      if (feeCalculation.installment_count > 0) {
        const startMonth = paymentOption === "upfront_installments" ? 1 : 0;

        for (let i = 1; i <= feeCalculation.installment_count; i++) {
          const installmentId = generateInstallmentId(registrationNumber, i);

          // Calculate due date
          const dueDate = new Date(enrollmentDate);
          dueDate.setMonth(dueDate.getMonth() + startMonth + i);
          const dueDateString = dueDate.toISOString().split("T")[0];

          await pb.collection("installments").create({
            installement_id: installmentId,
            enrollment: enrollment.id,
            due_date: dueDateString,
            amount: feeCalculation.installment_amount,
            status: "pending",
            remarks: `Installment ${i} of ${feeCalculation.installment_count}`,
          });
        }
      }

      // Update student's academic status to active
      await pb.collection("users").update(selectedStudent.id, {
        academicStatus: "active",
      });

      toast.success(`${selectedStudent.name} enrolled successfully!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error enrolling student:", error);
      toast.error(error?.message || "Failed to enroll student");
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ModernModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        stage === 1 ? "Select Student to Enroll" : "Configure Payment Options"
      }
      subtitle={
        stage === 1
          ? "Choose a student with pending status to enroll in this course"
          : `Enrolling ${selectedStudent?.name || ""}`
      }
      avatarChar="E"
      avatarColor="bg-green-600"
      className="max-w-6xl"
    >
      <div className="space-y-6">
        {stage === 1 ? (
          // Stage 1: Select Student
          <>
            {/* Search Bar */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or student ID..."
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-medium transition-all"
              />
            </div>

            {/* Students List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {fetchingStudents ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Users size={48} className="text-gray-300 mb-4" />
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    {searchQuery
                      ? "No students found matching your search"
                      : "No pending students available"}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    All eligible students may already be enrolled in this course
                  </p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setStage(2);
                    }}
                    className="w-full p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-green-600 hover:bg-green-50/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-black text-lg text-gray-900 group-hover:text-green-600 transition-colors">
                          {student.name}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-medium text-gray-500">
                            {student.email}
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                            •
                          </span>
                          <span className="text-xs font-medium text-gray-500">
                            {student.userId}
                          </span>
                        </div>
                        {student.mobile && (
                          <div className="text-xs font-medium text-gray-400 mt-1">
                            📱 {student.mobile}
                          </div>
                        )}
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-0 px-3 py-1 rounded-lg text-xs font-black uppercase">
                        Pending
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          // Stage 2: Payment Options
          <div className="space-y-6">
            {/* Selected Student Info */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  {selectedStudent?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-black text-xl text-gray-900">
                    {selectedStudent?.name}
                  </div>
                  <div className="text-sm font-medium text-gray-600 mt-1">
                    {selectedStudent?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Structure Selection */}
            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-widest mb-4">
                <CreditCard size={14} className="text-green-600" />
                Payment Structure
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    value: "full_payment",
                    label: "Full Payment",
                    description: "Pay entire course fee + registration upfront",
                    badge: "Discount Eligible",
                  },
                  {
                    value: "upfront_installments",
                    label: "Upfront + Installments",
                    description:
                      "Registration + 1st month now, balance monthly",
                    badge: "Most Popular",
                  },
                  {
                    value: "installments_only",
                    label: "Full Installments",
                    description: "Pay course fee in monthly installments",
                    badge: "Max Flexibility",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentOption(option.value as any)}
                    className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                      paymentOption === option.value
                        ? "border-green-600 bg-white shadow-lg ring-4 ring-green-100"
                        : "border-gray-100 bg-white/70 hover:border-green-300 hover:bg-white"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-black text-base text-gray-900 uppercase tracking-wide">
                            {option.label}
                          </span>
                          {paymentOption === option.value && (
                            <Check
                              size={20}
                              className="text-green-600 flex-shrink-0"
                            />
                          )}
                        </div>
                        <span
                          className={`inline-block text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                            paymentOption === option.value
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {option.badge}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-500 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Fee Toggle */}
            <div className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-gray-100 shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-gray-700 uppercase tracking-wide">
                  Include Registration Fee
                </span>
                <span className="text-xs font-bold text-green-600">
                  LKR {registrationFee.toLocaleString()}
                </span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                  One-time enrollment charge
                </span>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-md ${
                  includeRegistrationFee
                    ? "bg-green-600 ring-4 ring-green-200"
                    : "bg-gray-300"
                }`}
                onClick={() =>
                  setIncludeRegistrationFee(!includeRegistrationFee)
                }
              >
                <span
                  className={`inline-block h-6 w-6 bg-white rounded-full shadow-sm transition-transform ${
                    includeRegistrationFee ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Discount Section */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-widest">
                <DollarSign size={14} className="text-green-600" />
                Apply Discount (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={discountType || ""}
                  onChange={(e) =>
                    setDiscountType(
                      e.target.value === ""
                        ? null
                        : (e.target.value as "percentage" | "flat"),
                    )
                  }
                  className="px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold transition-all"
                >
                  <option value="">No Discount</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (LKR)</option>
                </select>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) =>
                    setDiscountValue(parseFloat(e.target.value) || 0)
                  }
                  disabled={!discountType}
                  placeholder="Enter value"
                  className="px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Fee Breakdown */}
            {feeCalculation && (
              <div className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-100">
                <div className="text-xs font-black text-green-700 uppercase tracking-widest mb-4">
                  Fee Breakdown
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-600">
                      Course Fee
                    </span>
                    <span className="font-bold text-gray-900">
                      LKR {feeCalculation.total_course_fee.toLocaleString()}
                    </span>
                  </div>
                  {feeCalculation.discount_amount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600">
                          Discount Applied
                        </span>
                        <span className="font-bold text-green-600">
                          - LKR{" "}
                          {feeCalculation.discount_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600">
                          Fee After Discount
                        </span>
                        <span className="font-bold text-gray-900">
                          LKR{" "}
                          {feeCalculation.fee_after_discount.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  {includeRegistrationFee && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-600">
                        Registration Fee
                      </span>
                      <span className="font-bold text-gray-900">
                        LKR{" "}
                        {feeCalculation.registration_fee_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 border-green-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-black text-gray-900 uppercase">
                        Upfront Payment
                      </span>
                      <span className="text-2xl font-black text-green-600">
                        LKR {feeCalculation.upfront_payment.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {feeCalculation.installment_count > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-600">
                        Monthly Installments
                      </span>
                      <span className="font-bold text-gray-900">
                        {feeCalculation.installment_count} × LKR{" "}
                        {feeCalculation.installment_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStage(1)}
                disabled={loading}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleEnroll}
                disabled={loading || !feeCalculation}
                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-green-100 hover:bg-green-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Enroll Student
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModernModal>
  );
}
