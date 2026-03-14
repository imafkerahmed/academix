import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Login route removed" }, { status: 404 });
}
