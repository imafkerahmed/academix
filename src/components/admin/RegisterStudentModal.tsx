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
    paymentType: "full" as "full" | "installment" | "upfront_installment",
  });

  useEffect(() => {
    if (isOpen) {
      setStage(enrollOnly ? 4 : 1);
      setFormData((prev) => ({
        ...prev,
        name: enrollOnly?.name || "",
        email: enrollOnly?.email || "",
      }));
      fetchIntakes();
      if (!enrollOnly) {
        generateNextUserId();
      }
      setAvatarFile(null);
      setAvatarPreview(null);
      setEnrollNow(true);
      setValidationError("");
    }
  }, [isOpen, enrollOnly]);

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

      // Step 2: Create Enrollment/Payment Record
      if (enrollNow && formData.courseIntakeFeeId) {
        const selectedFee = courseIntakes.find(
          (f) => f.id === formData.courseIntakeFeeId,
        );
        if (selectedFee) {
          await pb.collection("enrollments").create({
            student: studentId,
            course_intake_fee: formData.courseIntakeFeeId,
            course_intake: selectedFee.course_intake,
            payment_type: formData.paymentType,
            status: "pending",
          });
        }
      }

      toast.success(
        enrollOnly
          ? "Enrolled successfully!"
          : "Student registered successfully!",
      );
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
      className="max-w-3xl"
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
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <DollarSign size={12} className="text-indigo-400" />{" "}
                        Payment Plan
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          {
                            id: "full",
                            label: "Full Payment",
                            icon: CreditCard,
                          },
                          {
                            id: "installment",
                            label: "Installments",
                            icon: Calendar,
                          },
                        ].map((plan) => (
                          <button
                            key={plan.id}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                paymentType: plan.id as any,
                              })
                            }
                            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                              formData.paymentType === plan.id
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                                : "border-gray-50 bg-gray-50/50 text-gray-400 hover:border-indigo-100"
                            }`}
                          >
                            <plan.icon size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">
                              {plan.label}
                            </span>
                          </button>
                        ))}
                      </div>
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
