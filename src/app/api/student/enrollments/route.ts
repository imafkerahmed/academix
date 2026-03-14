import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Create a new PocketBase instance for this request
    const pb = new PocketBase(
      process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://localhost:8090",
    );

    // Decode token to get user ID (JWT format)
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 },
      );
    }

    const userId = decoded.id || decoded.sub;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 },
      );
    }

    // Properly authenticate the PocketBase instance
    // Create a minimal user model for auth store
    const userModel = {
      id: userId,
      verified: true,
      role: "student", // Assuming student role from token
    };

    pb.authStore.save(token, userModel as any);

    // Try to fetch enrollments - first without filter, fall back to with filter
    let enrollmentRecords: any[] = [];
    try {
      // Try fetching without filter first, with expand for course data
      enrollmentRecords = await pb.collection("enrollments").getFullList({
        expand: "course_intake.course",
      });
    } catch (filterError: any) {
      // If that fails due to rules, try with filter
      try {
        enrollmentRecords = await pb.collection("enrollments").getFullList({
          filter: `student = "${userId}"`,
          expand: "course_intake.course",
        });
      } catch (e: any) {
        console.error(`[API] Both approaches failed:`, e);
        // If both fail, return empty list (no data available)
        enrollmentRecords = [];
      }
    }

    // Filter client-side to respect permission boundaries
    const studentEnrollments = enrollmentRecords.filter(
      (e: any) => e.student === userId,
    );

    return NextResponse.json({ enrollments: studentEnrollments });
  } catch (error: any) {
    console.error("[API] Error fetching enrollments:", error);
    console.error("[API] Error status:", error?.status);
    console.error("[API] Error details:", error?.response?.data);

    // Return 403 with specific error message for debugging
    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch enrollments",
        details: error?.response?.data?.message || error?.response?.data,
      },
      { status: error?.status || 500 },
    );
  }
}
