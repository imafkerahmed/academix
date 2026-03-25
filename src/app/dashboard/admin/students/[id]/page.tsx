"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import pb, { isSuperuserOnlyError } from "@/lib/pocketbase";
import { RecordModel } from "pocketbase";
import { DashboardBreadcrumbs } from "@/components/dashboard/shared/DashboardBreadcrumbs";
import {
  User,
  BookOpen,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Edit,
  ShieldCheck,
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  ExternalLink,
  Upload,
  Archive,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnrollCourseModal } from "@/components/admin/EnrollCourseModal";
import { ModernModal } from "@/components/ui/modern-modal";
function ResetPasswordControl({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    setFeedback("");
    // Validate passwords before sending
    const trimmedPassword = password.trim();
    const trimmedConfirm = passwordConfirm.trim();

    if (!trimmedPassword || !trimmedConfirm) {
      setFeedback("Please enter and confirm the new password.");
      toast.error("Please enter and confirm the new password.");
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      setFeedback("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }
    if (trimmedPassword.length < 8) {
      setFeedback("Password must be at least 8 characters.");
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      // Use trimmed passwords that passed validation
      const passwordData = {
        studentId,
        password: trimmedPassword,
        passwordConfirm: trimmedConfirm,
      };

      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent with the request
        body: JSON.stringify(passwordData),
      });

      const data = await res.json();
      console.log("Password reset response status:", res.status, "Data:", data);

      if (!res.ok) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to reset password.";
        throw new Error(errorMsg);
      }

      setFeedback("Password changed successfully.");
      toast.success("Password changed successfully.");
      setIsOpen(false);
      // Clear passwords after successful reset
      setPassword("");
      setPasswordConfirm("");
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      const err = error as { message?: string };
      const message = err?.message || "Failed to reset password.";
      setFeedback(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-[10px] tracking-widest shadow-sm hover:bg-indigo-600 hover:text-white transition-all uppercase flex items-center gap-2"
      >
        <ShieldCheck size={14} /> Reset Password
      </button>
      <ModernModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Reset Password"
        subtitle={`Set a new password for ${studentName}`}
        avatarChar={studentName.charAt(0).toUpperCase()}
        avatarColor="bg-indigo-600"
      >
        <div className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 pr-11 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={saving}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 pr-11 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
              placeholder="Confirm New Password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={saving}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black text-[10px] tracking-widest hover:bg-gray-200 transition-all uppercase active:scale-95"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95"
              disabled={saving}
            >
              {saving ? "Resetting..." : "Reset Password"}
            </button>
          </div>
          {feedback && (
            <p className="text-[10px] font-black uppercase tracking-widest text-center text-rose-500">
              {feedback}
            </p>
          )}
        </div>
      </ModernModal>
    </>
  );
}

interface Document {
  id: string;
  field: string; // relation to student (studentId)
  document: string; // file field name
  document_type:
    | "nic"
    | "ol_transcript"
    | "al_transcript"
    | "birth_certificate";
  status_: "pending" | "verified" | "rejected";
  remarks?: string;
  created: string;
  updated: string;
}

interface StudentDetails {
  id: string;
  userId: string;
  avatar: string;
  name: string;
  email: string;
  mobile: string;
  whatsapp?: string;
  city: string;
  address?: string;
  role: string;
  accountStatus: string;
  academicStatus: string;
  created: string;
  dateOfBirth?: string;
  gender?: string;
  IdentificationDocument?: string;
  nameinitials?: string;
  countryCode?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianContact?: string;
  internalNote?: string;
  expand?: {
    enrollments_via_student?: Enrollment[];
  };
  academicAdvisor?: string;
  documents?: Document[];
}

interface Enrollment {
  id: string;
  created: string;
  course_intake: string;
  registration_number?: string;
  installment_amount?: number;
  payment_option?: string;
  certificate_status?: string;
  enrollement_status?: string;
  expand?: {
    course_intake?: {
      id: string;
      course?: string;
      intake?: string;
      expand?: {
        course?: {
          id: string;
          name: string;
          code: string;
        };
      };
    };
  };
}

interface CourseSubject {
  id: string;
  semester: string;
  credits: number;
  expand?: {
    subject?: {
      id: string;
      name: string;
      code: string;
    } | {
      id: string;
      name: string;
      code: string;
    }[];
    lecturer?: {
      id: string;
      name: string;
    };
  };
}

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  course_subject: string;
  expand?: {
    course_subject?: {
      expand?: {
        subject?: {
          name: string;
        };
      };
    };
  };
}


