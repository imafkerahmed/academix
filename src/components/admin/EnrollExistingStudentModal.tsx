"use client";

import React, { useState, useEffect } from "react";
import {
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
  rollbackRegistrationNumber,
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

interface PBUser {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  mobile?: string;
  academicStatus?: string;
  avatar?: string;
}

export function EnrollExistingStudentModal({
  isOpen,
  onClose,
  onSuccess,
  courseIntakeId,
}: Omit<EnrollExistingStudentModalProps, "intakeId">) {
  const [stage, setStage] = useState(1); // 1: Select Student, 2: Payment Options
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [courseFee, setCourseFee] = useState(0);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [duration, setDuration] = useState(0);
  const [courseIntakeFeeId, setCourseIntakeFeeId] = useState("");
  const [intakeCode, setIntakeCode] = useState("");
  const [courseCode, setCourseCode] = useState("");

  const [paymentOption, setPaymentOption] = useState<
    "full_payment" | "upfront_installments" | "installments_only"
  >("full_payment");
  const [includeRegistrationFee, setIncludeRegistrationFee] = useState(true);
  const [discountType, setDiscountType] = useState<
    "percentage" | "flat" | null
  >(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [customUpfrontAmount, setCustomUpfrontAmount] = useState(0);
  const [feeCalculation, setFeeCalculation] =
    useState<EnrollmentFeeCalculation | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  const resetModal = React.useCallback(() => {
    setStage(1);
    setSelectedStudent(null);
    setSearchQuery("");
    setPaymentOption("full_payment");
    setIncludeRegistrationFee(true);
    setDiscountType(null);
    setDiscountValue(0);
    setCustomUpfrontAmount(0);
    setFeeCalculation(null);
  }, []);

  const fetchPendingStudents = React.useCallback(async () => {
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

      const enrolledStudentIds = (
        enrollments as unknown as { student: string }[]
      ).map((e) => e.student);

      // Filter out already enrolled students and map to Student interface
      const availableStudents: Student[] = (allStudents as unknown as PBUser[])
        .filter((s) => !enrolledStudentIds.includes(s.id))
        .map((s) => ({
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
  }, [courseIntakeId]);

  const fetchCourseDetails = React.useCallback(async () => {
    try {
      // Fetch course_intake_fees
      const fees = await pb.collection("course_intake_fees").getFullList({
        filter: `course_intake = "${courseIntakeId}"`,
        expand: "course_intake.course,course_intake.intake",
      });

      if (fees.length > 0) {
        const fee = fees[0] as unknown as {
          id: string;
          course_fee: number;
          registration_fee: number;
          duration: number;
          expand?: {
            course_intake?: {
              intake?: string;
              course?: string;
              expand?: {
                intake?: { code?: string };
                course?: { code?: string };
              };
            };
          };
        };
        setCourseFee(fee.course_fee);
        setRegistrationFee(fee.registration_fee);
        setDuration(fee.duration);
        setCourseIntakeFeeId(fee.id);

        // Get intake and course codes (with direct-fetch fallback)
        const expandedIntakeCode =
          fee.expand?.course_intake?.expand?.intake?.code || "";
        const expandedCourseCode =
          fee.expand?.course_intake?.expand?.course?.code || "";

        if (!expandedIntakeCode && fee.expand?.course_intake?.intake) {
          try {
            const intakeRec = await pb
              .collection("intakes")
              .getOne(fee.expand.course_intake.intake);
            setIntakeCode((intakeRec.code as string) || "");
          } catch {
            setIntakeCode("");
          }
        } else {
          setIntakeCode(expandedIntakeCode);
        }

        if (!expandedCourseCode && fee.expand?.course_intake?.course) {
          try {
            const courseRec = await pb
              .collection("courses")
              .getOne(fee.expand.course_intake.course);
            setCourseCode((courseRec.code as string) || "");
          } catch {
            setCourseCode("");
          }
        } else {
          setCourseCode(expandedCourseCode);
        }
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error("Failed to load course details");
    }
  }, [courseIntakeId]);

  useEffect(() => {
    if (isOpen) {
      fetchPendingStudents();
      fetchCourseDetails();
      fetchCurrencySymbol();
      resetModal();
    }
  }, [isOpen, fetchPendingStudents, fetchCourseDetails, resetModal]);

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
        paymentOption === "upfront_installments"
          ? customUpfrontAmount
          : undefined,
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
    customUpfrontAmount,
  ]);

  const fetchCurrencySymbol = async () => {
    try {
      const settings = await pb.collection("institution_settings").getFullList();
      if (settings && settings.length > 0) {
        const currencyCode = settings[0].currency || "INR";
        const symbols: Record<string, string> = {
          USD: "$", EUR: "€", GBP: "£", LKR: "Rs", 
          AUD: "A$", CAD: "C$", INR: "₹", SGD: "S$", 
          AED: "د.إ", ZAR: "R"
        };
        setCurrencySymbol(symbols[currencyCode] || "₹");
      }
    } catch (err) {
      console.error("Error fetching currency settings:", err);
    }
  };

  async function handleEnroll() {
    if (!selectedStudent || !feeCalculation || !courseIntakeFeeId) return;

    if (paymentOption === "upfront_installments" && customUpfrontAmount <= 0) {
      toast.error("Please enter an upfront amount greater than 0");
      return;
    }

    let registrationNumber: string | null = null;
    try {
      setLoading(true);

      // Generate registration number
      registrationNumber = await generateRegistrationNumber(
        intakeCode,
        courseCode,
      );

      const enrollmentDate = new Date().toISOString();

      // Create enrollment
      const enrollmentData = {
        student: selectedStudent.id,
        registration_number: registrationNumber,
        course_intake: courseIntakeId,
        course_intake_fees: courseIntakeFeeId,
        payment_option: paymentOption,
        registration_fee: includeRegistrationFee,
        discount_type: discountType || "",
        discount: feeCalculation.discount_amount,
        total_course_fee: feeCalculation.total_course_fee,
        fee_after_discount: feeCalculation.fee_after_discount,
        upfront_payment: feeCalculation.upfront_payment,
        installment_amount: feeCalculation.installment_amount,
        installment_count: feeCalculation.installment_count,
        months_remaining: feeCalculation.months_remaining,
        enrollment_date: enrollmentDate,
        enrollement_status: "enrolled",
        certificate_status: "pending",
        remarks: "",
      };

      const enrollment = await pb
        .collection("enrollments")
        .create(enrollmentData);

      // Auto-create payment and installment records (non-blocking)
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
            enrollment: enrollment.id,
            student: selectedStudent.id,
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
            enrollment: enrollment.id,
            student: selectedStudent.id,
            amount: coursePortion,
            payment_type: coursePayType,
            verified: false,
            bank_name: "",
            remarks: `Auto-generated ${coursePayType} payment - Awaiting student payment confirmation`,
          });
        }

        // Create installment schedule
        if (feeCalculation.installment_count > 0) {
          // upfront_installments: first due month after upfront payment (+1)
          // installments_only: first due same month as enrollment (+0)
          const startMonth = paymentOption === "upfront_installments" ? 1 : 0;
          for (let i = 1; i <= feeCalculation.installment_count; i++) {
            const installmentId = generateInstallmentId(registrationNumber, i);
            const dueDate = new Date(enrollmentDate);
            dueDate.setMonth(dueDate.getMonth() + startMonth + (i - 1));
            await pb.collection("installments").create({
              installement_id: installmentId,
              enrollment: enrollment.id,
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

      // Update student's academic status
      await pb.collection("users").update(selectedStudent.id, {
        academicStatus: "enrolled",
      });

      toast.success(`${selectedStudent.name} enrolled successfully!`);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { message?: string; data?: { data?: Record<string, { message?: string } | string> } };
      console.error("Error enrolling student:", err?.message, err?.data);
      const fieldErrors = err?.data?.data
        ? Object.entries(err.data.data)
            .map(([field, fieldErr]: [string, unknown]) => `${field}: ${(fieldErr as { message?: string })?.message || fieldErr}`)
            .join(", ")
        : null;
      if (registrationNumber) {
        await rollbackRegistrationNumber(registrationNumber);
      }
      toast.error(fieldErrors || err?.message || "Failed to enroll student");
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
          <>
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
          <div className="space-y-5">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                {selectedStudent?.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-black text-sm text-gray-900 truncate">
                  {selectedStudent?.name}
                </div>
                <div className="text-xs font-medium text-gray-400 truncate">
                  {selectedStudent?.email}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Payment Structure
              </label>
              <div className="space-y-2">
                {[
                  {
                    value: "full_payment",
                    label: "Full Payment",
                    desc: "Pay the entire course fee upfront",
                  },
                  {
                    value: "upfront_installments",
                    label: "Upfront + Installments",
                    desc: "Enter an upfront amount — balance splits into monthly installments",
                  },
                  {
                    value: "installments_only",
                    label: "Full Installments",
                    desc: "Full course fee converts to equal monthly installments",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPaymentOption(
                        option.value as
                          | "full_payment"
                          | "upfront_installments"
                          | "installments_only",
                      );
                      if (option.value !== "upfront_installments")
                        setCustomUpfrontAmount(0);
                    }}
                    className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl border-2 transition-all text-left ${
                      paymentOption === option.value
                        ? "border-green-600 bg-green-50"
                        : "border-gray-100 bg-gray-50 hover:border-green-200"
                    }`}
                  >
                    <div>
                      <div
                        className={`text-sm font-black uppercase tracking-wide ${
                          paymentOption === option.value
                            ? "text-green-700"
                            : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </div>
                      <div className="text-[10px] font-medium text-gray-400 mt-0.5">
                        {option.desc}
                      </div>
                    </div>
                    {paymentOption === option.value && (
                      <Check
                        size={16}
                        className="text-green-600 flex-shrink-0"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {paymentOption === "upfront_installments" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Upfront Amount ({currencySymbol}) <span className="text-rose-500">*</span>
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
                  className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-gray-300"
                />
                {feeCalculation && (
                  <p className="text-[10px] font-medium text-gray-400 mt-1.5 ml-1">
                    Balance:{" "}
                    <span className="font-bold text-gray-600">
                      {currencySymbol}{" "}
                      {Math.max(
                        0,
                        feeCalculation.fee_after_discount -
                          (customUpfrontAmount || 0),
                      ).toLocaleString()}
                    </span>{" "}
                    splits into{" "}
                    <span className="font-bold text-green-600">
                      {duration > 1 ? duration - 1 : 1} monthly installments
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-gray-100 shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-gray-700 uppercase tracking-wide">
                  Include Registration Fee
                </span>
                <span className="text-xs font-bold text-green-600">
                  {currencySymbol} {registrationFee.toLocaleString()}
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
                  <option value="flat">Flat Amount ({currencySymbol})</option>
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
                      {currencySymbol} {feeCalculation.total_course_fee.toLocaleString()}
                    </span>
                  </div>
                  {feeCalculation.discount_amount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600">
                          Discount Applied
                        </span>
                        <span className="font-bold text-green-600">
                          - {currencySymbol}{" "}
                          {feeCalculation.discount_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600">
                          Fee After Discount
                        </span>
                        <span className="font-bold text-gray-900">
                          {currencySymbol}{" "}
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
                        {currencySymbol}{" "}
                        {feeCalculation.registration_fee_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 border-green-200 pt-3 mt-3">
                    {paymentOption === "installments_only" ? (
                      <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                        No upfront course payment — full fee splits into
                        installments
                      </p>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-base font-black text-gray-900 uppercase">
                          {paymentOption === "full_payment"
                            ? "Full Payment"
                            : "Upfront Payment"}
                        </span>
                        <span className="text-2xl font-black text-green-600">
                          {currencySymbol}
                          {paymentOption === "full_payment"
                            ? ` ${feeCalculation.upfront_payment.toLocaleString()}`
                            : ` ${customUpfrontAmount.toLocaleString()}`}
                        </span>
                      </div>
                    )}
                  </div>
                  {feeCalculation.installment_count > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-600">
                        Monthly Installments
                      </span>
                      <span className="font-bold text-gray-900">
                        {feeCalculation.installment_count} × {currencySymbol}{" "}
                        {feeCalculation.installment_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
