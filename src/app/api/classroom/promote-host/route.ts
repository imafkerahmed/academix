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
    const userRole = (decoded.role || "").toLowerCase();
    
    // Diagnostic logging for local dev
    if (process.env.NODE_ENV === "development") {
    }

    const isAuthorized = 
      ["lecturer", "admin", "superuser", "host"].includes(userRole) || 
      decoded.type === "admin";

    if (!isAuthorized) {
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

    // Call our internal Galene management API
    // This automatically handles local-to-production bridging
    const internalUrl = `${new URL(request.url).origin}/api/galene/group`;
    
    console.log(`[Classroom] Updating user status via bridge: ${internalUrl}`, {
      classId: classRecord.galene_group,
      username,
      demote: !!demote
    });

    try {
      const bridgeRes = await fetch(internalUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_SECRET || "",
        },
        body: JSON.stringify({
          classId: classRecord.galene_group,
          username,
          demote: !!demote,
        }),
      });

      if (!bridgeRes.ok) {
        const errorData = await bridgeRes.json().catch(() => ({ error: bridgeRes.statusText }));
        console.error("[Classroom] Failed to update user status via bridge:", errorData);
        return NextResponse.json(
          { error: errorData.error || "Failed to update Galene group" },
          { status: bridgeRes.status }
        );
      }

      console.log(`[Classroom] User ${username} ${demote ? 'demoted' : 'promoted'} via bridge.`);
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[Classroom] Network error calling Galene bridge:", err);
      return NextResponse.json(
        { error: "Bridge connection failed" },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error promoting user:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to promote user" },
      { status: 500 },
    );
  }
}
