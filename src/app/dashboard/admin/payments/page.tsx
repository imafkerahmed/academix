"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pb, { logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";
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
} from "lucide-react";

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

  useEffect(() => {
    // Authentication disabled for UI development
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
      console.error("Error verifying payment:", error);
      alert("Failed to verify payment");
    }
  };

  const getPaymentStats = () => {
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const verifiedPayments = payments.filter((p) => p.verified).length;
    const pendingPayments = payments.filter((p) => !p.verified).length;
    const pendingInstallments = installments.filter(
      (i) => i.status === "pending",
    ).length;

    return {
      totalRevenue,
      verifiedPayments,
      pendingPayments,
      pendingInstallments,
    };
  };

  const stats = getPaymentStats();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = payments.filter((payment) => {
    const studentName = (payment as any).expand?.student?.name || "";
    const courseName = (payment as any).expand?.course?.name || "";
    const matchesSearch =
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courseName.toLowerCase().includes(searchQuery.toLowerCase());

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminSidebar
        activeTab="payments"
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="bg-gray-50 min-h-screen lg:ml-64">
        <main className="p-4 md:p-6 lg:p-8">
          {/* Mobile header with hamburger */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide text-center flex-1">
                ACADEMIX
              </h1>
              <div className="w-10" aria-hidden="true" />
            </div>
          </div>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Payment Management
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor and verify all payment transactions
            </p>
          </div>

          {/* Stats Cards */}
          {/* Stats Carousel */}
          <StatsCarousel
            stats={[
              {
                title: "Total Revenue",
                value: `₹${stats.totalRevenue.toLocaleString()}`,
                icon: TrendingUp,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Verified Payments",
                value: stats.verifiedPayments,
                icon: CheckCircle,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Pending Verification",
                value: stats.pendingPayments,
                icon: Clock,
                bgColor: "bg-orange-50",
                iconColor: "text-orange-600",
              },
              {
                title: "Pending Installments",
                value: stats.pendingInstallments,
                icon: DollarSign,
                bgColor: "bg-red-50",
                iconColor: "text-red-600",
              },
            ]}
          />

          {/* Filter Tabs */}
          {/* Actions Bar */}
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search payments..."
            action={
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Plus size={20} />
                Record New Payment
              </button>
            }
          >
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({payments.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "pending"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending ({stats.pendingPayments})
            </button>
            <button
              onClick={() => setFilter("verified")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "verified"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Verified ({stats.verifiedPayments})
            </button>
            <button
              onClick={() => setFilter("registration")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "registration"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Registration
            </button>
            <button
              onClick={() => setFilter("installment")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "installment"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Installments
            </button>
          </AdminActionBar>

          {/* Payments Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.reference_Id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-medium">
                                {payment.expand?.student?.name
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.expand?.student?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{payment.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {payment.payment_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.bank_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.date_paid
                          ? new Date(payment.date_paid).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.verified ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle size={14} className="mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            <Clock size={14} className="mr-1" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye size={18} />
                          </button>
                          {!payment.verified && (
                            <button
                              onClick={() => handleVerifyPayment(payment.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button className="text-purple-600 hover:text-purple-900">
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No payments found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
