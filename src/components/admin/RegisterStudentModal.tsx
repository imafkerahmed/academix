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
} from "lucide-react";
import { ModernModal } from "@/components/ui/modern-modal";
import { Badge } from "@/components/ui/badge";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  enrollOnly?: {
    id: string;
    name: string;
    email: string;
  };
}

// Mock data - in a real app, these would be fetched from PocketBase
const mockIntakes = [
  { id: "1", code: "JAN2026", name: "January 2026 Intake" },
  { id: "2", code: "JUL2026", name: "July 2026 Intake" },
];

const mockCourses = [
  { id: "c1", name: "Mathematics", code: "MATH101", intakeId: "1" },
  { id: "c2", name: "Physics", code: "PHYS101", intakeId: "1" },
  { id: "c3", name: "Computer Science", code: "CS101", intakeId: "2" },
];

export function RegisterStudentModal({
  isOpen,
  onClose,
  onSuccess,
  enrollOnly,
}: RegisterStudentModalProps) {
  const [stage, setStage] = useState(enrollOnly ? 2 : 1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: enrollOnly?.name || "",
    email: enrollOnly?.email || "",
    mobile: "",
    city: "",
    password: "",
    intakeId: "",
    courseId: "",
    paymentType: "full" as "full" | "installment" | "upfront_installment",
  });

  useEffect(() => {
    if (isOpen) {
      setStage(enrollOnly ? 2 : 1);
      setFormData((prev) => ({
        ...prev,
        name: enrollOnly?.name || "",
        email: enrollOnly?.email || "",
      }));
    }
  }, [isOpen, enrollOnly]);

  const handleNext = () => setStage((prev) => prev + 1);
  const handleBack = () => setStage((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!enrollOnly) {
        // Step 1: Create User
        await pb.collection("users").create({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          city: formData.city,
          password: formData.password || "TempPassword123!",
          passwordConfirm: formData.password || "TempPassword123!",
          role: "student",
          accountStatus: "active",
        });
      }

      // Step 2: Create Enrollment/Payment Record (Hypothetical)
      // In a real app, you'd have an 'enrollments' collection
      // await pb.collection("enrollments").create({
      //   student: enrollOnly ? enrollOnly.id : newUser.id,
      //   course: formData.courseId,
      //   intake: formData.intakeId,
      //   payment_type: formData.paymentType,
      // });

      toast.success(
        enrollOnly
          ? "Enrolled successfully!"
          : "Student registered successfully!",
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const selectedIntakeCourses = mockCourses.filter(
    (c) => c.intakeId === formData.intakeId,
  );

  return (
    <ModernModal
      open={isOpen}
      onOpenChange={(v) => !v && onClose()}
      title={enrollOnly ? "Enroll Student" : "Register Student"}
      subtitle={
        enrollOnly
          ? `Add ${enrollOnly.name} to a new course`
          : "Complete the 3-stage registration process"
      }
      avatarChar={enrollOnly ? "E" : "S"}
      avatarColor={enrollOnly ? "bg-green-600" : "bg-indigo-600"}
      className="max-w-xl"
    >
      <div className="space-y-8 py-2">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3].map((s) => (
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
                  {s === 1 ? "Personal" : s === 2 ? "Course" : "Payment"}
                </span>
              </div>
              {s < 3 && (
                <div
                  className={`h-[2px] flex-1 mx-4 transition-all duration-700 ${stage > s ? "bg-indigo-600" : "bg-gray-100"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <div className="min-h-[320px]">
          {stage === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <User size={12} className="text-indigo-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                  />
                </div>
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
                    placeholder="+94 77 XXX XXXX"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MapPin size={12} className="text-indigo-400" /> City /
                    Location
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
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Layers size={12} className="text-indigo-400" /> Select Intake
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {mockIntakes.map((intake) => (
                    <button
                      key={intake.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          intakeId: intake.id,
                          courseId: "",
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
                      <div className="text-sm font-black mt-1 line-clamp-1">
                        {intake.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.intakeId && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <BookOpen size={12} className="text-indigo-400" /> Select
                    Course
                  </label>
                  <div className="space-y-2">
                    {selectedIntakeCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() =>
                          setFormData({ ...formData, courseId: course.id })
                        }
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                          formData.courseId === course.id
                            ? "border-indigo-600 bg-indigo-50 shadow-md"
                            : "border-gray-50 bg-white hover:border-indigo-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${
                              formData.courseId === course.id
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {course.code}
                          </div>
                          <div>
                            <div
                              className={`text-sm font-black ${
                                formData.courseId === course.id
                                  ? "text-indigo-900"
                                  : "text-gray-900"
                              }`}
                            >
                              {course.name}
                            </div>
                            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                              Permanent Enrollment
                            </div>
                          </div>
                        </div>
                        {formData.courseId === course.id && (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-indigo-900 uppercase">
                      Enrollment Fee
                    </h3>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      Set payment structure
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: "full",
                      label: "Full Payment",
                      desc: "One-time complete payment",
                      icon: CreditCard,
                    },
                    {
                      id: "installment",
                      label: "Monthly Installments",
                      desc: "4 equal monthly payments",
                      icon: Calendar,
                    },
                    {
                      id: "upfront_installment",
                      label: "Upfront + Installment",
                      desc: "Initial deposit + balance later",
                      icon: Layers,
                    },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          paymentType: type.id as any,
                        })
                      }
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        formData.paymentType === type.id
                          ? "border-indigo-600 bg-white shadow-xl shadow-indigo-100/50"
                          : "border-transparent bg-white/50 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl ${formData.paymentType === type.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        <type.icon size={18} />
                      </div>
                      <div className="text-left flex-1">
                        <div
                          className={`text-sm font-black ${formData.paymentType === type.id ? "text-indigo-900" : "text-gray-900"}`}
                        >
                          {type.label}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {type.desc}
                        </div>
                      </div>
                      {formData.paymentType === type.id && (
                        <Check className="text-indigo-600" size={20} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <Check size={16} />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-900 uppercase tracking-tighter">
                    Registration Preview
                  </div>
                  <p className="text-[11px] font-medium text-amber-700 leading-tight mt-1">
                    Student will be registered in{" "}
                    <span className="font-black underline">
                      {
                        mockIntakes.find((i) => i.id === formData.intakeId)
                          ?.code
                      }
                    </span>{" "}
                    for
                    <span className="font-black underline ml-1">
                      {
                        mockCourses.find((c) => c.id === formData.courseId)
                          ?.name
                      }
                    </span>{" "}
                    with
                    <span className="font-black underline ml-1">
                      {formData.paymentType.replace("_", " ").toUpperCase()}
                    </span>{" "}
                    structure.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-50">
          <div className="flex gap-3">
            {stage > (enrollOnly ? 2 : 1) && (
              <button
                onClick={handleBack}
                className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
            <button
              disabled={
                loading ||
                (stage === 1 && (!formData.name || !formData.email)) ||
                (stage === 2 && (!formData.intakeId || !formData.courseId))
              }
              onClick={stage === 3 ? handleSubmit : handleNext}
              className={`flex-[2] py-4 rounded-2xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl ${
                loading
                  ? "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed"
                  : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95"
              }`}
            >
              {loading
                ? "Processing..."
                : stage === 3
                  ? enrollOnly
                    ? "Enroll Student"
                    : "Register Student"
                  : "Continue"}
              {!loading && <ChevronRight size={18} />}
            </button>
          </div>
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
