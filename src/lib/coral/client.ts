/**
 * Coral Protocol — Multi-Agent Data Layer
 * ============================================================================
 * Coral is the unified data + agent fabric powering this command center.
 *
 * It exposes three primary surfaces:
 *   1. `coral.sql(...)`     — federated SQL across all connected sources
 *   2. `coral.agent(name)`  — invoke a specialized MCP-style agent
 *   3. `coral.stream(...)`  — subscribe to live signals (incidents, deploys)
 *
 * In production this would wrap `@coral-protocol/sdk` and route to the
 * Coral runtime via MCP. Here we implement an in-process simulator with the
 * same contract so the rest of the app is wire-compatible.
 * ============================================================================
 */

import type {
  AgentName,
  Incident,
  IntegrationSource,
  ToolCall,
} from "@/lib/types";
import { mockDataset } from "@/lib/mock/dataset";

// ---------- Core SDK contract ----------------------------------------------

export interface CoralSqlResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
  sources: IntegrationSource[];
  executionMs: number;
  plan: string[];
}

export interface CoralAgentResponse {
  agent: AgentName;
  output: string;
  toolCalls: ToolCall[];
  citations: { source: IntegrationSource; ref: string }[];
  confidence: number;
}

export interface CoralStreamEvent {
  source: IntegrationSource;
  type: string;
  payload: unknown;
  ts: string;
}

// ---------- Federated SQL layer --------------------------------------------

/**
 * Coral federates queries across registered source adapters. The query
 * planner inspects the FROM clause to determine which adapters to hit,
 * then performs the join in-memory (or pushes down where supported).
 */
async function sql<T = Record<string, unknown>>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<CoralSqlResult<T>> {
  const start = performance.now();
  const sources = detectSources(query);
  const plan = buildPlan(query, sources);

  // Simulated execution against the mock federated dataset
  const rows = (await mockDataset.execute(query, params)) as T[];
  await delay(80 + Math.random() * 220); // realistic federated latency

  return {
    rows,
    rowCount: rows.length,
    sources,
    executionMs: Math.round(performance.now() - start),
    plan,
  };
}

function detectSources(query: string): IntegrationSource[] {
  const known: IntegrationSource[] = [
    "github", "slack", "sentry", "datadog", "jira", "notion", "pagerduty",
  ];
  const lc = query.toLowerCase();
  return known.filter((s) => lc.includes(s));
}

function buildPlan(query: string, sources: IntegrationSource[]): string[] {
  const plan = sources.map((s) => `SCAN ${s.toUpperCase()} via Coral adapter`);
  if (sources.length > 1) plan.push(`HASH JOIN on correlation_key`);
  if (/where|filter/i.test(query)) plan.push(`PUSHDOWN predicate filter`);
  if (/order by/i.test(query)) plan.push(`SORT result set`);
  return plan;
}

// ---------- Multi-agent layer ----------------------------------------------

const AGENT_PROFILES: Record<AgentName, {
  description: string;
  tools: string[];
  sources: IntegrationSource[];
}> = {
  orchestrator: {
    description: "Routes user intent to specialist agents and composes the final answer.",
    tools: ["plan", "delegate", "synthesize"],
    sources: [],
  },
  github: {
    description: "Reasons about repos, PRs, commits, code ownership, and review bottlenecks.",
    tools: ["search_prs", "get_pr_diff", "list_commits", "find_codeowner"],
    sources: ["github"],
  },
  slack: {
    description: "Searches conversations, surfaces team discussions and incident chatter.",
    tools: ["search_messages", "summarize_channel", "find_thread"],
    sources: ["slack"],
  },
  sentry: {
    description: "Investigates exceptions, error trends, and impacted releases.",
    tools: ["get_issue", "list_issues", "correlate_release"],
    sources: ["sentry"],
  },
  datadog: {
    description: "Queries metrics, logs, and APM traces; detects anomalies.",
    tools: ["query_metric", "search_logs", "get_trace"],
    sources: ["datadog"],
  },
  security: {
    description: "Scans for secret leaks, CVEs, and compliance drift across sources.",
    tools: ["scan_secrets", "list_vulns", "check_compliance"],
    sources: ["github", "datadog"],
  },
  report: {
    description: "Generates executive-grade narratives and incident postmortems.",
    tools: ["render_report", "summarize_incident", "export_pdf"],
    sources: [],
  },
};

async function agent(
  name: AgentName,
  prompt: string,
  context: Record<string, unknown> = {}
): Promise<CoralAgentResponse> {
  await delay(300 + Math.random() * 700);
  const profile = AGENT_PROFILES[name];
  const toolCalls: ToolCall[] = profile.tools.slice(0, 2).map((tool, i) => ({
    id: `tc_${Date.now()}_${i}`,
    agent: name,
    tool,
    args: { prompt, ...context },
    result: { ok: true },
    durationMs: Math.round(120 + Math.random() * 400),
    status: "success",
  }));

  return {
    agent: name,
    output: synthesizeResponse(name, prompt),
    toolCalls,
    citations: profile.sources.map((s) => ({ source: s, ref: `${s}://query` })),
    confidence: 0.78 + Math.random() * 0.2,
  };
}

function synthesizeResponse(name: AgentName, prompt: string): string {
  const samples: Record<AgentName, string> = {
    orchestrator: `I coordinated with the relevant specialist agents to answer: "${prompt}". See cited sources below.`,
    github: `Analyzed 47 open PRs and 312 recent commits. The query "${prompt}" surfaces 3 review bottlenecks in payments-svc and api-gateway.`,
    slack: `Searched 8 channels for "${prompt}" — most-discussed in #incidents and #platform over the last 24h with 32 mentions.`,
    sentry: `Cross-referenced "${prompt}" against issue groups. Detected a regression cluster tied to release v2.41.0 with 14k events.`,
    datadog: `Queried APM + metrics for "${prompt}". p99 latency on checkout-api jumped 340% at 14:02 UTC, correlating with deploy d_7741.`,
    security: `Scanned source-of-truth for "${prompt}". 2 high-severity findings: leaked API key in commit a3f2c1, CVE-2024-31449 in libxml2.`,
    report: `Drafted an executive summary on "${prompt}" with timeline, blast radius, contributing factors, and recommended action items.`,
  };
  return samples[name];
}

// ---------- Live streaming layer -------------------------------------------

function stream(
  topics: string[],
  onEvent: (e: CoralStreamEvent) => void
): () => void {
  const interval = setInterval(() => {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    onEvent({
      source: pickSource(topic),
      type: topic,
      payload: { msg: `live event on ${topic}` },
      ts: new Date().toISOString(),
    });
  }, 4000 + Math.random() * 3000);
  return () => clearInterval(interval);
}

function pickSource(topic: string): IntegrationSource {
  if (topic.includes("incident")) return "pagerduty";
  if (topic.includes("deploy")) return "github";
  if (topic.includes("error")) return "sentry";
  if (topic.includes("metric")) return "datadog";
  return "slack";
}

// ---------- Public surface --------------------------------------------------

export const coral = {
  sql,
  agent,
  stream,
  agents: AGENT_PROFILES,
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- High-level helpers ---------------------------------------------

export async function correlateIncident(incidentId: string): Promise<Incident | null> {
  const res = await coral.sql<Incident>(
    `SELECT * FROM incidents WHERE id = :id`,
    { id: incidentId }
  );
  return res.rows[0] ?? null;
}
