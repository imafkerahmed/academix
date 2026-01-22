import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";
import pb from "@/lib/pocketbase";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const auth0User = session.user;

    // Authenticate PocketBase as admin to create/update users
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!,
    );

    // Check if user exists in PocketBase
    let pbUser;
    try {
      const users = await pb.collection("users").getList(1, 1, {
        filter: `auth0_id = "${auth0User.sub}"`,
      });

      if (users.items.length > 0) {
        pbUser = users.items[0];
      }
    } catch (error) {
      console.log("User not found, will create new one");
    }

    // If user doesn't exist, create them
    if (!pbUser) {
      // Get role from Auth0 metadata (we'll set this up next)
      const role = auth0User["https://yourapp.com/role"] || "attendee";

      pbUser = await pb.collection("users").create({
        email: auth0User.email,
        name: auth0User.name || auth0User.email,
        role: role,
        auth0_id: auth0User.sub,
        avatar: auth0User.picture || "",
      });
    }

    return NextResponse.json({
      user: pbUser,
      role: pbUser.role,
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
