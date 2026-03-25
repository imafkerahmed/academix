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

    if (remoteUrl) {
      try {
        const response = await fetch(remoteUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": internalSecret || "",
          },
          body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({ 
          error: "Invalid JSON response from remote bridge",
          statusText: response.statusText 
        }));
        
        return NextResponse.json(data, { status: response.status });
      } catch (err: unknown) {
        console.error("[Galene API] Forwarding failed with network error:", err);
        return NextResponse.json(
          { error: "Failed to forward bridge request to production", details: (err as Error).message },
          { status: 502 }
        );
      }
    }

    const incomingSecret = request.headers.get("x-internal-secret");
    if (internalSecret && incomingSecret !== internalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { classId, username, demote } = body;

    if (!classId || !username) {
      return NextResponse.json(
        { error: "classId and username are required" },
        { status: 400 },
      );
    }

    const remoteUrl = process.env.GALENE_REMOTE_MANAGEMENT_URL;
    const internalSecret = process.env.INTERNAL_SECRET;

    if (remoteUrl) {
      try {
        const response = await fetch(remoteUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": internalSecret || "",
          },
          body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({ 
          error: "Invalid JSON response from remote bridge",
          statusText: response.statusText 
        }));
        
        return NextResponse.json(data, { status: response.status });
      } catch (err: unknown) {
        return NextResponse.json(
          { error: "Failed to forward bridge request", details: (err as Error).message },
          { status: 502 }
        );
      }
    }

    const incomingSecret = request.headers.get("x-internal-secret");
    if (internalSecret && incomingSecret !== internalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groupsDir =
      process.env.GALENE_GROUPS_PATH ||
      path.join(process.cwd(), "services", "galene", "groups");
    const filePath = path.join(groupsDir, `${classId}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Group config not found" }, { status: 404 });
    }

    const config = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const attendeePassword = config["wildcard-user"]?.password;

    if (!attendeePassword) {
      return NextResponse.json({ error: "Cannot determine attendee password" }, { status: 500 });
    }

    if (!config.users) config.users = {};

    if (demote) {
      if (config.users[username]) {
        delete config.users[username];
      }
    } else {
      config.users[username] = {
        password: attendeePassword,
        permissions: ["op", "present", "message", "record"],
      };
    }

    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    return NextResponse.json({ success: true, message: `User ${username} ${demote ? 'demoted' : 'promoted'}` });

  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: "Failed to update Galene group", details: err.message },
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

    if (remoteUrl) {
      try {
        const response = await fetch(`${remoteUrl}?classId=${classId}`, {
          method: "DELETE",
          headers: {
            "x-internal-secret": internalSecret || "",
          },
        });

        const data = await response.json().catch(() => ({ 
          error: "Invalid JSON response from remote bridge",
          statusText: response.statusText 
        }));
        
        return NextResponse.json(data, { status: response.status });
      } catch (err: unknown) {
        return NextResponse.json(
          { error: "Failed to forward bridge request", details: (err as Error).message },
          { status: 502 }
        );
      }
    }

    const incomingSecret = request.headers.get("x-internal-secret");
    if (internalSecret && incomingSecret !== internalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
