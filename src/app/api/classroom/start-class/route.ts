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

    // Ensure Galene group configuration exists
    if (classRecord.galene_group) {
      const groupsDir = path.join(
        process.cwd(),
        "services",
        "galene",
        "groups",
      );
      const filePath = path.join(groupsDir, `${classRecord.galene_group}.json`);

      interface GaleneConfig {
        users: {
          [key: string]: {
            password: string;
            permissions: string[];
          };
        };
        "wildcard-user"?: {
          password: string;
          permissions: string[];
        };
        autolock: boolean;
        "max-history-age": number;
      }

      // If configuration missing or needs patching
      let shouldCreate = !fs.existsSync(filePath);
      let config: GaleneConfig | null = null;

      if (!shouldCreate) {
        try {
          config = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (config && config.users?.lecturer && !config.users?.admin) {
            config.users.admin = { ...config.users.lecturer };
            shouldCreate = true; // Trigger write for patch
          }
        } catch (err) {
          console.error("Failed to read galene group config:", err);
          shouldCreate = true;
        }
      } else {
        // Create new config
        config = {
          users: {
            lecturer: {
              password:
                process.env.NEXT_PUBLIC_GALENE_HOST_PASSWORD || "lecturer123",
              permissions: ["op", "present", "message", "record"],
            },
            admin: {
              password:
                process.env.NEXT_PUBLIC_GALENE_HOST_PASSWORD || "lecturer123",
              permissions: ["op", "present", "message", "record"],
            },
          },
          "wildcard-user": {
            password:
              process.env.NEXT_PUBLIC_GALENE_STUDENT_PASSWORD || "student123",
            permissions: ["present", "message"],
          },
          autolock: false,
          "max-history-age": (classRecord.duration || 60) * 60 + 3600,
        };
      }

      if (shouldCreate && config) {
        try {
          if (!fs.existsSync(groupsDir)) {
            fs.mkdirSync(groupsDir, { recursive: true });
          }
          fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
          console.log(
            `[Classroom] Created/Patched Galene group config for ${classRecord.galene_group}`,
          );
        } catch (err) {
          console.error("Failed to write galene group config:", err);
        }
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
