import { NextResponse } from "next/server";
import PocketBase from "pocketbase";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    // Basic security: optional Cron secret check
    // e.g. /api/cron/cleanup-galene?secret=YOUR_CRON_SECRET
    // You can enforce this by comparing against process.env.CRON_SECRET if desired

    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || "afkerahmad@gmail.com",
      process.env.POCKETBASE_ADMIN_PASSWORD || "Afker1234",
    );

    // Fetch all completed classes
    const records = await pb.collection("classes").getFullList({
      filter: `status = "completed"`,
    });

    let deletedCount = 0;
    const groupsDir = path.join(process.cwd(), "services", "galene", "groups");

    for (const record of records) {
      if (record.galene_group) {
        const filePath = path.join(groupsDir, `${record.galene_group}.json`);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`[Cron] Cleaned up Galene group: ${record.galene_group}`);
        }
      }

      // We keep the class as "completed" in the DB.
      // If the user wants to truly archive them so they don't get processed again, we could
      // set a flag like is_archived: true, but Pocketbase has a daily record limit so we'll just check if the file exists.
    }

    return NextResponse.json({
      success: true,
      message: `Nightly cleanup finished. Deleted ${deletedCount} Galene groups from server.`,
    });
  } catch (error: any) {
    console.error("Cron Cleanup Error:", error);
    return NextResponse.json(
      { error: "Failed to run scheduled cleanup", details: error.message },
      { status: 500 },
    );
  }
}
