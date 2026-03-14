import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Me route removed" }, { status: 404 });
}
