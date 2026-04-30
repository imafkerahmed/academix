import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { getAdminClient } from "@/lib/pocketbaseAdmin";
import { calculateAssignmentStatus } from "@/lib/assignmentStatusCalculator";

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

function toPlainRecord<T>(record: T): T {
  return JSON.parse(JSON.stringify(record));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lecturerId = searchParams.get("lecturerId");
    const courseSubjectId = searchParams.get("courseSubjectId");
    const type = searchParams.get("type");
    const requestClient = createRequestClient(request);

    // If courseSubjectId is provided, fetch assignments or materials for that subject
    if (courseSubjectId) {
      const fetchClient = async () => {
        try {
          return requestClient;
        } catch {
          return await getAdminClient();
        }
      };

      const client = await fetchClient();

      if (type === "materials") {
        // Fetch materials for this course_subject
        const materials = await client
          .collection("study_materials")
          .getFullList({
            filter: `course_subject ~ "${courseSubjectId}"`,
            sort: "-created",
          });

        const materialsWithUrls = materials.map((material: any) => {
          const plainMaterial = toPlainRecord(material);

          return {
            ...plainMaterial,
            fileUrl: plainMaterial.file
              ? client.files.getURL(plainMaterial, plainMaterial.file)
              : null,
          };
        });

        return NextResponse.json({ materials: materialsWithUrls });
      } else {
        // Fetch assignments for this course_subject (default)
        const assignments = await client.collection("assignments").getFullList({
          filter: `course_subject = "${courseSubjectId}"`,
          expand: "marker",
          sort: "-created",
        });

        // Fetch submission counts for each assignment
        const assignmentsWithCounts = await Promise.all(
          assignments.map(async (a: any) => {
            const submissions = await client
              .collection("assignment_submissions")
              .getFullList({
                filter: `assignment = "${a.id}"`,
              });

            const pendingCount = submissions.filter(
              (s: any) => s.evaluation_status === "pending",
            ).length;
            const markedCount = submissions.filter(
              (s: any) => s.evaluation_status === "completed",
            ).length;

            // Calculate assignment status based on due date
            const statusInfo = calculateAssignmentStatus(a.due_date);

            const plainAssignment = toPlainRecord(a);

            return {
              ...plainAssignment,
              pendingSubmissions: pendingCount,
              markedSubmissions: markedCount,
              status: statusInfo.status,
              daysRemaining: statusInfo.daysRemaining,
              daysOverdue: statusInfo.daysOverdue,
            };
          }),
        );

        return NextResponse.json({ assignments: assignmentsWithCounts });
      }
    }

    // Original logic: fetch all subjects for a lecturer
    if (!lecturerId) {
      return NextResponse.json(
        { error: "Lecturer ID is required" },
        { status: 400 },
      );
    }

    let client = requestClient;

    // Fetch all course_subjects assigned to this lecturer
    let records;
    try {
      records = await client.collection("course_subjects").getFullList({
        filter: `lecturer = "${lecturerId}"`,
        expand: "subject,course_intake.course,course_intake.intake",
      });
    } catch (requestError) {
      console.error(
        "[Lecturer Subjects API] Session-based fetch failed:",
        requestError,
      );
      client = await getAdminClient();
      records = await client.collection("course_subjects").getFullList({
        filter: `lecturer = "${lecturerId}"`,
        expand: "subject,course_intake.course,course_intake.intake",
      });
    }

    const plainRecords = toPlainRecord(records);

    return NextResponse.json({ records: plainRecords });
  } catch (error: unknown) {
    console.error("Error fetching lecturer subjects:", error);
    const err = error as { message?: string; status?: number };
    return NextResponse.json(
      { error: err?.message || "Failed to fetch subjects" },
      { status: err?.status || 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminPb = await getAdminClient();
    const formData = await request.formData();

    const courseSubject = formData.get("course_subject")?.toString();
    const title = formData.get("title")?.toString();
    const description = formData.get("description")?.toString() || "";
    const type = formData.get("type")?.toString();
    const videoUrl = formData.get("video_url")?.toString() || "";
    const canDownload = formData.get("can_download")?.toString() === "true";
    const visible = formData.get("visible")?.toString() !== "false";
    const file = formData.get("file");

    if (!courseSubject || !title || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const payload = new FormData();
    payload.append("course_subject", courseSubject);
    payload.append("title", title);
    payload.append("description", description);
    payload.append("type", type);
    payload.append("can_download", String(canDownload));
    payload.append("visible", String(visible));

    if (videoUrl) {
      payload.append("video_url", videoUrl);
    }

    if (file instanceof File) {
      payload.append("file", file);
    }

    const record = await adminPb.collection("study_materials").create(payload);

    return NextResponse.json({ material: record }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating lecturer material:", error);
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId");

    if (!materialId) {
      return NextResponse.json(
        { error: "Material ID is required" },
        { status: 400 },
      );
    }

    const adminPb = await getAdminClient();
    await adminPb.collection("study_materials").delete(materialId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting lecturer material:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 },
    );
  }
}
