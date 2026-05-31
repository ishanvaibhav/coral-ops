import { NextResponse } from "next/server";
import { z } from "zod";
import { coral } from "@/lib/coral/client";

const Body = z.object({
  query: z.string().min(1),
  params: z.record(z.unknown()).optional(),
});

/**
 * POST /api/coral/query
 * Federated SQL execution across all connected sources via Coral.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { query, params } = Body.parse(json);
    const result = await coral.sql(query, params ?? {});
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
