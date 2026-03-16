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
    console.log(`[Lecturer API] Fetching course_subjects for lecturer: ${lecturerId}`);

    // Fetch all course_subjects for this lecturer with full expanded info
    const csRecords = await adminPb.collection("course_subjects").getFullList({
      filter: `lecturer = "${lecturerId}"`,
      expand: "subject,course_intake.course,course_intake.intake",
    });

    console.log(`[Lecturer API] Found ${csRecords.length} course_subjects`);

    // Structure the data for IntakesTree
    const intakesMap = new Map();

    for (const cs of csRecords) {
      const ci = cs.expand?.course_intake;
      if (!ci) {
        console.warn(`[Lecturer API] Missing expansion for course_intake on course_subject ${cs.id}`);
        continue;
      }
      
      const intake = ci.expand?.intake;
      const course = ci.expand?.course;
      const subjects = cs.expand?.subject;

      if (!intake || !course || !subjects) {
        console.warn(`[Lecturer API] Missing expansion on course_intake ${ci.id}: intake=${!!intake}, course=${!!course}, subjects=${!!subjects}`);
        continue;
      }

      if (!intakesMap.has(intake.id)) {
        intakesMap.set(intake.id, {
          id: intake.id,
          code: intake.code,
          name: intake.name || intake.code,
          startDate: intake.start_date,
          endDate: intake.end_date,
          courses: new Map(),
        });
      }

      const intakeData = intakesMap.get(intake.id);
      if (!intakeData.courses.has(course.id)) {
        intakeData.courses.set(course.id, {
          id: course.id,
          name: course.name,
          code: course.code,
          subjects: [],
        });
      }

      const courseData = intakeData.courses.get(course.id);
      
      // subjects can be an array or a single object in PocketBase expand if specified
      const subjectArray = Array.isArray(subjects) ? subjects : [subjects];
      
      for (const s of subjectArray) {
        // Avoid duplicate subjects in same course/intake view
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!courseData.subjects.find((item: any) => item.id === s.id)) {
          courseData.subjects.push({
            id: s.id,
            name: s.name,
            code: s.code,
            assigned: true,
          });
        }
      }
    }

    // Convert Maps to Arrays
    const result = Array.from(intakesMap.values()).map(intake => ({
      ...intake,
      courses: Array.from(intake.courses.values()),
    }));

    return NextResponse.json({ records: result });
  } catch (error: unknown) {
    console.error("Error fetching lecturer intakes:", error);
    return NextResponse.json(
      { error: "Failed to fetch intakes" },
      { status: 500 },
    );
  }
}
