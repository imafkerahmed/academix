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
    const userRole = decoded.role;

    if (userRole !== "lecturer" && userRole !== "admin" && userRole !== "superuser") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: "Missing classId" }, { status: 400 });
    }

    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    // Auth as superuser to bypass rules for updating status
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || "afkerahmad@gmail.com",
      process.env.POCKETBASE_ADMIN_PASSWORD || "Afker1234",
    );

    // Get the class to ensure it exists
    const classRecord = await pb.collection("classes").getOne(classId);

    // Update the status to completed
    if (classRecord.status !== "completed") {
      await pb.collection("classes").update(classId, {
        status: "completed",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error ending class:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to end class" },
      { status: 500 },
    );
  }
}
