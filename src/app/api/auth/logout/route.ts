import { NextResponse } from "next/server";
import pb from "@/lib/pocketbase";

export async function POST() {
  pb.authStore.clear();
  return NextResponse.json({ message: "Logged out successfully" });
}
