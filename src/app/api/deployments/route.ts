import { NextResponse } from "next/server";
import { coral } from "@/lib/coral/client";

export async function GET() {
  const res = await coral.sql(
    `SELECT * FROM deployments ORDER BY started_at DESC LIMIT 20`
  );
  return NextResponse.json(res);
}
