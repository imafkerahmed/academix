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
    }

    // Clean up uploaded chat documents
    let chatFilesDeleted = 0;
    const chatUploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "chat",
    );

    if (fs.existsSync(chatUploadsDir)) {
      const chatFiles = fs.readdirSync(chatUploadsDir);
      for (const file of chatFiles) {
        const filePath = path.join(chatUploadsDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          chatFilesDeleted++;
          console.log(`[Cron] Cleaned up chat upload: ${file}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Nightly cleanup finished. Deleted ${deletedCount} Galene groups and ${chatFilesDeleted} chat uploads.`,
    });
  } catch (error: any) {
    console.error("Cron Cleanup Error:", error);
    return NextResponse.json(
      { error: "Failed to run scheduled cleanup", details: error.message },
      { status: 500 },
    );
  }
}
