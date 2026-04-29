import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/pocketbaseAdmin";
import { calculateAssignmentStatus } from "@/lib/assignmentStatusCalculator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lecturerId = searchParams.get("lecturerId");
    const courseSubjectId = searchParams.get("courseSubjectId");
    const type = searchParams.get("type");

    // If courseSubjectId is provided, fetch assignments or materials for that subject
    if (courseSubjectId) {
      const adminPb = await getAdminClient();

      if (type === "materials") {
        // Fetch materials for this course_subject
        const materials = await adminPb
          .collection("study_materials")
          .getFullList({
            filter: `course_subject ~ "${courseSubjectId}"`,
            sort: "-created",
          });

        const materialsWithUrls = materials.map((material: any) => ({
          ...material,
          fileUrl: material.file
            ? adminPb.files.getURL(material, material.file)
            : null,
        }));

        return NextResponse.json({ materials: materialsWithUrls });
      } else {
        // Fetch assignments for this course_subject (default)
        const assignments = await adminPb
          .collection("assignments")
          .getFullList({
            filter: `course_subject = "${courseSubjectId}"`,
            expand: "marker",
            sort: "-created",
          });

        // Fetch submission counts for each assignment
        const assignmentsWithCounts = await Promise.all(
          assignments.map(async (a: any) => {
            const submissions = await adminPb
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

            return {
              ...a,
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

export async function POST(request: Request) {
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

export async function DELETE(request: Request) {
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
