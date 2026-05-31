import { NextResponse } from "next/server";
import { z } from "zod";
import { coral } from "@/lib/coral/client";

const Body = z.object({
  agent: z.enum(["orchestrator", "github", "slack", "sentry", "datadog", "security", "report"]),
  prompt: z.string().min(1),
  context: z.record(z.unknown()).optional(),
});

/** POST /api/coral/agent — invoke a Coral specialist agent. */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { agent, prompt, context } = Body.parse(json);
    const result = await coral.agent(agent, prompt, context ?? {});
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
