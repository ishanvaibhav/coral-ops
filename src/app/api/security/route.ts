import { NextResponse } from "next/server";
import { coral } from "@/lib/coral/client";

export async function GET() {
  const res = await coral.sql(
    `SELECT * FROM security_findings ORDER BY detected_at DESC LIMIT 50`
  );
  return NextResponse.json(res);
}
