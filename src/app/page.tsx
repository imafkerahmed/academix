"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to login if no valid session
    if (!pb.authStore.isValid) {
      router.push("/login");
    } else {
      // If user is logged in, redirect to their dashboard based on role
      interface AuthModel {
        role?: string;
      }
      const role = (pb.authStore.model as unknown as AuthModel)?.role;
      if (role === "admin") {
        router.push("/dashboard/admin");
      } else if (role === "lecturer") {
        router.push("/dashboard/lecturer");
      } else if (role === "student") {
        router.push("/dashboard/student");
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  return null;
}
