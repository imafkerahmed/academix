"use client";

import React, { useState, useEffect } from "react";
import { Calendar, BookOpen, CreditCard, Building2 } from "lucide-react";
import { ModernModal } from "@/components/ui/modern-modal";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

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
      id: string;
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

  // Data arrays
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [courseIntakes, setCourseIntakes] = useState<CourseIntakeFee[]>([]);

  // Selected State
  const [selectedIntakeId, setSelectedIntakeId] = useState("");
  const [selectedCourseFeeId, setSelectedCourseFeeId] = useState("");
  const [paymentType, setPaymentType] = useState<
    "full" | "installment" | "upfront_installment"
  >("full");

  // Fetch intakes on open
  useEffect(() => {
    if (isOpen) {
      fetchIntakes();
      setSelectedIntakeId("");
      setSelectedCourseFeeId("");
      setPaymentType("full");
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

  const fetchIntakes = async () => {
    try {
      const records = await pb.collection("intakes").getFullList<Intake>({
        sort: "-created",
      });
      setIntakes(records);
    } catch (error) {
      console.error("Error fetching intakes:", error);
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
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourseFeeId) {
      toast.error("Please select a course to enroll.");
      return;
    }

    setLoading(true);
    try {
      const selectedFee = courseIntakes.find(
        (f) => f.id === selectedCourseFeeId,
      );

      if (!selectedFee) {
        throw new Error("Invalid course selection.");
      }

      // Create new Enrollment
      await pb.collection("enrollments").create({
        student: studentId,
        course_intake_fee: selectedCourseFeeId,
        course_intake: selectedFee.course_intake,
        payment_type: paymentType,
        verified: false, // Default pending enrollment state
      });

      toast.success("Enrolled successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating enrollment:", error);
      toast.error(error?.message || "Failed to create enrollment.");
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
              setSelectedCourseFeeId(""); // Reset course on intake change
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
                const courseInfo = c.expand?.course_intake?.expand?.course;
                const isSelected = selectedCourseFeeId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCourseFeeId(c.id)}
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
                        {courseInfo?.code || "N/A"} • {c.duration} Months
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

        {/* Step 3: Payment Type */}
        {selectedCourseFeeId && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
              <CreditCard size={12} className="text-indigo-400" />
              3. Payment Structure
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "full", label: "Full Payment" },
                { id: "installment", label: "Installments" },
                { id: "upfront_installment", label: "Upfront Installment" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPaymentType(type.id as any)}
                  className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    paymentType === type.id
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
            disabled={loading || !selectedCourseFeeId}
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
