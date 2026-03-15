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

    let decoded: { id?: string; sub?: string };
    try {
      decoded = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
    } catch {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pb.authStore.save(token, userModel as any);

    // Try to fetch enrollments - first without filter, fall back to with filter
    let enrollmentRecords: Record<string, unknown>[] = [];
    try {
      // Try fetching without filter first, with expand for course data
      enrollmentRecords = await pb.collection("enrollments").getFullList({
        expand: "course_intake.course",
      });
    } catch {
      // If that fails due to rules, try with filter
      try {
        enrollmentRecords = await pb.collection("enrollments").getFullList({
          filter: `student = "${userId}"`,
          expand: "course_intake.course",
        });
      } catch (err: unknown) {
        console.error(`[API] Both approaches failed:`, err);
        // If both fail, return empty list (no data available)
        enrollmentRecords = [];
      }
    }

    // Filter client-side to respect permission boundaries
    const studentEnrollments = enrollmentRecords.filter(
      (e) => (e as { student: string }).student === userId,
    );

    return NextResponse.json({ enrollments: studentEnrollments });
  } catch (error: unknown) {
    const err = error as {
      status?: number;
      message?: string;
      response?: { data?: { message?: string } | string };
    };
    console.error("[API] Error fetching enrollments:", err);
    console.error("[API] Error status:", err?.status);
    console.error("[API] Error details:", err?.response?.data);

    // Return 403 with specific error message for debugging
    const errorData = err?.response?.data;
    const details =
      typeof errorData === "string"
        ? errorData
        : (errorData as { message?: string })?.message || JSON.stringify(errorData);

    return NextResponse.json(
      {
        error: err?.message || "Failed to fetch enrollments",
        details: details,
      },
      { status: err?.status || 500 },
    );
  }
}
