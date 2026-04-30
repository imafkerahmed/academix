import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { getAdminClient } from "@/lib/pocketbaseAdmin";

function createRequestClient(request: NextRequest) {
  const client = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090",
  );

  client.autoCancellation(false);

  const authCookie = request.cookies.get("pb_auth")?.value;
  if (authCookie) {
    try {
      client.authStore.loadFromCookie(`pb_auth=${authCookie}`);
    } catch {
      try {
        client.authStore.loadFromCookie(
          `pb_auth=${decodeURIComponent(authCookie)}`,
        );
      } catch {
        // Ignore invalid cookies and fall back to unauthenticated access.
      }
    }
  }

  return client;
}

async function fetchLecturerIntakes(client: PocketBase, lecturerId: string) {
  const csRecords = await client.collection("course_subjects").getFullList({
    filter: `lecturer = "${lecturerId}"`,
    expand: "subject,course_intake.course,course_intake.intake",
  });

  const intakesMap = new Map<string, any>();

  for (const cs of csRecords) {
    const ci = cs.expand?.course_intake;
    if (!ci) {
      continue;
    }

    const intake = ci.expand?.intake;
    const course = ci.expand?.course;
    const subjects = cs.expand?.subject;

    if (!intake || !course || !subjects) {
      continue;
    }

    if (!intakesMap.has(intake.id)) {
      intakesMap.set(intake.id, {
        id: intake.id,
        code: intake.code,
        name: intake.name || intake.code,
        startDate: intake.start_date,
        endDate: intake.end_date,
        courses: new Map<string, any>(),
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
    const subjectArray = Array.isArray(subjects) ? subjects : [subjects];

    for (const subject of subjectArray) {
      if (!courseData.subjects.find((item: any) => item.id === subject.id)) {
        courseData.subjects.push({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          assigned: true,
          courseSubjectId: cs.id,
        });
      }
    }
  }

  return Array.from(intakesMap.values()).map((intake) => ({
    ...intake,
    courses: Array.from(intake.courses.values()),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lecturerId = searchParams.get("lecturerId");

    if (!lecturerId) {
      return NextResponse.json(
        { error: "Lecturer ID is required" },
        { status: 400 },
      );
    }

    const requestClient = createRequestClient(request);

    let result: Array<{
      id: string;
      code: string;
      name: string;
      startDate: string;
      endDate: string;
      courses: Array<{
        id: string;
        name: string;
        code: string;
        subjects: Array<{
          id: string;
          name: string;
          code: string;
          assigned: boolean;
          courseSubjectId: string;
        }>;
      }>;
    }>;

    try {
      result = await fetchLecturerIntakes(requestClient, lecturerId);
    } catch (requestError) {
      console.error("[Lecturer API] Session-based fetch failed:", requestError);
      const adminPb = await getAdminClient();
      result = await fetchLecturerIntakes(adminPb, lecturerId);
    }

    return NextResponse.json({ records: result });
  } catch (error: unknown) {
    console.error("Error fetching lecturer intakes:", error);
    const err = error as { message?: string; status?: number };
    return NextResponse.json(
      {
        error: err?.message || "Failed to fetch intakes",
      },
      { status: err?.status || 500 },
    );
  }
}
