import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const decoded = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
    const userRole = (decoded.role || "").toLowerCase();

    // Diagnostic logging for local dev
    if (process.env.NODE_ENV === "development") {
    }

    const isAuthorized =
      ["lecturer", "admin", "superuser", "host"].includes(userRole) ||
      decoded.type === "admin";

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { classId, username, demote } = await request.json();

    if (!classId || !username) {
      return NextResponse.json(
        { error: "Missing classId or username" },
        { status: 400 },
      );
    }

    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    // Auth as superuser to bypass rules
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || "afkerahmad@gmail.com",
      process.env.POCKETBASE_ADMIN_PASSWORD || "Afker1234",
    );

    const classRecord = await pb.collection("classes").getOne(classId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error promoting user:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to promote user" },
      { status: 500 },
    );
  }
}
