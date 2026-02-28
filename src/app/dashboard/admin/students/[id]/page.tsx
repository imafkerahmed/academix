"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import pb, { logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import {
  User,
  BookOpen,
  CreditCard,
  Award,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  Edit,
  ShieldCheck,
  TrendingUp,
  FileText,
  Plus,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Upload,
  Archive,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnrollCourseModal } from "@/components/admin/EnrollCourseModal";

interface Document {
  id: string;
  name: string;
  category: "nic" | "ol" | "al" | "birth" | "other";
  status: "verified" | "pending" | "not_uploaded";
  date?: string;
}

interface StudentDetails {
  id: string;
  userId: string;
  avatar: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  role: string;
  accountStatus: string;
  academicStatus: string;
  created: string;
  dob?: string;
  gender?: string;
  idNumber?: string;
  callingName?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  address?: string;
  expand?: {
    "enrollments(student)"?: Enrollment[];
  };
  academicAdvisor?: string;
  documents?: Document[];
}

interface Enrollment {
  id: string;
  created: string;
  expand?: {
    course_intake_fee?: {
      expand?: {
        course_intake?: {
          expand?: {
            course?: {
              id: string;
              name: string;
              code: string;
            };
          };
        };
      };
    };
  };
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

function CertificateStatusControl({
  initialStatus = "PENDING",
}: {
  initialStatus?: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isOpen, setIsOpen] = useState(false);

  // Derive styles based on status
  let statusBg =
    "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 focus:ring-amber-50/50";
  if (status === "PROCESSING")
    statusBg =
      "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 focus:ring-indigo-50/50";
  if (status === "ISSUED")
    statusBg =
      "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 focus:ring-emerald-50/50";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={`px-4 py-1.5 rounded-xl border hover:shadow-sm transition-all focus:ring-4 text-[9px] font-black uppercase tracking-widest cursor-pointer ${statusBg}`}
        >
          {status}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-8 rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-gray-900 text-center">
            Update Certificate Status
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          {["PENDING", "PROCESSING", "ISSUED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                status === s
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm"
                  : "border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className="font-black text-xs uppercase tracking-widest">
                {s}
              </span>
              {status === s && (
                <CheckCircle size={18} className="text-indigo-600" />
              )}
            </button>
          ))}
        </div>

