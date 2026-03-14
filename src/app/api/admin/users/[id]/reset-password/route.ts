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

    const userIdField = (user as unknown as { userId?: string }).userId;

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
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; data?: unknown };
    console.error("Admin reset password error:", error);

    const status = error?.status || 500;
    const errorPayload: Record<string, unknown> = {
      error: error?.message || "Failed to reset password",
    };

    if (error?.data) {
      errorPayload.data = error.data;
    }

    return NextResponse.json(errorPayload, { status });
  }
}
