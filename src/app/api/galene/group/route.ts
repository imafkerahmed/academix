import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Function to generate the Galene JSON configuration
const generateGroupConfig = (
  passwordHost: string,
  passwordAttendee: string,
  durationMin: number,
) => {
  return {
    users: {
      lecturer: {
        password: passwordHost,
        permissions: ["op", "present", "message", "record"],
      },
      admin: {
        password: passwordHost,
        permissions: ["op", "present", "message", "record"],
      },
    },
    "wildcard-user": {
      password: passwordAttendee,
      permissions: ["present", "message"],
    },
    autolock: false,
    "max-history-age": durationMin * 60 + 3600, // Duration plus 1 hour buffer
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classId, passwordHost, passwordAttendee, duration } = body;

    if (!classId || !passwordHost || !passwordAttendee || !duration) {
      return NextResponse.json(
        {
          error:
            "classId, passwordHost, passwordAttendee, and duration are required",
        },
        { status: 400 },
      );
    }

    const remoteUrl = process.env.GALENE_REMOTE_MANAGEMENT_URL;
    const internalSecret = process.env.INTERNAL_SECRET;

    // --- Local -> Production Bridge ---
    if (remoteUrl) {
      console.log(`[Galene API] Forwarding POST request to ${remoteUrl}`);
      const response = await fetch(remoteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": internalSecret || "",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // --- Production Security Check ---
    const incomingSecret = request.headers.get("x-internal-secret");
    if (internalSecret && incomingSecret !== internalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Production -> File System ---
    const groupsDir =
      process.env.GALENE_GROUPS_PATH ||
      path.join(process.cwd(), "services", "galene", "groups");
    const filePath = path.join(groupsDir, `${classId}.json`);

    if (!fs.existsSync(groupsDir)) {
      fs.mkdirSync(groupsDir, { recursive: true });
    }

    const config = generateGroupConfig(
      passwordHost,
      passwordAttendee,
      duration,
    );
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: `Galene group ${classId} created successfully.`,
      path: filePath,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Failed to create Galene group:", err);
    return NextResponse.json(
      { error: "Failed to create Galene group", details: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "classId is required" },
        { status: 400 },
      );
    }

    const remoteUrl = process.env.GALENE_REMOTE_MANAGEMENT_URL;
    const internalSecret = process.env.INTERNAL_SECRET;

    // --- Local -> Production Bridge ---
    if (remoteUrl) {
      console.log(`[Galene API] Forwarding DELETE request to ${remoteUrl}`);
      const response = await fetch(`${remoteUrl}?classId=${classId}`, {
        method: "DELETE",
        headers: {
          "x-internal-secret": internalSecret || "",
        },
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // --- Production Security Check ---
    const incomingSecret = request.headers.get("x-internal-secret");
    if (internalSecret && incomingSecret !== internalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Production -> File System ---
    const groupsDir =
      process.env.GALENE_GROUPS_PATH ||
      path.join(process.cwd(), "services", "galene", "groups");
    const filePath = path.join(groupsDir, `${classId}.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({
      success: true,
      message: `Galene group ${classId} deleted successfully.`,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Failed to delete Galene group:", err);
    return NextResponse.json(
      { error: "Failed to delete Galene group", details: err.message },
      { status: 500 },
    );
  }
}