        {status === "ISSUED" && (
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
          className="w-full mt-6 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95"
        >
          {status === "ISSUED" ? "Save & Upload" : "Save Status"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

function UpdateProfileControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
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
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
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
                defaultValue="Mohamed Afker"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <User size={12} className="text-indigo-400" /> Calling Name
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                defaultValue="Afker"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Phone size={12} className="text-indigo-400" /> WhatsApp Number
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                defaultValue="0771234567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Mail size={12} className="text-indigo-400" /> Email Address
              </label>
              <input
                type="email"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                defaultValue="afker@example.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <MapPin size={12} className="text-indigo-400" /> Home Address
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                defaultValue="123 Galle Road, Colombo 03"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <User size={12} className="text-indigo-400" /> Gender
              </label>
              <select className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-[10px] font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all appearance-none cursor-pointer">
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
                defaultValue="1998-05-15"
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
                defaultValue="981360123V"
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
                  defaultValue="Mr. Kamal Perera"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Relationship
                </label>
                <select className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-[10px] font-black uppercase tracking-widest text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all appearance-none cursor-pointer">
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
                  defaultValue="0719876543"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black text-[10px] tracking-widest hover:bg-gray-200 transition-all uppercase active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentControl() {
  const [isOpen, setIsOpen] = useState(false);

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
            Record New Payment
          </DialogTitle>
          <p className="text-xs font-bold text-gray-400">
            Log a manual transaction for this student.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Select Enrolled Course
            </label>
            <select className="w-full bg-gray-50 border-none rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all cursor-pointer">
              <option value="c1">Fullstack Web Development</option>
              <option value="c2">UI/UX Graphic Design</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Amount Paid (LKR)
            </label>
            <input
              type="number"
              placeholder="Enter amount..."
              className="w-full bg-gray-50 border-none rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Payment Date
            </label>
            <input
              type="date"
              className="w-full bg-gray-50 border-none rounded-xl p-4 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
              defaultValue={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
              Upload Payment Proof (Slip / Receipt)
            </h4>
            <div className="w-full border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 transition-colors group">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                <Upload size={16} />
              </div>
              <p className="text-[10px] font-bold text-gray-700">
                Attach Bank Slip
              </p>
            </div>
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

function UploadDocumentControl({ documentName }: { documentName: string }) {
  const [isOpen, setIsOpen] = useState(false);

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

        <div className="w-full border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors group">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
            <Upload size={24} />
          </div>
          <p className="text-sm font-bold text-gray-700 mb-1">
            Click to browse your files
          </p>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Supports PDF, JPG, PNG (Max 10MB)
          </p>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="w-full mt-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase active:scale-95"
        >
          Upload & Verify Document
        </button>
      </DialogContent>
    </Dialog>
  );
}

function PaymentPreviewControl({ payment }: { payment: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm">
          <ExternalLink size={14} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-8 rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="mb-8 border-b border-gray-100 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-4">
            <CheckCircle size={32} />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-gray-900 text-center">
            Payment Verified
          </DialogTitle>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
            {payment.id}
          </p>
        </DialogHeader>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center py-3 border-b border-gray-50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Course
            </span>
            <span className="text-xs font-bold text-gray-900">
              {payment.courseName}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Data & Time
            </span>
            <span className="text-xs font-bold text-gray-900">
              {payment.date}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Amount Paid
            </span>
            <span className="text-lg font-black text-indigo-600">
              LKR {payment.amount.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="w-full py-4 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all uppercase active:scale-95 flex items-center justify-center gap-2"
        >
          <Archive size={16} /> Download PDF Receipt
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentDetail() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [financeFilter, setFinanceFilter] = useState("all");

  // Enrollment Modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  useEffect(() => {
    if (studentId) {
      if (studentId.startsWith("mock")) {
        handleMockData(studentId);
      } else {
        fetchStudentDetails();
      }
    }
  }, [studentId]);

  const handleMockData = (id: string) => {
    const mocks: Record<string, StudentDetails> = {
      mock1: {
        id: "mock1",
        userId: "ACDX100001",
        avatar: "",
        name: "Mohamed Afker",
        email: "afker@example.com",
        mobile: "0771234567",
        city: "Colombo",
        role: "student",
        accountStatus: "active",
        academicStatus: "enrolled",
        created: new Date().toISOString(),
        dob: "1998-05-15",
        gender: "Male",
        idNumber: "981234567V",
        academicAdvisor: "Mr. Samantha Perera",
        documents: [
          {
            id: "doc1",
            name: "NIC Document",
            category: "nic",
            status: "verified",
            date: "2024-01-12T00:00:00.000Z",
          },
          {
            id: "doc2",
            name: "O/L Transcript",
            category: "ol",
            status: "verified",
            date: "2024-01-12T00:00:00.000Z",
          },
          {
            id: "doc3",
            name: "A/L Transcript",
            category: "al",
            status: "pending",
            date: "2024-02-20T00:00:00.000Z",
          },
        ],
        expand: {
          "enrollments(student)": [
            {
              id: "enr1",
              created: new Date().toISOString(),
              expand: {
                course_intake_fee: {
                  expand: {
                    course_intake: {
                      expand: {
                        course: {
                          id: "c1",
                          name: "Fullstack Web Development",
                          code: "FSW",
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
      mock2: {
        id: "mock2",
        userId: "ACDX100002",
        avatar: "",
        name: "Sarah Jenkins",
        email: "sarah.j@example.com",
        mobile: "0719876543",
        city: "Negambo",
        role: "student",
        accountStatus: "active",
        academicStatus: "pending",
        created: new Date(Date.now() - 86400000).toISOString(),
        dob: "2000-11-20",
        gender: "Female",
        idNumber: "200023456789",
        academicAdvisor: "Mrs. Priyanthi Gunawardane",
        documents: [
          {
            id: "doc4",
            name: "NIC",
            category: "nic",
            status: "verified",
            date: "2024-02-15T00:00:00.000Z",
          },
        ],
        expand: { "enrollments(student)": [] },
      },
      mock3: {
        id: "mock3",
        userId: "ACDX100003",
        avatar: "",
        name: "David Miller",
        email: "miller.d@example.com",
        mobile: "0755554433",
        city: "Kandy",
        role: "student",
        accountStatus: "disabled",
        academicStatus: "enrolled",
        created: new Date(Date.now() - 172800000).toISOString(),
        dob: "1995-02-10",
        gender: "Male",
        idNumber: "951234567V",
        academicAdvisor: "Mr. Samantha Perera",
        documents: [
          {
            id: "doc5",
            name: "NIC",
            category: "nic",
            status: "verified",
            date: "2023-10-05T00:00:00.000Z",
          },
        ],
        expand: {
          "enrollments(student)": [
            {
              id: "enr2",
              created: new Date().toISOString(),
              expand: {
                course_intake_fee: {
                  expand: {
                    course_intake: {
                      expand: {
                        course: {
                          id: "c2",
                          name: "UI/UX Graphic Design",
                          code: "GDV",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              id: "enr3",
              created: new Date().toISOString(),
              expand: {
                course_intake_fee: {
                  expand: {
                    course_intake: {
                      expand: {
                        course: {
                          id: "c3",
                          name: "Advanced Python",
                          code: "PYT",
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    };

    setStudent(mocks[id] || mocks["mock1"]);

    // Add some mock payments for mock1 and mock3
    if (id === "mock1") {
      setPayments([
        {
          id: "p1",
          reference_Id: "TXN100001",
          date_paid: new Date().toISOString(),
          amount: 50000,
          payment_type: "Full Payment",
          verified: true,
          expand: { course: { name: "Fullstack Web Development" } },
        },
      ]);
    } else if (id === "mock3") {
      setPayments([
        {
          id: "p2",
          reference_Id: "TXN100002",
          date_paid: new Date().toISOString(),
          amount: 25000,
          payment_type: "Installment",
          verified: true,
          expand: { course: { name: "UI/UX Graphic Design" } },
        },
        {
          id: "p3",
          reference_Id: "TXN100003",
          date_paid: new Date().toISOString(),
          amount: 15000,
          payment_type: "Registration",
          verified: true,
          expand: { course: { name: "Advanced Python" } },
        },
      ]);
    }

    setLoading(false);
  };

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const record = await pb.collection("users").getOne(studentId, {
        expand: "enrollments(student).course_intake_fee.course_intake.course",
      });

      const paymentRecords = await pb.collection("payments").getFullList({
        filter: `student = "${studentId}"`,
        expand: "course",
        sort: "-date_paid",
      });

      setStudent(record as any);
      setPayments(paymentRecords as any);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching student details:", error);
      router.push("/dashboard/admin/students");
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
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <div className="bg-gray-50 min-h-screen lg:ml-64 font-sans">
      <main className="p-4 md:p-6 lg:p-8 space-y-8 pb-20">
        {/* Header with Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <AdminBreadcrumbs
            items={[
              { label: "Students", href: "/dashboard/admin/students" },
              {
                label: student.name,
                href: `/dashboard/admin/students/${student.id}`,
              },
            ]}
          />
          <div className="flex items-center gap-3">
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
                onClick={() =>
                  setStudent({ ...student, accountStatus: "disabled" })
                }
                className="px-6 py-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-black text-[10px] tracking-widest shadow-sm hover:bg-rose-600 hover:text-white transition-all uppercase flex items-center gap-2 active:scale-95"
              >
                <XCircle size={14} /> Disable Access
              </button>
            ) : (
              <button
                onClick={() =>
                  setStudent({ ...student, accountStatus: "active" })
                }
                className="px-6 py-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-[10px] tracking-widest shadow-sm hover:bg-indigo-600 hover:text-white transition-all uppercase flex items-center gap-2 active:scale-95"
              >
                <CheckCircle size={14} /> Enable Access
              </button>
            )}

            <UpdateProfileControl />
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="relative group/avatar">
              {student.avatar ? (
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-indigo-50 border-4 border-white">
                  <img
                    src={pb.files.getUrl(student as any, student.avatar)}
                    alt={student.name}
                    className="w-full h-full object-cover"
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
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
                    {student.name}
                  </h1>
                  <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {student.userId}
                  </Badge>
                </div>
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
                    label: "Location",
                    value: student.city,
                    color: "text-gray-600",
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
                      label: "Calling Name",
                      value: student.callingName || "Not Provided",
                      icon: User,
                    },
                    {
                      label: "Gender",
                      value: student.gender || "Not Provided",
                      icon: User,
                    },
                    {
                      label: "Date of Birth",
                      value: student.dob || "Not Provided",
                      icon: Calendar,
                    },
                    {
                      label: "ID Card / Passport",
                      value: student.idNumber || "Not Provided",
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
                      value: student.address || student.city,
                      icon: MapPin,
                    },
                    {
                      label: "Guardian Name",
                      value: student.guardianName || "Not Provided",
                      icon: Users,
                    },
                    {
                      label: "Relationship",
                      value: student.guardianRelation || "Not Provided",
                      icon: Users,
                    },
                    {
                      label: "Guardian Contact",
                      value: student.guardianPhone || "Not Provided",
                      icon: Phone,
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
                  className="w-full min-h-[150px] bg-gray-50 border-none rounded-2xl p-4 text-xs font-medium text-gray-600 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-gray-300 transition-all"
                ></textarea>
                <button className="w-full mt-4 py-4 rounded-2xl bg-gray-900 text-white font-black text-[10px] tracking-widest shadow-xl shadow-gray-200 hover:bg-indigo-600 transition-all active:scale-95 uppercase">
                  Save Remarks
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
                  {student.expand?.["enrollments(student)"]?.length ? (
                    student.expand["enrollments(student)"].map(
                      (enrollment, idx) => {
                        const course =
                          enrollment.expand?.course_intake_fee?.expand
                            ?.course_intake?.expand?.course;
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
                                  CODE: {course?.code || "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                  CERTIFICATE STATUS:
                                </span>
                                <CertificateStatusControl />
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
                  const doc = student.documents?.find(
                    (d) => d.category === docDef.id,
                  );
                  const status = doc ? doc.status : "not_uploaded";

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
                  }

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
                        MODIFIED:{" "}
                        {doc?.date
                          ? new Date(doc.date)
                              .toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                              .toUpperCase()
                          : "-"}
                      </p>

                      <UploadDocumentControl documentName={docDef.label} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* End of tab content */}
        </div>
      </main>

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
