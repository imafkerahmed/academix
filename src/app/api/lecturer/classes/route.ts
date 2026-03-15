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

    // Fetch classes specifically for this lecturer with fully expanded relationships
    const records = await adminPb.collection("classes").getFullList({
      filter: `lecturer = "${lecturerId}" && status != "cancelled"`,
      expand:
        "course_subject.subject,course_subject.course_intake.course,course_subject.course_intake.intake,lecturer",
      sort: "start_time",
    });

    return NextResponse.json({ records });
  } catch (error: unknown) {
    console.error("Error fetching lecturer classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 },
    );
  }
}
