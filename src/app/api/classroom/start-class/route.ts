import { NextResponse } from "next/server";
import PocketBase from "pocketbase";
import fs from "fs";
import path from "path";

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

    if (userRole !== "lecturer" && userRole !== "admin") {
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

    // Update the status to in_progress
    if (classRecord.status !== "in_progress") {
      await pb.collection("classes").update(classId, {
        status: "in_progress",
      });
    }

    // Backward compatibility: ensure admin user exists in Galene config for older classes
    if (classRecord.galene_group) {
      const groupsDir = path.join(
        process.cwd(),
        "services",
        "galene",
        "groups",
      );
      const filePath = path.join(groupsDir, `${classRecord.galene_group}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const config = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (config.users?.lecturer && !config.users?.admin) {
            config.users.admin = { ...config.users.lecturer };
            fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
            console.log(
              `[Classroom] Patched admin user into ${classRecord.galene_group}`,
            );
          }
        } catch (e) {
          console.error("Failed to patch galene group config:", e);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error starting class:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to start class" },
      { status: 500 },
    );
  }
}
