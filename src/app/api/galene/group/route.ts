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

    // Define the path to the Galene groups directory
    // Galene docker-compose mounts ./services/galene/groups to /var/lib/galene/groups
    const groupsDir = path.join(process.cwd(), "services", "galene", "groups");
    const filePath = path.join(groupsDir, `${classId}.json`);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(groupsDir)) {
      fs.mkdirSync(groupsDir, { recursive: true });
    }

    // Generate and write the config file
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
  } catch (error: any) {
    console.error("Failed to create Galene group:", error);
    return NextResponse.json(
      { error: "Failed to create Galene group", details: error.message },
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

    const groupsDir = path.join(process.cwd(), "services", "galene", "groups");
    const filePath = path.join(groupsDir, `${classId}.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({
      success: true,
      message: `Galene group ${classId} deleted successfully.`,
    });
  } catch (error: any) {
    console.error("Failed to delete Galene group:", error);
    return NextResponse.json(
      { error: "Failed to delete Galene group", details: error.message },
      { status: 500 },
    );
  }
}
