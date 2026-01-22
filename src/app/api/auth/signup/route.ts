import { NextRequest, NextResponse } from "next/server";
import pb from "@/lib/pocketbase";

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role } = await request.json();

    // Create user
    const user = await pb.collection("users").create({
      email,
      password,
      passwordConfirm: password,
      full_name,
      role: role || "attendee",
      username: email.split("@")[0], // Use email prefix as username
    });

    // Send verification email (optional)
    await pb.collection("users").requestVerification(email);

    // Auto-login after signup
    const authData = await pb
      .collection("users")
      .authWithPassword(email, password);

    return NextResponse.json({
      user: authData.record,
      token: authData.token,
      message: "Signup successful!  Please check your email for verification.",
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Signup failed" },
      { status: 400 },
    );
  }
}
