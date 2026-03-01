"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  TrendingUp,
  Shield,
  FileBox,
  Camera,
  Lock,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

export default function StudentProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Required document types
  const requiredDocuments = [
    { type: "NIC / Identification", key: "nic" },
    { type: "OL Transcripts", key: "ol_transcript" },
    { type: "AL Transcripts", key: "al_transcript" },
    { type: "Birth Certificate", key: "birth_certificate" },
  ];

  useEffect(() => {
    const checkAccountStatus = async () => {
      const currentUser = pb.authStore.model;
      if (!currentUser || currentUser.role !== "student") {
        router.push("/login");
        return;
      }

      // Refresh user auth to get latest account status from server
      try {
        await pb.collection("users").authRefresh();
      } catch (error) {
        console.log("Auth refresh failed:", error);
      }

      // Check account status from refreshed auth store
      const latestUser = pb.authStore.model;
      if (latestUser?.accountStatus === "disabled") {
        setLoading(false);
        setIsAccountDisabled(true);
        return;
      }

      if (!latestUser?.id) {
        router.push("/login");
        return;
      }

      setStudentData({
        fullName: latestUser.name || "Student",
        email: latestUser.email || "",
        mobile: latestUser.mobile || "",
        dob: latestUser.dateOfBirth || "",
        nic: latestUser.IdentificationDocument || "",
        studentId: latestUser.userId || "N/A",
        avatarUrl: latestUser.avatar
          ? pb.files.getUrl(latestUser, latestUser.avatar)
          : "/profile-img.jpg",
      });

      // Fetch documents from database
      fetchDocuments(latestUser.id);
    };

    checkAccountStatus();
  }, [router]);

  const fetchDocuments = async (studentId: string) => {
    try {
      // Fetch documents via API endpoint
      const token = pb.authStore.token;
      const response = await fetch("/api/student/documents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw { status: response.status, message: response.statusText };
      }

      const data = await response.json();
      const docs = data.documents;

      // Merge required documents with fetched documents
      const mergedDocs = requiredDocuments.map((reqDoc) => {
        const existingDoc = docs.find(
          (d: any) => d.document_type === reqDoc.key,
        );
        return (
          existingDoc || {
            document_type: reqDoc.key,
            name: reqDoc.type,
            status_: null,
            field: studentId,
          }
        );
      });

      setDocuments(mergedDocs);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      // Handle permission errors by redirecting to login
      if (error?.status === 403 || error?.status === 404) {
        toast.error("Permission denied. Please log in again.");
        setLoading(false);
        await pb.authStore.clear();
        router.push("/login");
        return;
      }
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadClick = (doc: any) => {
    // Don't allow upload if document is already verified
    if (doc.status_ === "verified") {
      return;
    }
    setSelectedDoc(doc);
    setUploadFile(null);
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      // Validate file type
      const validTypes = ["application/pdf", "image/png", "image/jpeg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only PDF, PNG, and JPG files are allowed");
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedDoc) return;

    setUploading(true);
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser) return;

      const formData = new FormData();
      formData.append("field", currentUser.id);
      formData.append("document_type", selectedDoc.document_type);
      formData.append("document", uploadFile);
      formData.append("status_", "pending");

      if (selectedDoc.id) {
        // Update existing document
        await pb.collection("documents").update(selectedDoc.id, formData);
      } else {
        // Create new document
        await pb.collection("documents").create(formData);
      }

      // Refresh documents
      await fetchDocuments(currentUser.id);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      toast.success(
        "Document uploaded successfully and is pending verification!",
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as any,
      },
    },
  };

  // Show disabled account message first (before loading or other checks)
  if (isAccountDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-12 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Lock size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Account Disabled
          </h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Your account has been disabled. Please contact the administrator for
            assistance.
          </p>
          <button
            onClick={async () => {
              await pb.authStore.clear();
              router.push("/login");
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading || !studentData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-10 pb-20"
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          console.log("File selected:", e.target.files?.[0]);
        }}
      />

      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50"
          >
            <User size={40} />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              My <span className="text-indigo-600">Profile</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-400" />
              Manage account settings & verification
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Avatar (1/4 weight) */}
        <div className="lg:col-span-1">
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 text-center relative overflow-hidden group h-full flex flex-col justify-center"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110" />
            <div className="relative z-10">
              <div className="relative inline-block mb-4">
                <img
                  src={studentData.avatarUrl}
                  alt={studentData.fullName}
                  className="w-36 h-36 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl mx-auto"
                />
                <button
                  onClick={handleAvatarClick}
                  className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 rounded-2xl text-white shadow-xl hover:bg-indigo-700 transition-all active:scale-95 group/btn"
                >
                  <Camera
                    size={18}
                    className="group-hover/btn:rotate-12 transition-transform"
                  />
                </button>
              </div>
              <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4">
                {studentData.studentId}
              </p>

              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 rounded-2xl text-[10px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-all w-full justify-center"
              >
                <Lock size={14} />
                Reset Account Password
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Identity Record (3/4 weight) */}
        <div className="lg:col-span-3">
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <Shield size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                    Personal{" "}
                    <span className="text-indigo-600">Information</span>
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Full Name", value: studentData.fullName, icon: User },
                {
                  label: "Email Address",
                  value: studentData.email,
                  icon: Mail,
                },
                {
                  label: "Mobile Number",
                  value: studentData.mobile,
                  icon: Phone,
                },
                {
                  label: "Date of Birth",
                  value: studentData.dob,
                  icon: Calendar,
                },
                {
                  label: "NIC / Passport Number",
                  value: studentData.nic,
                  icon: ShieldCheck,
                },
              ].map((info, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-4 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-indigo-100 hover:bg-white transition-all duration-500 group ${idx === 0 ? "md:col-span-2" : ""}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform group-hover:shadow-indigo-100 group-hover:shadow-xl">
                    <info.icon size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      {info.label}
                    </span>
                    <span className="text-sm font-black text-gray-900 truncate">
                      {info.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-amber-50 rounded-[1.25rem] p-3 border border-amber-100 flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                For security reasons, identity information is read-only. Please
                submit a support ticket to request updates.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Full Width Bottom Section: Document Vault */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10"
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 shadow-inner">
              <FileBox size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                Student <span className="text-indigo-600">Documents</span>
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:border-indigo-100 hover:bg-white transition-all duration-500 group flex flex-col items-center text-center"
            >
              <div className="flex items-center justify-between w-full mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 group-hover:text-indigo-600 shadow-sm transition-all group-hover:shadow-lg">
                  <FileText size={24} />
                </div>
                <Badge doc={doc} />
              </div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2">
                {doc.name || doc.documentType || "Document"}
              </h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                Modified:{" "}
                {doc.updated ? new Date(doc.updated).toLocaleDateString() : "-"}
              </p>

              <button
                onClick={() => handleUploadClick(doc)}
                disabled={doc.status_ === "verified"}
                className={`w-full py-4 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group/upload ${
                  doc.status_ === "verified"
                    ? "opacity-50 cursor-not-allowed text-gray-400"
                    : "text-gray-500 hover:border-indigo-600 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-50"
                }`}
              >
                <Upload
                  size={16}
                  className={
                    doc.status_ !== "verified"
                      ? "group-hover/upload:-translate-y-1 transition-transform"
                      : ""
                  }
                />
                {doc.status_ === "verified"
                  ? "Verified"
                  : !doc.status_
                    ? "Upload File"
                    : "Update File"}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Reset Password"
      >
        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">
              Current Password
            </label>
            <input
              type="password"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">
              New Password
            </label>
            <input
              type="password"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 mt-4">
            Update Password
          </button>
        </form>
      </Modal>

      {/* Document Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
        }}
        title={`Upload ${selectedDoc?.name || "Document"}`}
      >
        <div className="space-y-6">
          <input
            ref={uploadInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => uploadInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group cursor-pointer"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            {uploadFile ? (
              <>
                <p className="text-sm font-black text-indigo-600 uppercase tracking-tight mb-1">
                  {uploadFile.name}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">
                  Click to upload
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  PDF, PNG or JPG (Max 5MB)
                </p>
              </>
            )}
          </div>
          <button
            onClick={handleUploadSubmit}
            disabled={!uploadFile || uploading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              "Submit for Verification"
            )}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-lg p-10 pointer-events-auto shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                  >
                    <X size={24} />
                  </button>
                </div>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function Badge({ doc }: { doc: any }) {
  const statusMap: Record<string, string> = {
    verified: "Verified",
    pending: "Pending",
    rejected: "Rejected",
  };

  const styles =
    {
      verified: "bg-green-100 text-green-600 border-green-200",
      pending: "bg-amber-100 text-amber-600 border-amber-200",
      rejected: "bg-red-100 text-red-600 border-red-200",
    }[doc.status_ as string] || "bg-gray-100 text-gray-400 border-gray-200";

  return (
    <span
      className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${styles}`}
    >
      {statusMap[doc.status_ as string] || "Not Uploaded"}
    </span>
  );
}
