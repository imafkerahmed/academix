"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Signup removed — redirect to home
    router.replace("/");
  }, [router]);

  return null;
}
