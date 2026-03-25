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
    // Log the payload to debug roles during local development
    console.log("[Classroom] Token Payload:", decoded);

    const userRole = (decoded.role || "").toLowerCase();
    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: "Missing classId" }, { status: 400 });
    }

    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    // Auth as superuser to bypass rules for fetching and updating
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || "afkerahmad@gmail.com",
      process.env.POCKETBASE_ADMIN_PASSWORD || "Afker1234",
    );

    // Get the class to ensure it exists and to check ownership
    const classRecord = await pb.collection("classes").getOne(classId);

    // Check authorization: Admin/Superuser OR the assigned Lecturer for this class
    const isAdminAccount = 
      ["admin", "superuser"].includes(userRole) || 
      decoded.type === "admin";
    
    const isAssignedLecturer = classRecord.lecturer === decoded.id;

    if (!isAdminAccount && !isAssignedLecturer) {
      console.warn(`[Classroom] Unauthorized start attempt for class ${classId}`, { 
        userId: decoded.id,
        userRole: userRole,
        assignedLecturer: classRecord.lecturer
      });
      return NextResponse.json({ error: "Forbidden: You are not authorized to start this class" }, { status: 403 });
    }

    // Update the status to in_progress
    if (classRecord.status !== "in_progress") {
      await pb.collection("classes").update(classId, {
        status: "in_progress",
      });
    }

    // Ensure Galene group configuration exists
    if (classRecord.galene_group) {
      const hostPassword = process.env.NEXT_PUBLIC_GALENE_HOST_PASSWORD || "lecturer123";
      const studentPassword = process.env.NEXT_PUBLIC_GALENE_STUDENT_PASSWORD || "student123";
      const duration = classRecord.duration || 60;

      // Call our internal Galene management API
      // This automatically handles local-to-production bridging and correct filesystem paths
      const internalUrl = `${new URL(request.url).origin}/api/galene/group`;
      
      console.log(`[Classroom] Ensuring Galene group via bridge: ${internalUrl}`, {
        classId: classRecord.galene_group,
        remoteUrl: process.env.GALENE_REMOTE_MANAGEMENT_URL
      });
      
      try {
        const galeneRes = await fetch(internalUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_SECRET || "",
          },
          body: JSON.stringify({
            classId: classRecord.galene_group,
            passwordHost: hostPassword,
            passwordAttendee: studentPassword,
            duration: duration,
          }),
        });

        if (!galeneRes.ok) {
          const errorData = await galeneRes.json();
          console.error("[Classroom] Failed to ensure Galene group via bridge:", errorData);
        } else {
          console.log(`[Classroom] Galene group ${classRecord.galene_group} checked/created via bridge.`);
        }
      } catch (err) {
        console.error("[Classroom] Network error calling Galene bridge:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error starting class:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to start class" },
      { status: 500 },
    );
  }
}
