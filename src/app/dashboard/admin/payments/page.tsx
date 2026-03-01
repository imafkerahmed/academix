"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pb, { isSuperuserOnlyError, logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  TrendingUp,
  Menu,
  Plus,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  Search,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Payment {
  id: string;
  reference_Id: string;
  date_paid: string;
  amount: number;
  payment_type: string;
  bank_name: string;
  verified: boolean;
  remarks?: string;
  expand?: {
    student?: any;
    enrollment?: any;
  };
}

interface Installment {
  id: string;
  installement_id: string;
  due_date: string;
  amount: number;
  status: string;
  expand?: {
    enrollment?: any;
  };
}

export default function PaymentManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const paymentsPromise = pb
        .collection("payments")
        .getFullList({
          expand: "student,intake,course",
          sort: "-payment_date",
        })
        .catch(() => []);

      const installmentsPromise = pb
        .collection("installments")
        .getFullList({
          expand: "student",
          sort: "due_date",
        })
        .catch(() => []);

      const [paymentsData, installmentsData] = await Promise.all([
        paymentsPromise,
        installmentsPromise,
      ]);

      setPayments((paymentsData as any) || []);
      setInstallments((installmentsData as any) || []);
      setLoading(false);
    } catch (error) {
      setPayments([]);
      setInstallments([]);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleVerifyPayment = async (id: string) => {
    try {
      await pb.collection("payments").update(id, { verified: true });
      setPayments(
        payments.map((p) => (p.id === id ? { ...p, verified: true } : p)),
      );
    } catch (error) {
      if (isSuperuserOnlyError(error)) {
        toast.error("You don't have permission to verify this payment.");
        return;
      }
      console.error("Error verifying payment:", error);
    }
  };

  const stats = {
    totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    verified: payments.filter((p) => p.verified).length,
    pending: payments.filter((p) => !p.verified).length,
    dueInstallments: installments.filter((i) => i.status === "pending").length,
  };

  const filteredPayments = payments.filter((payment) => {
    const studentName = (payment as any).expand?.student?.name || "";
    const courseName = (payment as any).expand?.course?.name || "";
    const matchesSearch =
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference_Id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "verified") return payment.verified;
    if (filter === "pending") return !payment.verified;
    if (filter === "registration")
      return payment.payment_type === "registration";
    if (filter === "installment") return payment.payment_type === "installment";
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black text-xs uppercase tracking-widest">
            Auditing Transactions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen lg:ml-64 font-sans">
      <main className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Page Header Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
              <ShieldCheck size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Finances <span className="text-indigo-600">& Audit</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <TrendingUp size={14} className="text-indigo-400" />
                Secure Transaction Lifecycle
              </p>
            </div>
          </div>
          <button className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 uppercase">
            <Plus size={18} />
            RECORD TRANSACTION
          </button>
        </div>

        {/* Stats Carousel */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <StatsCarousel
            stats={[
              {
                title: "Total Revenue",
                value: `₹${stats.totalRevenue.toLocaleString()}`,
                icon: CreditCard,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Verified",
                value: stats.verified,
                icon: CheckCircle,
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                title: "Pending Sync",
                value: stats.pending,
                icon: Clock,
                bgColor: "bg-orange-50",
                iconColor: "text-orange-600",
              },
              {
                title: "Due Invoices",
                value: stats.dueInstallments,
                icon: Layers,
                bgColor: "bg-red-50",
                iconColor: "text-red-600",
              },
            ]}
          />
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search Reference ID, student or course..."
            action={
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: "all", label: "ALL" },
                  { id: "pending", label: "PENDING" },
                  { id: "verified", label: "VERIFIED" },
                  { id: "registration", label: "REG FEE" },
                  { id: "installment", label: "INSTALLMENT" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilter(t.id)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${
                      filter === t.id
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            }
          />
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000 group">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Reference ID
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Contributor
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Financial Data
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Classification
                  </th>
                  <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Validation
                  </th>
                  <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Auditor Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="group/row hover:bg-indigo-50/30 transition-all duration-300"
                  >
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover/row:text-indigo-600 transition-colors">
                          {payment.reference_Id}
                        </span>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                          Transaction Ref
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px] shadow-sm group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all">
                          {payment.expand?.student?.name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 group-hover/row:text-indigo-600 transition-colors">
                            {payment.expand?.student?.name}
                          </span>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[150px]">
                            {payment.expand?.student?.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">
                          ₹{payment.amount?.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={10} className="text-indigo-400" />
                          {payment.date_paid
                            ? new Date(payment.date_paid).toLocaleDateString()
                            : "NO DATE"}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <Badge className="w-fit px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 border-none text-[8px] font-black uppercase tracking-widest shadow-sm group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all">
                          {payment.payment_type}
                        </Badge>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1 flex items-center gap-1">
                          <Building2 size={10} className="text-indigo-400" />
                          {payment.bank_name || "DIRECT PAY"}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      {payment.verified ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                            <Check size={16} strokeWidth={4} />
                          </div>
                          <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">
                            Verified
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm animate-pulse">
                            <Clock size={16} strokeWidth={3} />
                          </div>
                          <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">
                            Pending
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-40 group-hover/row:opacity-100 transition-opacity">
                        {!payment.verified && (
                          <button
                            onClick={() => handleVerifyPayment(payment.id)}
                            className="p-3 bg-white border border-gray-100 rounded-xl text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            title="Verify Transaction"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button className="p-3 bg-white border border-gray-100 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                          <Eye size={16} />
                        </button>
                        <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-900 hover:text-white transition-all shadow-sm">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-24 bg-gray-50/30">
              <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300 mx-auto mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                No transactions recorded
              </h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
                Adjust search or classification settings
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
