import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, password, passwordConfirm } = body;

    // Validate required fields
    if (!studentId || !password || !passwordConfirm) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    // Get the pb_auth cookie
    const authCookie = req.cookies.get("pb_auth");
    if (!authCookie?.value) {
      console.error("No auth cookie found");
      return NextResponse.json(
        { error: "Unauthorized: No session." },
        { status: 401 },
      );
    }

    const pb = new PocketBase(
      process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090",
    );

    // Try to load and validate the user session
    let sessionLoaded = false;
    try {
      pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`);
      sessionLoaded = pb.authStore.isValid;
    } catch (e) {
      // If cookie loading fails, try URL decoding it
      try {
        const decodedValue = decodeURIComponent(authCookie.value);
        pb.authStore.loadFromCookie(`pb_auth=${decodedValue}`);
        sessionLoaded = pb.authStore.isValid;
      } catch (e2) {
        console.error("Failed to load auth cookie:", e, e2);
      }
    }

    // Verify the user is valid and has admin role
    if (!sessionLoaded) {
      console.error("Session not loaded or invalid");
      return NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 },
      );
    }

    const userRole = (pb.authStore.model as any)?.role;
    if (userRole !== "admin" && userRole !== "superuser") {
      console.error("User role is not admin or superuser:", userRole);
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 },
      );
    }

    // Authenticate as PocketBase super admin to bypass oldPassword requirement
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error(
        "Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD",
      );
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      );
    }

    // Clear the user session and authenticate as super admin
    const adminPb = new PocketBase(
      process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090",
    );

    try {
      await adminPb.admins.authWithPassword(adminEmail, adminPassword);
    } catch (adminAuthError: any) {
      console.error(
        "Admin auth failed:",
        adminAuthError?.message,
        adminAuthError?.response,
      );
      return NextResponse.json(
        {
          error:
            "Failed to authenticate as admin. Check PocketBase admin credentials.",
        },
        { status: 500 },
      );
    }

    // Update the password using super admin privileges
    const record = await adminPb.collection("users").update(studentId, {
      password,
      passwordConfirm,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("Password reset error:", error);
    let errorMessage = "Failed to reset password.";

    if (error?.data?.data) {
      // Extract validation error details from PocketBase
      const validationErrors = error.data.data;
      errorMessage =
        Object.entries(validationErrors)
          .map(([key, err]: [string, any]) => `${key}: ${err.message || err}`)
          .join("; ") || errorMessage;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    console.error("Returning error to client:", errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: error?.status || 400 },
    );
  }
}
