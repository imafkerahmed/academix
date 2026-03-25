import { NextResponse } from "next/server";
import PocketBase from "pocketbase";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid secret" },
        { status: 401 },
      );
    }

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
    const internalUrl = `${new URL(request.url).origin}/api/galene/group`;

    for (const record of records) {
      if (record.galene_group) {
        console.log(`[Cleanup] Deleting Galene group via bridge: ${record.galene_group}`);
        try {
          const deleteRes = await fetch(`${internalUrl}?classId=${record.galene_group}`, {
            method: "DELETE",
            headers: {
              "x-internal-secret": process.env.INTERNAL_SECRET || "",
            },
          });

          if (deleteRes.ok) {
            deletedCount++;
          } else {
            const errData = await deleteRes.json().catch(() => ({}));
            console.error(`[Cleanup] Failed to delete group ${record.galene_group}:`, errData);
          }
        } catch (err) {
          console.error(`[Cleanup] Network error deleting group ${record.galene_group}:`, err);
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
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Nightly cleanup finished. Deleted ${deletedCount} Galene groups and ${chatFilesDeleted} chat uploads.`,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Cron Cleanup Error:", err);
    return NextResponse.json(
      { error: "Failed to run scheduled cleanup", details: err.message },
      { status: 500 },
    );
  }
}