interface StudentAssignmentSubmission {
  id: string;
  assignment: string;
  submitted_at: string;
  evaluation_status: string;
  submission_status: string;
  mark?: number;
  grade?: string;
  feedback?: string;
  file?: string;
}

interface StudentAssignment {
  id: string;
  title: string;
  due_date: string;
  total_marks?: number;
  course_subject: string;
  expand?: {
    course_subject?: {
      expand?: {
        subject?: { name: string };
      };
    };
  };
  submission?: StudentAssignmentSubmission;
}

interface Payment {
  id: string;
  reference_Id: string;
  date_paid: string;
  amount: number;
  payment_type: string;
  verified: boolean;
  expand?: {
    course?: { name: string };
  };
}

const DOCUMENT_TYPE_BY_CATEGORY = {
  nic: "nic",
  ol: "ol_transcript",
  al: "al_transcript",
  birth: "birth_certificate",
} as const;

function CertificateStatusControl({
  initialStatus = "pending",
  enrollmentId,
  onUpdated,
}: {
  initialStatus?: string;
  enrollmentId: string;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState(initialStatus?.toLowerCase() || "pending");
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync with initial status if it changes
  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus.toLowerCase());
    }
  }, [initialStatus]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setSaving(true);
      await pb.collection("enrollments").update(enrollmentId, {
        certificate_status: newStatus.toLowerCase(),
      });
      setStatus(newStatus.toLowerCase());
      toast.success(`Status updated to ${newStatus.toUpperCase()}`);
      onUpdated();
      setIsOpen(false);
    } catch (error: unknown) {
      if (isSuperuserOnlyError(error)) {
        toast.error("You don't have permission to update status.");
      } else {
        const err = error as { message?: string };
        toast.error(err?.message || "Failed to update status");
      }
    } finally {
      setSaving(false);
    }
  };

  // Derive styles based on status
  let statusBg =
    "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 focus:ring-amber-50/50";
  if (status === "processing")
    statusBg =
      "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 focus:ring-indigo-50/50";
  if (status === "delivered" || status === "issued")
    statusBg =
      "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 focus:ring-emerald-50/50";

  const displayStatus = (status: string) => {
    if (status === "delivered") return "ISSUED";
    return status.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={`px-4 py-1.5 rounded-xl border hover:shadow-sm transition-all focus:ring-4 text-[9px] font-black uppercase tracking-widest cursor-pointer ${statusBg}`}
        >
          {displayStatus(status)}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-8 rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-gray-900 text-center">
            Update Certificate Status
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          {["PENDING", "PROCESSING", "ISSUED"].map((s) => {
            const val = s === "ISSUED" ? "delivered" : s.toLowerCase();
            const isSelected = status === val;
            return (
              <button
                key={s}
                onClick={() => handleStatusUpdate(val)}
                disabled={saving}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm"
                    : "border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                } disabled:opacity-50`}
              >
                <span className="font-black text-xs uppercase tracking-widest">
                  {s}
                </span>
                {isSelected && (
                  <CheckCircle size={18} className="text-indigo-600" />
                )}
              </button>
            );
          })}
        </div>

        {status === "delivered" && (
          <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
              Upload Generated Certificate
            </h4>
            <div className="w-full border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50 transition-colors group">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <p className="text-xs font-bold text-gray-700 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                PDF, JPG or PNG (max. 10MB)
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className="w-full mt-6 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black text-[10px] tracking-widest hover:bg-gray-200 transition-all uppercase active:scale-95"
        >
          Cancel
        </button>
      </DialogContent>
    </Dialog>
  );
}

function UpdateProfileControl({
  student,
  onUpdated,
}: {
  student: StudentDetails;
  onUpdated: (updated: StudentDetails) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameinitials: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    gender: "",
    dateOfBirth: "",
    IdentificationDocument: "",
    guardianName: "",
    guardianRelationship: "",
    guardianContact: "",
    whatsapp: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: student.name || "",
      nameinitials: student.nameinitials || "",
      mobile: student.mobile || "",
      email: student.email || "",
      address: student.address || "",
      city: student.city || "",
      gender: student.gender || "",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
      IdentificationDocument: student.IdentificationDocument || "",
      guardianName: student.guardianName || "",
      guardianRelationship: student.guardianRelationship || "",
      guardianContact: student.guardianContact || "",
      whatsapp: student.whatsapp || "",
    });
    setAvatarPreview(
      student.avatar ? pb.files.getURL(student as unknown as RecordModel, student.avatar, { thumb: "100x100" }) : null,
    );
    setAvatarFile(null);
  }, [isOpen, student]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = new FormData();
      data.append("name", formData.name);
      data.append("nameinitials", formData.nameinitials);
      data.append("mobile", formData.mobile);
      data.append("email", formData.email);
      data.append("emailVisibility", "true");
      data.append("address", formData.address);
      data.append("city", formData.city);
      data.append("gender", formData.gender);
      data.append("dateOfBirth", formData.dateOfBirth);
      data.append("IdentificationDocument", formData.IdentificationDocument);
      data.append("guardianName", formData.guardianName);
      data.append("guardianRelationship", formData.guardianRelationship);
      data.append("guardianContact", formData.guardianContact);
      data.append("whatsapp", formData.whatsapp || formData.mobile);

      if (avatarFile) {
        data.append("avatar", avatarFile);
      }

      const updatedRecord = await pb
        .collection("users")
        .update(student.id, data);
      onUpdated(updatedRecord as unknown as StudentDetails);
      toast.success("Profile updated successfully");
      setIsOpen(false);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase flex items-center gap-2">
          <Edit size={14} /> Update Profile
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-8 rounded-[2.5rem] border-none shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-gray-900">
            Update Student Profile
          </DialogTitle>
          <p className="text-xs font-bold text-gray-400">
            Modify the basic information of the student below.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <User size={12} className="text-indigo-400" /> Student Avatar
            </label>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                    {avatarPreview ? (
                      <div className="w-full h-full relative">
                        <Image
                          src={avatarPreview}
                          alt="Avatar Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                    <User className="text-indigo-300" size={32} />
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
                    <XCircle size={14} />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="cursor-pointer group flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-md hover:shadow-indigo-200/50 w-fit">
                  <Upload size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <User size={12} className="text-indigo-400" /> Full Name
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <User size={12} className="text-indigo-400" /> Calling Name
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                value={formData.nameinitials}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nameinitials: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Phone size={12} className="text-indigo-400" /> WhatsApp Number
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mobile: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Mail size={12} className="text-indigo-400" /> Email Address
              </label>
              <input
                type="email"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <MapPin size={12} className="text-indigo-400" /> Home Address
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <MapPin size={12} className="text-indigo-400" /> City
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <User size={12} className="text-indigo-400" /> Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gender: e.target.value }))
                }
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-[10px] font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all appearance-none cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Calendar size={12} className="text-indigo-400" /> Date of Birth
              </label>
              <input
                type="date"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateOfBirth: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <ShieldCheck size={12} className="text-indigo-400" /> ID /
                Passport Number
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                value={formData.IdentificationDocument}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    IdentificationDocument: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={12} className="text-indigo-400" /> Guardian
              Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Guardian Name
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                  value={formData.guardianName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardianName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Relationship
                </label>
                <select
                  value={formData.guardianRelationship}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardianRelationship: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-[10px] font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Other Guardian</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Guardian Contact
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                  value={formData.guardianContact}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardianContact: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black text-[10px] tracking-widest hover:bg-gray-200 transition-all uppercase active:scale-95"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentControl() {
  const [isOpen, setIsOpen] = useState(false);
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Placeholder: in a real scenario, fetch outstanding installment for this month
  const outstandingAmount = 25000;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="px-6 py-3 rounded-xl bg-white border border-gray-100 text-indigo-600 font-black text-[10px] tracking-widest shadow-sm hover:shadow-md transition-all uppercase flex items-center gap-2">
          <Plus size={14} /> Record Payment
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-8 rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-gray-900">
            Record Payment
          </DialogTitle>
          <p className="text-xs font-bold text-gray-400">
            Attach bank slip to log this month&apos;s payment.
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {/* Outstanding Amount Card */}
          <div className="p-5 bg-indigo-50 border-2 border-indigo-100 rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                Outstanding This Month
              </p>
              <p className="text-3xl font-black text-indigo-700">
                LKR {outstandingAmount.toLocaleString()}
              </p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-md">
              <CreditCard size={24} />
            </div>
          </div>

          {/* Date (read-only, always today) */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
              Payment Date
            </p>
            <p className="text-xs font-black text-gray-900">{todayFormatted}</p>
          </div>

          {/* Slip Upload */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Attach Bank Slip / Receipt
            </h4>
            <label className="w-full border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all group">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <p className="text-xs font-bold text-gray-700 mb-1">
                Click to upload slip
              </p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                JPG, PNG or PDF — Max 10MB
              </p>
              <input type="file" className="hidden" accept="image/*,.pdf" />
            </label>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="w-full mt-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95"
        >
          Confirm Payment Log
        </button>
      </DialogContent>
    </Dialog>
  );
}

function UploadDocumentControl({
  documentName,
  documentType,
  studentId,
  onUploaded,
}: {
  documentName: string;
  documentType: "nic" | "ol" | "al" | "birth";
  studentId: string;
  onUploaded: () => Promise<void> | void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    const docType = DOCUMENT_TYPE_BY_CATEGORY[documentType as keyof typeof DOCUMENT_TYPE_BY_CATEGORY];
    setUploading(true);

    try {
      const data = new FormData();
      data.append("field", studentId);
      data.append("document_type", docType);
      data.append("document", selectedFile);
      data.append("status_", "pending");

      await pb.collection("documents").create(data);

      toast.success("Document uploaded successfully.");
      setSelectedFile(null);
      setIsOpen(false);
      await onUploaded();
    } catch (error: unknown) {
      if (isSuperuserOnlyError(error)) {
        toast.error("You don't have permission to upload documents.");
      } else {
        const err = error as { message?: string };
        toast.error(err?.message || "Failed to upload document.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full py-3.5 rounded-2xl border border-gray-100 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors uppercase text-[9px] font-black tracking-widest shadow-sm">
          <Upload size={14} /> Update File
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-8 rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-gray-900 text-center">
            Upload Document
          </DialogTitle>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 text-center mt-2 bg-indigo-50 py-2 rounded-xl">
            {documentName}
          </p>
        </DialogHeader>

        <label className="w-full border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors group">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
            <Upload size={24} />
          </div>
          <p className="text-sm font-bold text-gray-700 mb-1">
            Click to browse your files
          </p>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Supports PDF, JPG, PNG (Max 10MB)
          </p>
          <input
            type="file"
            className="hidden"
            accept=".pdf,image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
        </label>

        {selectedFile && (
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center">
            SELECTED: {selectedFile.name}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full mt-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload & Verify Document"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const studentId = id;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [financeFilter, setFinanceFilter] = useState("all");
  const [internalNote, setInternalNote] = useState("");
  const [savingInternalNote, setSavingInternalNote] = useState(false);
  const [updatingAccountStatus, setUpdatingAccountStatus] = useState(false);
  const noteStorageKey = `student_internal_note_${studentId}`;

  // Enrollment Modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const fetchStudentDetails = useCallback(async () => {
    try {
      setLoading(true);
      const record = await pb
        .collection("users")
        .getFirstListItem<StudentDetails>(`id = "${studentId}" && role = "student"`, {
          expand: "enrollments_via_student.course_intake.course",
        });

      let paymentRecords: Payment[] = [];
      try {
        const filterString = `student = "${studentId}"`;
        paymentRecords = await pb.collection("payments").getFullList<Payment>({
          filter: filterString,
          sort: "-created",
          expand: "enrollment.course_intake.course",
        });
      } catch (paymentError) {
        if (!isSuperuserOnlyError(paymentError)) {
          console.error("Error fetching student payments:", paymentError);
        }
      }

      let mappedDocuments: Document[] = [];
      try {
        const docRecords = await pb.collection("documents").getFullList<Document>({
          filter: `field = "${studentId}"`,
          sort: "-created",
        });
        mappedDocuments = docRecords;
      } catch (documentsError) {
        if (!isSuperuserOnlyError(documentsError)) {
          console.error("Error fetching student documents:", documentsError);
        }
      }

      setStudent({
        ...record,
        documents: mappedDocuments,
      });
      const studentData = record;

      // Fetch Assignments
      try {
        const enrollments = studentData.expand?.enrollments_via_student || [];
        const intakeIds = enrollments.map((e) => e.course_intake);
        
        if (intakeIds.length > 0) {
          // 1. Get all subjects for these intakes
          const subjects = await pb.collection("course_subjects").getFullList<CourseSubject>({
            filter: intakeIds.map((id: string) => `course_intake = "${id}"`).join(" || "),
            expand: "subject"
          });
          
          const subjectIds = subjects.map(s => s.id);
          
          if (subjectIds.length > 0) {
            // 2. Get assignments for these subjects
            const assignmentsRecords = await pb.collection("assignments").getFullList<Assignment>({
              filter: subjectIds.map((id: string) => `course_subject = "${id}"`).join(" || "),
              expand: "course_subject.subject",
              sort: "-due_date"
            });
            
            // 3. Get student's submissions
            const studentSubmissions = await pb.collection("assignment_submissions").getFullList<StudentAssignmentSubmission>({
              filter: `student = "${studentId}"`
            });
            
            // Map them together
            const mappedAssignments: StudentAssignment[] = assignmentsRecords.map(a => ({
              ...a,
              submission: studentSubmissions.find(s => s.assignment === a.id)
            }));
            
            setStudentAssignments(mappedAssignments);
          }
        }
      } catch (err) {
        console.error("Error fetching student assignments:", err);
      }

      const remoteNote = (record as StudentDetails).internalNote || "";
      const localNote =
        typeof window !== "undefined"
          ? window.localStorage.getItem(noteStorageKey) || ""
          : "";
      setInternalNote(remoteNote || localNote);
      setPayments(paymentRecords);
      setLoading(false);
    } catch (error) {
      if (!isSuperuserOnlyError(error)) {
        console.error("Error fetching student details:", error);
      }
      router.push("/dashboard/admin/students");
    }
  }, [studentId, router, noteStorageKey]);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId, fetchStudentDetails]);

  const saveInternalNote = async () => {
    if (!student) return;

    try {
      setSavingInternalNote(true);
      const updated = await pb.collection("users").update<StudentDetails>(student.id, {
        internalNote,
      });
      setStudent(updated);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(noteStorageKey, internalNote);
      }
      toast.success("Remarks saved");
    } catch (error: unknown) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(noteStorageKey, internalNote);
      }
      if (isSuperuserOnlyError(error)) {
        toast.success("Remarks saved locally");
      } else {
        toast.success("Remarks saved locally");
      }
    } finally {
      setSavingInternalNote(false);
    }
  };

  const handleAccountStatusChange = async (
    nextStatus: "active" | "disabled",
  ) => {
    if (!student) return;

    try {
      setUpdatingAccountStatus(true);
      const updated = await pb.collection("users").update<StudentDetails>(student.id, {
        accountStatus: nextStatus,
      });
      setStudent(updated);
      toast.success(
        `Student ${nextStatus === "active" ? "enabled" : "disabled"}`,
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (isSuperuserOnlyError(error)) {
        toast.error("You don't have permission to update account status.");
      } else {
        toast.error(err?.message || "Failed to update account status");
      }
    } finally {
      setUpdatingAccountStatus(false);
    }
  };

  if (loading || !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black text-xs uppercase tracking-widest">
            Fetching Profile...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "academic", label: "Academic", icon: BookOpen },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <div className="space-y-8 pb-20">
        {/* Header with Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <DashboardBreadcrumbs
            homeHref="/dashboard/admin"
            homeLabel="Dashboard"
            items={[{ label: "Students", href: "/dashboard/admin/students" }]}
          />
          <div className="flex items-center gap-3 md:ml-auto">
            {activeTab === "payments" && <RecordPaymentControl />}

            {activeTab === "academic" && (
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-white border border-gray-100 text-indigo-600 font-black text-[10px] tracking-widest shadow-sm hover:shadow-md transition-all uppercase flex items-center gap-2"
              >
                <Plus size={14} /> Enroll Course
              </button>
            )}

            {student.accountStatus === "active" ? (
              <button
                onClick={() => handleAccountStatusChange("disabled")}
                disabled={updatingAccountStatus}
                className="px-6 py-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-black text-[10px] tracking-widest shadow-sm hover:bg-rose-600 hover:text-white transition-all uppercase flex items-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <XCircle size={14} />
                {updatingAccountStatus ? "Updating..." : "Disable Access"}
              </button>
            ) : (
              <button
                onClick={() => handleAccountStatusChange("active")}
                disabled={updatingAccountStatus}
                className="px-6 py-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-[10px] tracking-widest shadow-sm hover:bg-indigo-600 hover:text-white transition-all uppercase flex items-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle size={14} />
                {updatingAccountStatus ? "Updating..." : "Enable Access"}
              </button>
            )}

            <UpdateProfileControl
              student={student}
              onUpdated={(updated) => setStudent(updated)}
            />

            {/* Reset Password Button and Modal */}
            <ResetPasswordControl
              studentId={student.id}
              studentName={student.name}
            />
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="relative group/avatar">
              {student.avatar ? (
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-indigo-50 border-4 border-white">
                  <Image
                    src={pb.files.getURL(student, student.avatar, { thumb: "128x128" })}
                    alt={student.name}
                    width={128}
                    height={128}
                    className="w-full h-h object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-4xl shadow-2xl ring-8 ring-indigo-50 border-4 border-white">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
                  {student.name}
                </h1>
              </div>

              <div className="flex grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {[
                  {
                    label: "Account status",
                    value: student.accountStatus,
                    color:
                      student.accountStatus === "active"
                        ? "text-emerald-500"
                        : "text-rose-500",
                  },
                  {
                    label: "Academic status",
                    value: student.academicStatus,
                    color: "text-indigo-600",
                  },
                  {
                    label: "User ID",
                    value: student.userId || "Not Assigned",
                    color: "text-indigo-600",
                  },
                  {
                    label: "Registered date",
                    value: new Date(student.created).toLocaleDateString(
                      "en-GB",
                      { month: "short", year: "numeric" },
                    ),
                    color: "text-gray-600",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100"
                  >
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      {stat.label}
                    </p>
                    <p
                      className={`text-xs font-black uppercase tracking-tight ${stat.color}`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-gray-400 hover:bg-gray-50 bg-transparent"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="w-full">
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-8">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <User size={20} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: "Full Name", value: student.name, icon: User },
                    {
                      label: "Name with Initials",
                      value: student.nameinitials || "Not Provided",
                      icon: User,
                    },
                    {
                      label: "Gender",
                      value: student.gender || "Not Provided",
                      icon: User,
                    },
                    {
                      label: "Date of Birth",
                      value: student.dateOfBirth
                        ? new Date(student.dateOfBirth).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                        : "Not Provided",
                      icon: Calendar,
                    },
                    {
                      label: "ID Card / Passport",
                      value: student.IdentificationDocument || "Not Provided",
                      icon: ShieldCheck,
                    },
                    {
                      label: "Personal Email",
                      value: student.email,
                      icon: Mail,
                    },
                    {
                      label: "WhatsApp Number",
                      value: student.mobile,
                      icon: Phone,
                    },
                    {
                      label: "Home Address",
                      value:
                        [student.address, student.city]
                          .filter(Boolean)
                          .join(", ") || "Not Provided",
                      icon: MapPin,
                    },
                    {
                      label: "Guardian Name",
                      value: student.guardianName || "Not Provided",
                      icon: Users,
                    },
                    {
                      label: "Relationship",
                      value: student.guardianRelationship || "Not Provided",
                      icon: Users,
                    },
                    {
                      label: "Guardian Contact",
                      value: student.guardianContact || "Not Provided",
                      icon: Phone,
                    },
                    {
                      label: "Academic Advisor",
                      value: student.academicAdvisor || "Not Assigned",
                      icon: Users,
                    },
                  ].map((field, idx) => (
                    <div key={idx} className="space-y-1.5 group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <field.icon size={12} className="text-indigo-400" />{" "}
                        {field.label}
                      </p>
                      <p className="text-sm font-bold text-gray-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={20} className="text-indigo-600" />
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    Internal Notes
                  </h3>
                </div>
                <textarea
                  placeholder="Write internal remarks about this student..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="w-full min-h-[150px] bg-gray-50 border-none rounded-2xl p-4 text-xs font-medium text-gray-600 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-gray-300 transition-all"
                ></textarea>
                <button
                  onClick={saveInternalNote}
                  disabled={savingInternalNote}
                  className="w-full mt-4 py-4 rounded-2xl bg-gray-900 text-white font-black text-[10px] tracking-widest shadow-xl shadow-gray-200 hover:bg-indigo-600 transition-all active:scale-95 uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingInternalNote ? "Saving..." : "Save Remarks"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "academic" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-8">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    Registered Pathways
                  </h3>
                </div>

                <div className="space-y-4">
                  {student.expand?.enrollments_via_student?.length ? (
                    student.expand.enrollments_via_student.map(
                      (enrollment, idx) => {
                        const course =
                          enrollment.expand?.course_intake?.expand?.course;
                        return (
                          <div
                            key={idx}
                            className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <BookOpen size={24} />
                              </div>
                              <div>
                                <h4 className="font-black text-gray-900 uppercase tracking-tight">
                                  {course?.name || "Unknown Course"}
                                </h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                  REG NO:{" "}
                                  {enrollment.registration_number || "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                  CERTIFICATE STATUS:
                                </span>
                                <CertificateStatusControl
                                  enrollmentId={enrollment.id}
                                  initialStatus={enrollment.certificate_status}
                                  onUpdated={fetchStudentDetails}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                  Ongoing
                                </Badge>
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                  Joined{" "}
                                  {new Date(
                                    enrollment.created,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <BookOpen
                        size={48}
                        className="mx-auto text-gray-300 mb-4"
                      />
                      <p className="text-gray-400 font-black text-xs uppercase tracking-widest">
                        No Active Enrollments Found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-8">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    Academic Assignments
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentAssignments.length > 0 ? (
                    studentAssignments.map((assign) => (
                      <div
                        key={assign.id}
                        className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-4 group hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1">
                                {assign.title}
                              </h4>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                {assign.expand?.course_subject?.expand?.subject?.name || "Subject Material"}
                              </p>
                            </div>
                          </div>
                          {!assign.submission ? (
                            <Badge className="bg-orange-50 text-orange-600 border-none px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                              Not Submitted
                            </Badge>
                          ) : assign.submission.evaluation_status === "pending" ? (
                            <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                              Pending Review
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                              Graded
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Due Date</p>
                            <p className="text-[10px] font-bold text-gray-700">
                              {new Date(assign.due_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Marks Obtained</p>
                            <p className="text-sm font-black text-indigo-600">
                              {assign.submission?.mark !== undefined ? `${assign.submission.mark} / ${assign.total_marks || 100}` : `-- / ${assign.total_marks || 100}`}
                            </p>
                          </div>
                        </div>

                        {assign.submission && (
                          <div className="mt-2 flex items-center justify-between gap-3">
                             <div className="flex items-center gap-2">
                               {assign.submission.grade && (
                                 <div className="px-2.5 py-1 bg-indigo-50 rounded-lg text-[10px] font-black text-indigo-600 border border-indigo-100 uppercase tracking-widest">
                                   GRADE: {assign.submission.grade}
                                 </div>
                               )}
                             </div>
                             <button
                               onClick={() => router.push(`/dashboard/admin/assignments/${assign.id}`)}
                               className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1.5"
                             >
                               VIEW RECORD <ExternalLink size={10} />
                             </button>
                          </div>
                        )}
                        
                        {assign.submission?.feedback && (
                           <div className="mt-2 p-3 bg-gray-100/50 rounded-xl border border-gray-100">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                               <Mail size={10} /> Lecturer Feedback
                             </p>
                             <p className="text-[10px] font-bold text-gray-600 italic">
                               &quot;{assign.submission.feedback}&quot;
                             </p>
                           </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <FileText
                        size={48}
                        className="mx-auto text-gray-300 mb-4"
                      />
                      <p className="text-gray-400 font-black text-xs uppercase tracking-widest">
                        No Assignments Found for this student
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    Payment Ledger
                  </h3>
                </div>
                <select
                  value={financeFilter}
                  onChange={(e) => setFinanceFilter(e.target.value)}
                  className="bg-gray-50 border-none text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl px-4 py-2 focus:ring-0 cursor-pointer"
                >
                  <option value="all">ALL PAYMENTS</option>
                  <option value="verified">VERIFIED ONLY</option>
                  <option value="pending">PENDING ONLY</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="py-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Reference ID
                      </th>
                      <th className="py-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Date Paid
                      </th>
                      <th className="py-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Course
                      </th>
                      <th className="py-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Amount
                      </th>
                      <th className="py-4 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {payments.length > 0 ? (
                      payments.map((payment) => (
                        <tr key={payment.id} className="group">
                          <td className="py-5">
                            <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                              #{payment.reference_Id}
                            </span>
                          </td>
                          <td className="py-5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                              {new Date(payment.date_paid).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-5">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">
                              {payment.expand?.course?.name || "Registration"}
                            </span>
                          </td>
                          <td className="py-5">
                            <span className="text-sm font-black text-gray-900">
                              ₹{payment.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-5 text-center">
                            {payment.verified ? (
                              <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase tracking-widest">
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-500 text-white border-none text-[8px] font-black uppercase tracking-widest animate-pulse">
                                Pending
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest italic"
                        >
                          No transaction history available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Archive size={24} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  STUDENT <span className="text-indigo-600">DOCUMENTS</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: "nic", label: "NIC / IDENTIFICATION" },
                  { id: "ol", label: "OL TRANSCRIPTS" },
                  { id: "al", label: "AL TRANSCRIPTS" },
                  { id: "birth", label: "BIRTH CERTIFICATE" },
                ].map((docDef) => {
                  const docType = DOCUMENT_TYPE_BY_CATEGORY[docDef.id as keyof typeof DOCUMENT_TYPE_BY_CATEGORY];
                  const doc = student.documents?.find(
                    (d) => d.document_type === docType,
                  );
                  const status = doc ? doc.status_ : "not_uploaded";

                  let statusBg = "bg-gray-50";
                  let statusText = "text-gray-400";
                  let statusLabel = "NOT UPLOADED";

                  if (status === "verified") {
                    statusBg = "bg-emerald-100/50";
                    statusText = "text-emerald-500";
                    statusLabel = "VERIFIED";
                  } else if (status === "pending") {
                    statusBg = "bg-amber-100/50";
                    statusText = "text-amber-500";
                    statusLabel = "PENDING";
                  } else if (status === "rejected") {
                    statusBg = "bg-red-100/50";
                    statusText = "text-red-500";
                    statusLabel = "REJECTED";
                  }

                  const documentUrl = doc
                    ? pb.files.getUrl(
                        { id: doc.id, collectionId: "documents" },
                        doc.document,
                      )
                    : null;

                  return (
                    <div
                      key={docDef.id}
                      className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col items-center group hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300"
                    >
                      <div className="w-full flex justify-between items-start mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100/50">
                          <FileText size={20} />
                        </div>
                        <Badge
                          className={`${statusBg} ${statusText} border-none shadow-none text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-xl`}
                        >
                          {statusLabel}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight text-center mb-2 leading-tight">
                        {docDef.label}
                      </h4>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mb-8">
                        UPLOADED:{" "}
                        {doc?.created
                          ? new Date(doc.created)
                              .toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                              .toUpperCase()
                          : "-"}
                      </p>

                      {documentUrl && (
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full mb-3 py-3.5 rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors uppercase text-[9px] font-black tracking-widest shadow-sm flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={14} /> View Current File
                        </a>
                      )}

                      <UploadDocumentControl
                        documentName={docDef.label}
                        documentType={
                          docDef.id as "nic" | "ol" | "al" | "birth"
                        }
                        studentId={student.id}
                        onUploaded={fetchStudentDetails}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* End of tab content */}
        </div>


      {student && (
        <EnrollCourseModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          onSuccess={() => {
            // Refetch student data here manually if needed, or simply let the state update
            setIsEnrollModalOpen(false);
            window.location.reload();
          }}
          studentId={student.id}
        />
      )}
    </div>
  );
}
