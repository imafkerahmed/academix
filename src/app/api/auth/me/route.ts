import { NextResponse } from "next/server";
import pb from "@/lib/pocketbase";

export async function GET() {
  try {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Refresh the user data
    const user = await pb.collection("users").getOne(pb.authStore.model.id);

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
