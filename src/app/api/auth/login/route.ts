import { NextRequest, NextResponse } from "next/server";
import pb from "@/lib/pocketbase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Authenticate user with PocketBase
    const authData = await pb
      .collection("users")
      .authWithPassword(email, password);

    return NextResponse.json({
      user: authData.record,
      token: authData.token,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 },
    );
  }
}
