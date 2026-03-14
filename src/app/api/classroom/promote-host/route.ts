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

    const { classId, username, demote } = await request.json();

    if (!classId || !username) {
      return NextResponse.json(
        { error: "Missing classId or username" },
        { status: 400 },
      );
    }

    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    // Auth as superuser to bypass rules
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || "afkerahmad@gmail.com",
      process.env.POCKETBASE_ADMIN_PASSWORD || "Afker1234",
    );

    const classRecord = await pb.collection("classes").getOne(classId);

    if (!classRecord.galene_group) {
      return NextResponse.json(
        { error: "No Galene group found for this class" },
        { status: 404 },
      );
    }

    const groupsDir = path.join(process.cwd(), "services", "galene", "groups");
    const filePath = path.join(groupsDir, `${classRecord.galene_group}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Galene configuration file not found" },
        { status: 404 },
      );
    }

    // Read and parse current configuration
    const config = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Extract wildcard password (which students use)
    const attendeePassword = config["wildcard-user"]?.password;

    if (!attendeePassword) {
      return NextResponse.json(
        { error: "Cannot determine attendee password" },
        { status: 500 },
      );
    }

    // Initialize users object if undefined
    if (!config.users) config.users = {};

    // Inject the specific username as an OP with the attendee password.
    if (demote) {
      if (config.users[username]) {
        delete config.users[username];
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
      }
    } else {
      config.users[username] = {
        password: attendeePassword,
        permissions: ["op", "present", "message", "record"],
      };
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error promoting user:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to promote user" },
      { status: 500 },
    );
  }
}
