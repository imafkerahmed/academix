import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/pocketbaseAdmin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const newPasswordFromBody =
      typeof body?.newPassword === "string" && body.newPassword.trim()
        ? (body.newPassword as string)
        : undefined;

    const pb = await getAdminClient();

    // Fetch the user record first so we can default the password to userId
    const user = await pb.collection("users").getOne(id);

    const userIdField = (user as any).userId as string | undefined;

    const finalPassword = newPasswordFromBody || userIdField;

    if (!finalPassword) {
      return NextResponse.json(
        {
          error: "Unable to determine password: missing newPassword and userId",
        },
        { status: 400 },
      );
    }

    const updated = await pb.collection("users").update(id, {
      password: finalPassword,
      passwordConfirm: finalPassword,
    });

    return NextResponse.json({ record: updated });
  } catch (err: any) {
    console.error("Admin reset password error:", err);

    const status = err?.status || 500;
    const errorPayload: any = {
      error: err?.message || "Failed to reset password",
    };

    if (err?.data) {
      errorPayload.data = err.data;
    }

    return NextResponse.json(errorPayload, { status });
  }
}
