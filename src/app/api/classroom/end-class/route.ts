import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function POST(request: Request) {
  try {
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
