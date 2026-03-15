"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginIllustration from "@/components/LoginIllustration";
import { motion } from "framer-motion";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    interface AuthModel {
      role?: string;
    }
    const role = (pb.authStore.model as unknown as AuthModel)?.role;
    switch (role) {
      case "admin":
        router.replace("/dashboard/admin");
        break;
      case "student":
        router.replace("/dashboard/student");
        break;
      case "lecturer":
        router.replace("/dashboard/lecturer");
        break;
      default:
        router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      // Authenticate with PocketBase using userId

      const authData = await pb
        .collection("users")
        .authWithPassword(userId, password);

      // Check if account is disabled
      if (authData.record.accountStatus === "disabled") {
        pb.authStore.clear();
        setLoginError(
          "Your account has been disabled. Please contact the administrator.",
        );
        toast.error("Your account has been disabled.");
        return;
      }

      // Get user role
      const role = authData.record.role;

      toast.success("Login successful!");

      // Redirect based on role
      switch (role) {
        case "admin":
          router.push("/dashboard/admin");
          break;
        case "student":
          router.push("/dashboard/student");
          break;
        case "lecturer":
          router.push("/dashboard/lecturer");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (error: unknown) {
      // Generic but clear error for authentication failures
      const err = error as { status?: number; data?: { message?: string }; message?: string };
      const isAuthError = err?.status === 400 || err?.status === 404;
      const errorMsg = isAuthError 
        ? "Invalid User ID or password. Please check your credentials."
        : (err?.data?.message || err?.message || "An unexpected error occurred. Please try again.");
      
      setLoginError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="flex flex-col items-center gap-0 bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/60 max-w-4xl w-full overflow-hidden md:flex-row border border-gray-100">
        {/* Left: Illustration */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/2 bg-indigo-600 p-12 gap-6 min-h-[300px] md:min-h-[560px]">
          <div className="flex flex-col items-center gap-2 mb-2">
            <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-1.5">
              ACADE<span className="text-indigo-200">MIX</span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </h2>
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-8 bg-white/40 rounded-full" />
              <div className="h-0.5 w-2 bg-white/20 rounded-full" />
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-full flex justify-center"
          >
            <LoginIllustration />
          </motion.div>
          <p className="text-indigo-200 text-[11px] font-black uppercase tracking-widest text-center">
            Your Academic Management Platform
          </p>
        </div>

        {/* Right: Form */}
        <div className="flex flex-col w-full md:w-1/2 p-10 md:p-14 gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              Welcome <span className="text-indigo-600">Back</span>
            </h1>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                User ID
              </label>
              <input
                type="text"
                placeholder="Enter your User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 text-gray-900 text-sm font-medium focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-300"
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 text-gray-900 text-sm font-medium focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-300"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-indigo-100 hover:shadow-lg transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
            {loginError && (
              <p className="text-xs text-red-500 font-bold text-center mt-2">
                {loginError}
              </p>
            )}
          </form>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Contact your administrator if you&apos;re having trouble accessing
            your account.
          </p>
        </div>
      </main>
    </div>
  );
}
