"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Check,
  Key,
  Calendar,
  Type,
  IdCard,
  Globe,
  MessageSquare,
  Camera,
  Upload,
  X,
  Shield,
  GraduationCap,
  Building2,
  Briefcase,
} from "lucide-react";
import { ModernModal } from "@/components/ui/modern-modal";
import { Badge } from "@/components/ui/badge";
import pb, { isSuperuserOnlyError } from "@/lib/pocketbase";
import { toast } from "sonner";

interface EditUser {
  id: string;
  userId: string;
  name: string;
  nameinitials: string;
  email: string;
  role: "admin" | "lecturer";
  gender: string;
  dateOfBirth: string;
  IdentificationDocument: string;
  countryCode: string;
  mobile: string;
  whatsapp: string;
  address: string;
  city: string;
  branch: string;
  designation: string;
  field: string;
  mainDepartment: string;
  subDepartment: string;
  hiredOn: string;
  internalNotes: string;
  avatar: string;
  collectionId: string;
}

interface RegisterStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultRole?: "admin" | "lecturer";
  editUser?: EditUser | null;
}

export function RegisterStaffModal({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = "admin",
  editUser = null,
}: RegisterStaffModalProps) {
  const isEditMode = !!editUser;
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Stage 1: Role & Identity
    role: defaultRole as "admin" | "lecturer",
    name: "",
    nameinitials: "",
    gender: "male",
    dateOfBirth: "",
    IdentificationDocument: "",

    // Stage 2: Contact
    email: "",
    mobile: "",
    whatsapp: "",
    address: "",
    city: "",
    countryCode: "+94",

    // Stage 3: Account & Role Details
    userId: "",
    password: "",
    branch: "Colombo",
    designation: "",
    field: "",
    mainDepartment: "",
    subDepartment: "",
    hiredOn: new Date().toISOString().slice(0, 10),
    internalNotes: "",
  });

  useEffect(() => {
    if (isOpen) {
      setStage(1);
      setAvatarFile(null);
      setValidationError("");

      if (editUser) {
        // Pre-fill with existing user data
        setFormData({
          role: editUser.role,
          name: editUser.name || "",
          nameinitials: editUser.nameinitials || "",
          gender: editUser.gender || "male",
          dateOfBirth: editUser.dateOfBirth
            ? editUser.dateOfBirth.slice(0, 10)
            : "",
          IdentificationDocument: editUser.IdentificationDocument || "",
          email: editUser.email || "",
          mobile: editUser.mobile || "",
          whatsapp: editUser.whatsapp || "",
          address: editUser.address || "",
          city: editUser.city || "",
          countryCode: editUser.countryCode || "+94",
          userId: editUser.userId || "",
          password: "",
          branch: editUser.branch || "Colombo",
          designation: editUser.designation || "",
          field: editUser.field || "",
          mainDepartment: editUser.mainDepartment || "",
          subDepartment: editUser.subDepartment || "",
          hiredOn: editUser.hiredOn
            ? editUser.hiredOn.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          internalNotes: editUser.internalNotes || "",
        });
        // Show existing avatar if any
        if (editUser.avatar) {
          setAvatarPreview(
            pb.files.getURL(editUser, editUser.avatar, { thumb: "200x200" }),
          );
        } else {
          setAvatarPreview(null);
        }
      } else {
        // Reset for create mode
        setFormData((prev) => ({
          ...prev,
          role: defaultRole,
          name: "",
          nameinitials: "",
          gender: "male",
          dateOfBirth: "",
          IdentificationDocument: "",
          email: "",
          mobile: "",
          whatsapp: "",
          address: "",
          city: "",
          countryCode: "+94",
          userId: "",
          password: "",
          branch: "Colombo",
          designation: "",
          field: "",
          mainDepartment: "",
          subDepartment: "",
          hiredOn: new Date().toISOString().slice(0, 10),
          internalNotes: "",
        }));
        setAvatarPreview(null);
        generateNextUserId(defaultRole);
      }
    }
  }, [isOpen, defaultRole, editUser]);

  // Re-generate userId when role changes (only in create mode)
  useEffect(() => {
    if (isOpen && !isEditMode) {
      generateNextUserId(formData.role);
    }
  }, [formData.role]);

  const generateNextUserId = async (role: "admin" | "lecturer") => {
    try {
      if (role === "admin") {
        const records = await pb.collection("users").getList(1, 1, {
          filter: 'userId ~ "ADMIN%"',
          sort: "-userId",
        });

        let nextNumber = 1;
        if (records.items.length > 0) {
          const lastUserId = records.items[0].userId;
          const numMatch = lastUserId.match(/ADMIN(\d+)$/);
          if (numMatch) {
            nextNumber = parseInt(numMatch[1]) + 1;
          }
        }

        const nextUserId = `ADMIN${String(nextNumber).padStart(4, "0")}`;
        setFormData((prev) => ({ ...prev, userId: nextUserId }));
      } else {
        // Lecturer: ACDX-LECT0001
        const records = await pb.collection("users").getList(1, 1, {
          filter: 'userId ~ "ACDX-LECT%"',
          sort: "-userId",
        });

        let nextNumber = 1;
        if (records.items.length > 0) {
          const lastUserId = records.items[0].userId;
          const numMatch = lastUserId.match(/LECT(\d+)$/);
          if (numMatch) {
            nextNumber = parseInt(numMatch[1]) + 1;
          }
        }

        const nextUserId = `ACDX-LECT${String(nextNumber).padStart(4, "0")}`;
        setFormData((prev) => ({ ...prev, userId: nextUserId }));
      }
    } catch (error) {
      if (!isSuperuserOnlyError(error)) {
        console.error("Error generating userId:", error);
      }
      const fallback =
        role === "admin"
          ? `ADMIN${Date.now().toString().slice(-4)}`
          : `ACDX-LECT${Date.now().toString().slice(-4)}`;
      setFormData((prev) => ({ ...prev, userId: fallback }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getMissingRequiredFields = () => {
    const missing: string[] = [];

    if (stage === 1) {
      if (!formData.name.trim()) missing.push("Full Name");
      if (!formData.nameinitials.trim()) missing.push("Name with Initials");
      if (!formData.dateOfBirth) missing.push("Date of Birth");
      if (!formData.IdentificationDocument.trim())
        missing.push("ID / Passport Number");
    }

    if (stage === 2) {
      if (!formData.email.trim()) missing.push("Email");
      if (!formData.mobile.trim()) missing.push("Mobile");
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
    if (stage === 3) {
      handleSubmit();
      return;
    }
    setValidationError("");
    setStage((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("nameinitials", formData.nameinitials);
      data.append("email", formData.email);
      data.append("gender", formData.gender);
      data.append("dateOfBirth", formData.dateOfBirth);
      data.append("IdentificationDocument", formData.IdentificationDocument);
      data.append("countryCode", formData.countryCode);
      data.append("mobile", formData.mobile);
      data.append("whatsapp", formData.whatsapp || formData.mobile);
      data.append("address", formData.address);
      data.append("city", formData.city);
      data.append("role", formData.role);
      data.append("branch", formData.branch);
      data.append("designation", formData.designation);
      data.append("field", formData.field);
      data.append("mainDepartment", formData.mainDepartment);
      data.append("subDepartment", formData.subDepartment);
      data.append("hiredOn", formData.hiredOn);
      data.append("internalNotes", formData.internalNotes);

      if (avatarFile) {
        data.append("avatar", avatarFile);
      }

      if (isEditMode && editUser) {
        // If admin entered a new password, reset it via server-side admin API
        if (formData.password) {
          const res = await fetch(
            `/api/admin/users/${editUser.id}/reset-password`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ newPassword: formData.password }),
            },
          );

          if (!res.ok) {
            const err = await res.json().catch(() => null);
            const msg = err?.error || "Failed to reset password";
            toast.error(msg);
            setLoading(false);
            return;
          }
        }

        // Update existing user (non-password fields) directly via PocketBase
        data.append("userId", formData.userId);
        data.append("emailVisibility", "true");

        await pb.collection("users").update(editUser.id, data);

        toast.success(
          `${formData.role === "admin" ? "Admin" : "Lecturer"} account updated: ${formData.userId}`,
        );
      } else {
        // Create new user
        data.append("userId", formData.userId);
        data.append("password", formData.password || formData.userId);
        data.append("passwordConfirm", formData.password || formData.userId);
        data.append("emailVisibility", "true");
        data.append("accountStatus", "active");

        // Non-required fields with defaults
        data.append("guardianName", "N/A");
        data.append("guardianRelationship", "guardian");
        data.append("guardianContact", "N/A");

        await pb.collection("users").create(data);

        toast.success(
          `${formData.role === "admin" ? "Admin" : "Lecturer"} account created: ${formData.userId}`,
        );
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} staff account:`,
        error,
      );
      // Log the full response data for debugging
      if (error?.response?.data) {
        console.log(
          "PocketBase Error Details:",
          JSON.stringify(error.response.data, null, 2),
        );
      }

      // Extract field-specific error messages
      const fieldErrors = error?.response?.data || {};
      let firstErrorMessage = "";

      for (const field in fieldErrors) {
        if (fieldErrors[field]?.message) {
          firstErrorMessage = `${field}: ${fieldErrors[field].message}`;
          break;
        }
      }

      const errorMessage =
        firstErrorMessage ||
        `Failed to ${isEditMode ? "update" : "create"} account`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { label: "Identity", icon: User },
    { label: "Contact", icon: Mail },
    { label: "Account", icon: Key },
  ];

  const roleConfig = {
    admin: {
      color: "bg-blue-600",
      lightBg: "bg-blue-50",
      lightText: "text-blue-600",
      ringColor: "focus:ring-blue-500/20",
      icon: Shield,
      label: "Administrator",
    },
    lecturer: {
      color: "bg-violet-600",
      lightBg: "bg-violet-50",
      lightText: "text-violet-600",
      ringColor: "focus:ring-violet-500/20",
      icon: GraduationCap,
      label: "Lecturer",
    },
  };

  const rc = roleConfig[formData.role];

  const inputClassName = `w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 ${rc.ringColor} font-bold transition-all text-gray-900 placeholder:text-gray-300 placeholder:font-medium`;

  return (
    <ModernModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={isEditMode ? `Edit ${rc.label}` : `New ${rc.label}`}
      subtitle={
        isEditMode
          ? `Editing ${formData.userId}`
          : `Creating ${formData.role} account → ${formData.userId || "..."}`
      }
      avatarChar={formData.role === "admin" ? "A" : "L"}
      avatarColor={rc.color}
    >
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-2">
          {stages.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                  i + 1 <= stage ? rc.color : "bg-gray-100"
                }`}
              />
              <span
                className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                  i + 1 <= stage ? rc.lightText : "text-gray-300"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* STAGE 1: Role & Identity */}
        {stage === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Account Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["admin", "lecturer"] as const).map((r) => {
                  const cfg = roleConfig[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, role: r }))
                      }
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                        formData.role === r
                          ? `border-current ${cfg.lightBg} ${cfg.lightText} shadow-sm`
                          : "border-gray-100 bg-white text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <cfg.icon size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">
                        {cfg.label}
                      </span>
                      {formData.role === r && (
                        <Check size={16} className="ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div
                  className={`w-20 h-20 rounded-2xl ${rc.lightBg} flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-current transition-colors`}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera size={24} className="text-gray-300" />
                  )}
                </div>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all">
                  <Upload size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-500">
                    Upload Photo
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <Type size={12} className="inline mr-1" /> Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={inputClassName}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <Type size={12} className="inline mr-1" /> Name Initials *
                </label>
                <input
                  type="text"
                  value={formData.nameinitials}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nameinitials: e.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="J. Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <User size={12} className="inline mr-1" /> Gender *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["male", "female"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, gender: g }))
                      }
                      className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                        formData.gender === g
                          ? `${rc.lightBg} ${rc.lightText} border-current`
                          : "border-gray-100 text-gray-400 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <Calendar size={12} className="inline mr-1" /> Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                <IdCard size={12} className="inline mr-1" /> NIC / Passport *
              </label>
              <input
                type="text"
                value={formData.IdentificationDocument}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    IdentificationDocument: e.target.value,
                  }))
                }
                className={inputClassName}
                placeholder="200012345678"
              />
            </div>
          </div>
        )}

        {/* STAGE 2: Contact */}
        {stage === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                <Mail size={12} className="inline mr-1" /> Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className={inputClassName}
                placeholder="john@institution.edu"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <Globe size={12} className="inline mr-1" /> Code
                </label>
                <select
                  value={formData.countryCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      countryCode: e.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  <option value="+94">🇱🇰 +94</option>
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+971">🇦🇪 +971</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <Phone size={12} className="inline mr-1" /> Mobile *
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mobile: e.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="771234567"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <MessageSquare size={12} className="inline mr-1" /> WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      whatsapp: e.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Same as mobile"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                <MapPin size={12} className="inline mr-1" /> Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                className={inputClassName}
                placeholder="123, Main Street"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                <Building2 size={12} className="inline mr-1" /> City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                className={inputClassName}
                placeholder="Colombo"
              />
            </div>
          </div>
        )}

        {/* STAGE 3: Account & Role Details */}
        {stage === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* User ID */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    {isEditMode ? "User ID" : "Auto-Generated User ID"}
                  </label>
                  <span className={`text-2xl font-black ${rc.lightText}`}>
                    {formData.userId}
                  </span>
                </div>
                <Badge
                  className={`${rc.color} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1`}
                >
                  {formData.role}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <Key size={12} className="inline mr-1" />{" "}
                  {isEditMode ? "Reset Password" : "Password"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder={
                    isEditMode
                      ? "Leave blank to keep current"
                      : "Leave blank = User ID"
                  }
                />
                <p className="text-[9px] font-bold text-gray-300 mt-1.5 ml-1 uppercase tracking-widest">
                  {isEditMode
                    ? "No old password needed"
                    : "Default: same as User ID"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <Building2 size={12} className="inline mr-1" /> Branch *
                </label>
                <select
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      branch: e.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  <option value="Colombo">Colombo</option>
                  <option value="Negambo">Negambo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <Briefcase size={12} className="inline mr-1" /> Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      designation: e.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder={
                    formData.role === "admin"
                      ? "System Administrator"
                      : "Senior Lecturer"
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  <GraduationCap size={12} className="inline mr-1" /> Field
                </label>
                <input
                  type="text"
                  value={formData.field}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, field: e.target.value }))
                  }
                  className={inputClassName}
                  placeholder="Computer Science"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Main Department
                </label>
                <input
                  type="text"
                  value={formData.mainDepartment}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mainDepartment: e.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Faculty of Computing"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Sub Department
                </label>
                <input
                  type="text"
                  value={formData.subDepartment}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subDepartment: e.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Software Engineering"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                <Calendar size={12} className="inline mr-1" /> Hired On
              </label>
              <input
                type="date"
                value={formData.hiredOn}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hiredOn: e.target.value,
                  }))
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Internal Notes
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    internalNotes: e.target.value,
                  }))
                }
                className={`${inputClassName} resize-none`}
                rows={2}
                placeholder="Optional notes about this account..."
              />
            </div>
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-xs font-bold text-red-500">{validationError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-50">
          <button
            onClick={handlePrimaryAction}
            disabled={loading}
            className={`w-full py-4 ${rc.color} text-white rounded-2xl font-black text-sm shadow-xl hover:opacity-90 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Updating Account..." : "Creating Account..."}
              </>
            ) : stage === 3 ? (
              <>
                <Check size={16} />{" "}
                {isEditMode ? `Update ${rc.label}` : `Create ${rc.label}`}
              </>
            ) : (
              <>
                Next Step <ChevronRight size={16} />
              </>
            )}
          </button>
          {stage > 1 && (
            <button
              onClick={() => {
                setValidationError("");
                setStage((prev) => prev - 1);
              }}
              disabled={loading}
              className="w-full py-2 font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}
        </div>
      </div>
    </ModernModal>
  );
}
