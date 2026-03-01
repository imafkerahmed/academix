"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  Key,
  Layers,
  Calendar,
  DollarSign,
  Type,
  IdCard,
  Users,
  Building2,
  Globe,
  MessageSquare,
  Hash,
  Camera,
  Upload,
  X,
} from "lucide-react";
import { ModernModal } from "@/components/ui/modern-modal";
import { Badge } from "@/components/ui/badge";
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

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  enrollOnly?: {
    id?: string;
    name?: string;
    email?: string;
    preselectedIntakeId?: string;
    preselectedCourseIntakeId?: string;
  };
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

export function RegisterStudentModal({
  isOpen,
  onClose,
  onSuccess,
  enrollOnly,
}: RegisterStudentModalProps) {
  const [stage, setStage] = useState(enrollOnly ? 4 : 1);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [courseIntakes, setCourseIntakes] = useState<CourseIntakeFee[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [enrollNow, setEnrollNow] = useState(true);
  const [validationError, setValidationError] = useState<string>("");
  const [feeCalculation, setFeeCalculation] =
    useState<EnrollmentFeeCalculation | null>(null);

  const [formData, setFormData] = useState({
    // Stage 1: Identity
    name: enrollOnly?.name || "",
    nameinitials: "",
    gender: "male",
    dateOfBirth: "",
    IdentificationDocument: "",

    // Stage 2: Contact
    email: enrollOnly?.email || "",
    mobile: "",
    whatsapp: "",
    address: "",
    city: "",
    countryCode: "+94",

    // Stage 3: Account & Site
    userId: "",
    password: "",
    branch: "Colombo",

    // Guardian Details (required)
    guardianName: "",
    guardianRelationship: "",
    guardianContact: "",

    // Stage 4: Enrollment
    intakeId: "",
    courseIntakeFeeId: "", // This maps to course_intake_fees
    paymentOption: "full_payment" as
      | "full_payment"
      | "upfront_installments"
      | "installments_only",
    includeRegistrationFee: true,
    discountType: null as "percentage" | "flat" | null,
    discountValue: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setStage(enrollOnly ? 4 : 1);
      setFormData((prev) => ({
        ...prev,
        name: enrollOnly?.name || "",
        email: enrollOnly?.email || "",
        intakeId: enrollOnly?.preselectedIntakeId || "",
      }));
      fetchIntakes();
      if (!enrollOnly?.id) {
        generateNextUserId();
      }
      setAvatarFile(null);
      setAvatarPreview(null);
      setEnrollNow(true);
      setValidationError("");
      setFeeCalculation(null);
    }
  }, [isOpen, enrollOnly]);

  // Preselect course when courseIntakes load
  useEffect(() => {
    if (enrollOnly?.preselectedCourseIntakeId && courseIntakes.length > 0) {
      const matchingFee = courseIntakes.find(
        (f) => f.course_intake === enrollOnly.preselectedCourseIntakeId,
      );
      if (matchingFee) {
        setFormData((prev) => ({
          ...prev,
          courseIntakeFeeId: matchingFee.id,
        }));
      }
    }
  }, [enrollOnly?.preselectedCourseIntakeId, courseIntakes]);

  // Recalculate fees when payment options change
  useEffect(() => {
    if (formData.courseIntakeFeeId && enrollNow) {
      const selectedFee = courseIntakes.find(
        (f) => f.id === formData.courseIntakeFeeId,
      );
      if (selectedFee) {
        const calc = calculateEnrollmentFees(
          selectedFee.course_fee,
          selectedFee.registration_fee,
          selectedFee.duration,
          formData.paymentOption,
          formData.includeRegistrationFee,
          formData.discountType,
          formData.discountValue,
        );
        setFeeCalculation(calc);
      }
    } else {
      setFeeCalculation(null);
    }
  }, [
    formData.courseIntakeFeeId,
    formData.paymentOption,
    formData.includeRegistrationFee,
    formData.discountType,
    formData.discountValue,
    enrollNow,
    courseIntakes,
  ]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateNextUserId = async () => {
    try {
      // Get the latest user with a userId starting with ACDX
      const records = await pb.collection("users").getList(1, 1, {
        filter: 'userId ~ "ACDX%"',
        sort: "-userId",
      });

      let nextNumber = 100001; // Default starting number

      if (records.items.length > 0) {
        const lastUserId = records.items[0].userId;
        const lastNumberMatch = lastUserId.match(/\d+$/);
        if (lastNumberMatch) {
          nextNumber = parseInt(lastNumberMatch[0]) + 1;
        }
      }

      const nextUserId = `ACDX${nextNumber}`;
      setFormData((prev) => ({ ...prev, userId: nextUserId }));
    } catch (error) {
      if (!isSuperuserOnlyError(error)) {
        console.error("Error generating userId:", error);
      }
      // Fallback to a timestamp based unique ID if DB fetch fails
      const fallbackId = `ACDX${Date.now().toString().slice(-6)}`;
      setFormData((prev) => ({ ...prev, userId: fallbackId }));
    }
  };

  useEffect(() => {
    if (formData.intakeId) {
      fetchCoursesForIntake(formData.intakeId);
    }
  }, [formData.intakeId]);

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
    }
  };

  const fetchCoursesForIntake = async (intakeId: string) => {
    setFetchingData(true);
    try {
      // Fetch course_intake_fees and expand course_intake -> course
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
    } finally {
      setFetchingData(false);
    }
  };

  const handleNext = () => {
    setValidationError("");
    setStage((prev) => prev + 1);
  };
  const handleBack = () => {
    setValidationError("");
    setStage((prev) => prev - 1);
  };

  const getMissingRequiredFields = () => {
    const missing: string[] = [];

    if (stage === 1) {
      if (!formData.name.trim()) missing.push("Full Name");
      if (!formData.nameinitials.trim()) missing.push("Name with Initials");
      if (!formData.dateOfBirth) missing.push("Date of Birth");
      if (!formData.IdentificationDocument.trim())
        missing.push("ID / Passport Number");
      if (!formData.guardianName.trim()) missing.push("Guardian Name");
      if (!formData.guardianRelationship.trim())
        missing.push("Guardian Relationship");
      if (!formData.guardianContact.trim()) missing.push("Guardian Contact");
    }

    if (stage === 2) {
      if (!formData.email.trim()) missing.push("Email");
      if (!formData.mobile.trim()) missing.push("Mobile");
      if (!formData.address.trim()) missing.push("Address");
      if (!formData.city.trim()) missing.push("City");
    }

    if (stage === 3 && !formData.password.trim()) {
      missing.push("Password");
    }

    if (stage === 4 && enrollNow && !formData.courseIntakeFeeId) {
      missing.push("Course Selection");
    }

    return missing;
  };

  const handlePrimaryAction = () => {
    const missing = getMissingRequiredFields();
    if (missing.length) {
      const message = `Please fill required fields: ${missing.join(", ")}`;
      setValidationError(message);
      toast.error(message);
      return;
    }

    if (stage === 4) {
      handleSubmit();
      return;
    }

    handleNext();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let studentId = enrollOnly?.id;

      if (!enrollOnly) {
        // Step 1: Create User with all schema fields using FormData for Avatar
        const data = new FormData();
        data.append("userId", formData.userId);
        data.append("name", formData.name);
        data.append("nameinitials", formData.nameinitials);
        data.append("email", formData.email);
        data.append("gender", formData.gender);
        data.append("dateOfBirth", formData.dateOfBirth);
        data.append("IdentificationDocument", formData.IdentificationDocument);
        data.append("countryCode", formData.countryCode);
        data.append("mobile", formData.mobile);
        data.append("whatsapp", formData.whatsapp);
        data.append("address", formData.address);
        data.append("city", formData.city);
        data.append("guardianName", formData.guardianName);
        data.append("guardianRelationship", formData.guardianRelationship);
        data.append("guardianContact", formData.guardianContact);
        data.append("password", formData.password || "TempPassword123!");
        data.append("passwordConfirm", formData.password || "TempPassword123!");
        data.append("emailVisibility", "true");
        data.append("role", "student");
        data.append("branch", formData.branch);
        data.append("accountStatus", "active");
        data.append("academicStatus", enrollNow ? "enrolled" : "pending");

        if (avatarFile) {
          data.append("avatar", avatarFile);
        }

        const newUser = await pb.collection("users").create(data);
        studentId = newUser.id;
      }

      // Step 2: Create Enrollment with complete data
      if (enrollNow && formData.courseIntakeFeeId) {
        const selectedFee = courseIntakes.find(
          (f) => f.id === formData.courseIntakeFeeId,
        );
        const selectedIntake = intakes.find((i) => i.id === formData.intakeId);

        if (selectedFee && selectedIntake) {
          // Calculate all fees
          const feeCalc = calculateEnrollmentFees(
            selectedFee.course_fee,
            selectedFee.registration_fee,
            selectedFee.duration,
            formData.paymentOption,
            formData.includeRegistrationFee,
            formData.discountType,
            formData.discountValue,
          );

          // Generate unique registration number
          const courseInfo = selectedFee.expand?.course_intake?.expand?.course;
          const registrationNumber = await generateRegistrationNumber(
            selectedIntake.code,
            courseInfo?.code || "COURSE",
          );

          // Create enrollment with all fields populated
          const enrollmentRecord = await pb.collection("enrollments").create({
            student: studentId,
            registration_number: registrationNumber,
            course_intake: selectedFee.course_intake,
            course_intake_fees: formData.courseIntakeFeeId,

            // Payment configuration
            payment_option: formData.paymentOption,
            registration_fee: formData.includeRegistrationFee,

            // Discount details
            discount_type: formData.discountType,
            discount: feeCalc.discount_amount,

            // Fee breakdown (all calculated values)
            total_course_fee: feeCalc.total_course_fee,
            fee_after_discount: feeCalc.fee_after_discount,
            upfront_payment: feeCalc.upfront_payment,
            installment_amount: feeCalc.installment_amount,
            installment_count: feeCalc.installment_count,
            months_remaining: feeCalc.months_remaining,

            // Status fields
            enrollment_date: new Date().toISOString(),
            enrollement_status: "enrolled",
            certificate_status: "pending",
            remarks: formData.discountType
              ? `Enrolled with ${formData.discountType} discount of ${formData.discountValue}${formData.discountType === "percentage" ? "%" : " LKR"}`
              : "",
          });

          // Step 3: Create initial payment record(s) for upfront amount
          if (feeCalc.upfront_payment > 0) {
            // Determine payment type for upfront
            let paymentType: "registration" | "upfront" = "upfront";
            if (
              formData.includeRegistrationFee &&
              formData.paymentOption === "full_payment"
            ) {
              // Full payment includes registration
              paymentType = "registration";
            } else if (
              formData.includeRegistrationFee &&
              feeCalc.upfront_payment === feeCalc.registration_fee_amount
            ) {
              // Only registration fee upfront
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
              amount: feeCalc.upfront_payment,
              payment_type: paymentType,
              date_paid: null,
              verified: false,
              bank_name: "",
              remarks: `Auto-generated ${paymentType} payment - Awaiting student payment confirmation`,
            });
          }

          // Step 4: Create installment schedule if payment plan has installments
          if (feeCalc.installment_count > 0) {
            const enrollmentDate = new Date();

            // Determine first installment due date
            let firstDueDate = new Date(enrollmentDate);
            if (formData.paymentOption === "upfront_installments") {
              // First installment due 2 months after enrollment (since first month paid upfront)
              firstDueDate.setMonth(firstDueDate.getMonth() + 2);
            } else {
              // First installment due next month
              firstDueDate.setMonth(firstDueDate.getMonth() + 1);
            }

            // Create installment records
            for (let i = 1; i <= feeCalc.installment_count; i++) {
              const dueDate = new Date(firstDueDate);
              dueDate.setMonth(dueDate.getMonth() + (i - 1));

              const installmentId = generateInstallmentId(
                registrationNumber,
                i,
              );

              await pb.collection("installments").create({
                installement_id: installmentId,
                enrollment: enrollmentRecord.id,
                due_date: dueDate.toISOString().split("T")[0], // YYYY-MM-DD
                amount: feeCalc.installment_amount,
                status: "pending",
                remarks: `Installment ${i} of ${feeCalc.installment_count}`,
              });
            }
          }

          toast.success(
            `Student ${enrollOnly ? "enrolled" : "registered"} successfully! Registration: ${registrationNumber}`,
          );
        }
      } else if (!enrollNow) {
        toast.success("Student registered successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      if (isSuperuserOnlyError(error)) {
        toast.error("You don't have permission to perform this action.");
      } else {
        toast.error(error.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernModal
      open={isOpen}
      onOpenChange={(v) => !v && onClose()}
      title={enrollOnly ? "Enroll Student" : "Register Student"}
      subtitle={
        enrollOnly
          ? `Add ${enrollOnly.name} to a new course`
          : "Complete the 4-stage registration process"
      }
      avatarChar={enrollOnly ? "E" : "S"}
      avatarColor={enrollOnly ? "bg-green-600" : "bg-indigo-600"}
      className="max-w-6xl"
    >
      <div className="space-y-8 py-2">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm font-black text-xs ${
                    stage >= s
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-50"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {stage > s ? <Check size={16} /> : s}
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${stage >= s ? "text-indigo-600" : "text-gray-300"}`}
                >
                  {s === 1
                    ? "Identity"
                    : s === 2
                      ? "Contact"
                      : s === 3
                        ? "Account"
                        : "Course"}
                </span>
              </div>
              {s < 4 && (
                <div
                  className={`h-[2px] flex-1 mx-2 transition-all duration-700 ${stage > s ? "bg-indigo-600" : "bg-gray-100"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <div className="min-h-[400px]">
          {stage === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Section: Identity */}
              <div className="pb-2 mb-6 border-b border-gray-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4">
                  Identity Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <User size={12} className="text-indigo-400" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Type size={12} className="text-indigo-400" /> Initials
                    </label>
                    <input
                      type="text"
                      value={formData.nameinitials}
                      required
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nameinitials: e.target.value,
                        })
                      }
                      placeholder="J.D."
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Users size={12} className="text-indigo-400" /> Gender
                    </label>
                    <select
                      value={formData.gender}
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all appearance-none"
                    >
                      <option value="male">MALE</option>
                      <option value="female">FEMALE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Calendar size={12} className="text-indigo-400" /> Date of
                      Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      required
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-6">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <IdCard size={12} className="text-indigo-400" /> ID /
                    Passport Number
                  </label>
                  <input
                    type="text"
                    value={formData.IdentificationDocument}
                    required
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        IdentificationDocument: e.target.value,
                      })
                    }
                    placeholder="NIC or Passport"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                  />
                </div>
              </div>
              {/* Section: Guardian Details */}
              <div className="pt-8 pb-2 mb-6 border-b border-gray-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4">
                  Guardian Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <User size={12} className="text-indigo-400" /> Guardian
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      required
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardianName: e.target.value,
                        })
                      }
                      placeholder="Guardian Name"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Users size={12} className="text-indigo-400" />{" "}
                      Relationship
                    </label>
                    <select
                      value={formData.guardianRelationship}
                      required
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardianRelationship: e.target.value,
                        })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all appearance-none"
                    >
                      <option value="">Select</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Phone size={12} className="text-indigo-400" /> Guardian
                      Contact
                    </label>
                    <input
                      type="text"
                      value={formData.guardianContact}
                      required
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardianContact: e.target.value,
                        })
                      }
                      placeholder="Guardian Contact"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                    />
                  </div>
                </div>
              </div>
              {/* Section: Avatar */}
              <div className="pt-8">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Camera size={12} className="text-indigo-400" /> Student
                  Avatar
                </label>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="text-indigo-300" size={32} />
                      )}
                    </div>
                    {avatarPreview && (
                      <button
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-all border-2 border-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer group flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-md hover:shadow-indigo-200/50 w-fit">
                      <Upload size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">
                        {avatarFile ? "Change Image" : "Upload Photo"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </label>
                    <p className="text-[10px] font-bold text-gray-400 ml-1">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Contact Fields (required) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Mail size={12} className="text-indigo-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Globe size={12} className="text-indigo-400" /> Country Code
                  </label>
                  <input
                    type="text"
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({ ...formData, countryCode: e.target.value })
                    }
                    placeholder="+94"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Phone size={12} className="text-indigo-400" /> Mobile
                    Number
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile: e.target.value })
                    }
                    placeholder="77 XXX XXXX"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MessageSquare size={12} className="text-indigo-400" />{" "}
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    placeholder="77 XXX XXXX"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin size={12} className="text-indigo-400" /> Physical
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street, City, Country"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin size={12} className="text-indigo-400" /> City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Colombo"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                />
              </div>
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Password required */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Hash size={12} className="text-indigo-400" /> Student UserID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.userId}
                    readOnly
                    className="w-full px-5 py-4 bg-gray-100 border border-gray-100 rounded-2xl focus:outline-none font-bold text-gray-500 cursor-not-allowed"
                  />
                  <Badge className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 text-[9px] font-black text-white">
                    Auto-Generated
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Key size={12} className="text-indigo-400" /> Portal Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                  />
                  <Badge className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-[9px] font-black text-gray-300 border border-gray-100">
                    Optional
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Building2 size={12} className="text-indigo-400" /> Site /
                  Branch
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["Colombo", "Negambo"].map((branch) => (
                    <button
                      key={branch}
                      onClick={() => setFormData({ ...formData, branch })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        formData.branch === branch
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                          : "border-gray-50 bg-gray-50/50 text-gray-400 hover:border-indigo-100"
                      }`}
                    >
                      <div className="text-sm font-black uppercase tracking-widest">
                        {branch}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stage === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Enrollment Toggle */}
              <div className="p-1.5 bg-gray-50 rounded-[2rem] border border-gray-100 mb-2">
                <button
                  onClick={() => setEnrollNow(!enrollNow)}
                  className={`w-full flex items-center justify-between p-4 rounded-[1.6rem] transition-all duration-500 ${
                    enrollNow
                      ? "bg-white shadow-sm"
                      : "bg-transparent opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        enrollNow
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <BookOpen size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                        Enable Enrollment
                      </div>
                      <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        {enrollNow
                          ? "Process course enrollment now"
                          : "Mark as Pending (Enroll later)"}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-500 ${
                      enrollNow ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-500 ${
                        enrollNow ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>
              </div>

              {enrollNow ? (
                <>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Layers size={12} className="text-indigo-400" /> Select
                      Intake
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {intakes.map((intake) => (
                        <button
                          key={intake.id}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              intakeId: intake.id,
                              courseIntakeFeeId: "",
                            })
                          }
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            formData.intakeId === intake.id
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                              : "border-gray-50 bg-gray-50/50 text-gray-400 hover:border-indigo-100"
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                            {intake.code}
                          </div>
                          <div className="text-sm font-black mt-1 line-clamp-1 uppercase">
                            {intake.name || intake.code}
                          </div>
                        </button>
                      ))}
                      {intakes.length === 0 && (
                        <div className="col-span-2 text-center py-4 text-gray-300 text-[10px] font-black uppercase">
                          No active intakes found
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.intakeId && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <BookOpen size={12} className="text-indigo-400" />{" "}
                        Select Course
                      </label>
                      <div className="space-y-2">
                        {fetchingData ? (
                          <div className="text-center py-8">
                            <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                          </div>
                        ) : (
                          courseIntakes.map((fee) => {
                            const course =
                              fee.expand?.course_intake?.expand?.course;
                            if (!course) return null;
                            return (
                              <button
                                key={fee.id}
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    courseIntakeFeeId: fee.id,
                                  })
                                }
                                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                                  formData.courseIntakeFeeId === fee.id
                                    ? "border-indigo-600 bg-indigo-50 shadow-md"
                                    : "border-gray-50 bg-white hover:border-indigo-100"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${
                                      formData.courseIntakeFeeId === fee.id
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    {course.code}
                                  </div>
                                  <div>
                                    <div
                                      className={`text-sm font-black ${
                                        formData.courseIntakeFeeId === fee.id
                                          ? "text-indigo-900"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {course.name}
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest flex gap-2">
                                      <span>{fee.duration} Days</span>
                                      <span>•</span>
                                      <span>RS. {fee.course_fee}</span>
                                    </div>
                                  </div>
                                </div>
                                {formData.courseIntakeFeeId === fee.id && (
                                  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                    <Check size={14} />
                                  </div>
                                )}
                              </button>
                            );
                          })
                        )}
                        {!fetchingData && courseIntakes.length === 0 && (
                          <div className="text-center py-4 text-gray-300 text-[10px] font-black uppercase">
                            No courses found for this intake
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.courseIntakeFeeId && (
                    <div className="space-y-6 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl border-2 border-indigo-100 animate-in fade-in slide-in-from-top-2">
                      {/* Payment Structure Selection */}
                      <div>
                        <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-widest mb-4">
                          <CreditCard size={14} className="text-indigo-600" />
                          Payment Structure
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            {
                              value: "full_payment",
                              label: "Full Payment",
                              description:
                                "Pay entire course fee + registration upfront",
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
                              description:
                                "Pay course fee in monthly installments",
                              badge: "Max Flexibility",
                            },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  paymentOption: option.value as any,
                                }))
                              }
                              className={`relative p-6 rounded-2xl border-2 transition-all text-left group ${
                                formData.paymentOption === option.value
                                  ? "border-indigo-600 bg-white shadow-lg ring-4 ring-indigo-100"
                                  : "border-indigo-100 bg-white/70 hover:border-indigo-300 hover:bg-white"
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-black text-base text-gray-900 uppercase tracking-wide">
                                      {option.label}
                                    </span>
                                    {formData.paymentOption ===
                                      option.value && (
                                      <Check
                                        size={20}
                                        className="text-indigo-600 flex-shrink-0"
                                      />
                                    )}
                                  </div>
                                  <span
                                    className={`inline-block text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                                      formData.paymentOption === option.value
                                        ? "bg-indigo-600 text-white"
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
                      <div className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-indigo-100 shadow-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-gray-700 uppercase tracking-wide">
                            Include Registration Fee
                          </span>
                          <span className="text-xs font-bold text-indigo-600">
                            LKR{" "}
                            {courseIntakes
                              .find((f) => f.id === formData.courseIntakeFeeId)
                              ?.registration_fee?.toLocaleString() || "0"}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                            One-time enrollment charge
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-md ${
                            formData.includeRegistrationFee
                              ? "bg-indigo-600 ring-4 ring-indigo-200"
                              : "bg-gray-300"
                          }`}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              includeRegistrationFee:
                                !prev.includeRegistrationFee,
                            }))
                          }
                        >
                          <span
                            className={`inline-block h-6 w-6 bg-white rounded-full shadow-sm transition-transform ${
                              formData.includeRegistrationFee
                                ? "translate-x-7"
                                : "translate-x-1"
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
                        <div className="grid grid-cols-3 gap-3">
                          <select
                            value={formData.discountType || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                discountType: (e.target.value as any) || null,
                                discountValue: 0,
                              }))
                            }
                            className="px-4 py-3 bg-white border-2 border-indigo-100 rounded-xl text-sm font-bold text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                          >
                            <option value="">No Discount</option>
                            <option value="percentage">Percentage %</option>
                            <option value="flat">Flat Amount</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            max={
                              formData.discountType === "percentage"
                                ? 100
                                : undefined
                            }
                            step={
                              formData.discountType === "percentage"
                                ? "0.1"
                                : "100"
                            }
                            value={formData.discountValue || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                discountValue: parseFloat(e.target.value) || 0,
                              }))
                            }
                            disabled={!formData.discountType}
                            placeholder={
                              formData.discountType === "percentage"
                                ? "%"
                                : "LKR"
                            }
                            className="col-span-2 px-4 py-3 bg-white border-2 border-indigo-100 rounded-xl text-sm font-bold text-gray-900 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                          />
                        </div>
                      </div>

                      {/* Live Fee Calculation Display */}
                      {feeCalculation && (
                        <div className="space-y-3 p-6 bg-white rounded-2xl border-2 border-indigo-200 shadow-lg">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                            <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">
                              Fee Breakdown
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-500 uppercase tracking-widest">
                                Course Fee
                              </span>
                              <span className="font-black text-gray-900">
                                LKR{" "}
                                {feeCalculation.total_course_fee.toLocaleString()}
                              </span>
                            </div>

                            {feeCalculation.discount_amount > 0 && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-green-600 uppercase tracking-widest">
                                  Discount Applied
                                </span>
                                <span className="font-black text-green-600">
                                  - LKR{" "}
                                  {feeCalculation.discount_amount.toLocaleString()}
                                </span>
                              </div>
                            )}

                            {feeCalculation.discount_amount > 0 && (
                              <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                                <span className="font-bold text-gray-500 uppercase tracking-widest">
                                  Fee After Discount
                                </span>
                                <span className="font-black text-gray-900">
                                  LKR{" "}
                                  {feeCalculation.fee_after_discount.toLocaleString()}
                                </span>
                              </div>
                            )}

                            {feeCalculation.registration_fee_amount > 0 && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-500 uppercase tracking-widest">
                                  Registration Fee
                                </span>
                                <span className="font-black text-gray-900">
                                  LKR{" "}
                                  {feeCalculation.registration_fee_amount.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t-2 border-indigo-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-black text-sm text-indigo-700 uppercase tracking-widest">
                                Upfront Payment
                              </span>
                              <span className="font-black text-2xl text-indigo-600">
                                LKR{" "}
                                {feeCalculation.upfront_payment.toLocaleString()}
                              </span>
                            </div>
                            {feeCalculation.upfront_payment === 0 && (
                              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                                No upfront payment required
                              </p>
                            )}
                          </div>

                          {feeCalculation.installment_count > 0 && (
                            <div className="pt-3 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-gray-700 uppercase tracking-widest">
                                  {feeCalculation.installment_count} Monthly
                                  Installments
                                </span>
                                <span className="font-black text-lg text-gray-900">
                                  LKR{" "}
                                  {feeCalculation.installment_amount.toLocaleString()}{" "}
                                  <span className="text-xs font-bold text-gray-400">
                                    each
                                  </span>
                                </span>
                              </div>
                              <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest">
                                Total Installments: LKR{" "}
                                {(
                                  feeCalculation.installment_amount *
                                  feeCalculation.installment_count
                                ).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 px-8 bg-indigo-50/30 rounded-[3rem] border-2 border-dashed border-indigo-100/50 text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto shadow-sm ring-8 ring-indigo-50/50">
                    <Check size={36} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight">
                      Ready for Pending Registration
                    </h3>
                    <p className="text-xs font-bold text-indigo-400/80 uppercase tracking-widest leading-relaxed">
                      The student will be added to your directory <br /> with a{" "}
                      <span className="text-indigo-600 font-extrabold">
                        Pending
                      </span>{" "}
                      Academic Status.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-50">
          <div className="flex gap-3">
            {stage > (enrollOnly ? 4 : 1) && (
              <button
                onClick={handleBack}
                className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
            <button
              disabled={loading}
              onClick={handlePrimaryAction}
              className={`flex-[2] py-4 rounded-2xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl ${
                loading
                  ? "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed"
                  : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95"
              }`}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : stage === 4 ? (
                <>
                  <Check size={18} />{" "}
                  {enrollNow
                    ? "Complete Enrollment"
                    : "Register Pending Student"}
                </>
              ) : (
                "Continue"
              )}
              {!loading && stage < 4 && <ChevronRight size={18} />}
            </button>
          </div>
          {validationError && (
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center px-2">
              {validationError}
            </p>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 font-bold text-[10px] text-gray-300 hover:text-gray-500 transition-colors uppercase tracking-[0.2em]"
          >
            Cancel Registration
          </button>
        </div>
      </div>
    </ModernModal>
  );
}
