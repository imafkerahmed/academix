import PocketBase from "pocketbase";

let adminClient: PocketBase | null = null;

export async function getAdminClient() {
  // Re-use cached client if token is still valid
  if (adminClient?.authStore.isValid) {
    return adminClient;
  }

  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://localhost:8090";
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Missing PocketBase admin credentials in environment variables",
    );
  }

  const client = new PocketBase(url);
  client.autoCancellation(false);

  try {
    // Try PocketBase v0.23+ superusers first
    await client
      .collection("_superusers")
      .authWithPassword(adminEmail, adminPassword);
  } catch (err) {
    console.warn("[PocketBase Admin] _superusers auth failed, trying legacy admins:", err);
    try {
      // Fallback to legacy admins
      await client.admins.authWithPassword(adminEmail, adminPassword);
    } catch (legacyErr) {
      console.error("[PocketBase Admin] Both auth methods failed.", legacyErr);
      throw legacyErr;
    }
  }

  adminClient = client;
  return client;
}
