import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Signup route removed" }, { status: 404 });
}
