"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.replace("/login");
      return;
    }

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
        // If logged in but role is unknown, maybe go back to login or an error page
        router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
