import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/pocketbaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lecturerId = searchParams.get("lecturerId");

    if (!lecturerId) {
      return NextResponse.json(
        { error: "Lecturer ID is required" },
        { status: 400 },
      );
    }

    const adminPb = await getAdminClient();
    console.log(`[Lecturer Subjects API] Fetching for lecturer: ${lecturerId}`);

    // Fetch all course_subjects assigned to this lecturer
    const records = await adminPb.collection("course_subjects").getFullList({
      filter: `lecturer = "${lecturerId}"`,
      expand: "subject,course_intake.course,course_intake.intake",
    });

    console.log(`[Lecturer Subjects API] Found ${records.length} records`);

    return NextResponse.json({ records });
  } catch (error: unknown) {
    console.error("Error fetching lecturer subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 },
    );
  }
}
