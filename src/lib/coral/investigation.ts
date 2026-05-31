/**
 * Autonomous Investigation Engine
 * ============================================================================
 * Orchestrates the 5-agent flow for the War Room. Each agent runs a scripted
 * but realistic chain of Coral tool calls and surfaces structured findings
 * that downstream components (RCA timeline, root-cause card, postmortem)
 * consume.
 *
 * In production, swap the `runStep` body to call `coral.agent(...)` for real.
 * ============================================================================
 */

import type { AgentName, IntegrationSource, Severity } from "@/lib/types";

export interface InvestigationStep {
  id: string;
  agent: AgentName;
  status: "pending" | "running" | "success" | "error";
  tool: string;
  thought: string;
  findings: Finding[];
  durationMs: number;
}

export interface Finding {
  source: IntegrationSource;
  ts: string;          // ISO
  label: string;       // short headline
  detail: string;      // sentence
  evidence: string;    // raw quote / id / metric
  weight: number;      // 0..1 contribution to RCA
}

export interface InvestigationResult {
  query: string;
  steps: InvestigationStep[];
  rootCause: {
    summary: string;
    confidence: number;     // 0..1
    primarySource: IntegrationSource;
    primaryRef: string;     // e.g. "PR #3318"
    affectedUsers: number;
    severity: Severity;
    recommendedAction: string;
    blastRadius: string;
  };
  timeline: Finding[];      // sorted by ts
}

// ---------------------------------------------------------------------------
// Scripted investigation plans keyed by intent
// ---------------------------------------------------------------------------

const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

interface Plan {
  match: RegExp;
  steps: Omit<InvestigationStep, "status" | "durationMs">[];
  rootCause: InvestigationResult["rootCause"];
}

const PLANS: Plan[] = [
  {
    match: /checkout|payment|502|5xx|timeout/i,
    steps: [
      {
        id: "s1",
        agent: "github",
        tool: "search_prs + get_diff",
        thought: "Looking for recent merges touching checkout-api or payments-svc in the last 2h.",
        findings: [
          {
            source: "github",
            ts: minutesAgo(46),
            label: "PR #3318 merged → v2.41.0 deployed",
            detail: "PaymentsClient gRPC stub rewritten; default deadline removed (line 84).",
            evidence: "diff: -ctx, cancel := context.WithTimeout(ctx, 5*time.Second)",
            weight: 0.94,
          },
        ],
      },
      {
        id: "s2",
        agent: "sentry",
        tool: "list_issues(release=v2.41.0)",
        thought: "Checking for new error groupings tagged with the latest release.",
        findings: [
          {
            source: "sentry",
            ts: minutesAgo(41),
            label: "TimeoutError spike (+14,221 events)",
            detail: "All events grouped under PaymentsClient.charge; first seen T+0:04 after deploy.",
            evidence: "issue PAY-3344 · 14,221 events · 3,812 users",
            weight: 0.91,
          },
        ],
      },
      {
        id: "s3",
        agent: "datadog",
        tool: "query_metric + search_logs",
        thought: "Pulling p99 latency and connection pool saturation for payments-svc.",
        findings: [
          {
            source: "datadog",
            ts: minutesAgo(40),
            label: "p99 /checkout: 320ms → 1.4s",
            detail: "payments-svc.grpc.in_flight saturated pool (50/50) at T+0:06.",
            evidence: "metric: payments_svc.checkout.p99{env:prod} = 1421ms",
            weight: 0.88,
          },
        ],
      },
      {
        id: "s4",
        agent: "slack",
        tool: "search_messages(#incidents)",
        thought: "Looking for rollback or mitigation discussion in #incidents.",
        findings: [
          {
            source: "slack",
            ts: minutesAgo(38),
            label: "#incidents: 'anyone else seeing checkout fail?'",
            detail: "Thread started by alex.t; 14 replies, rollback proposed by priya.r at T+0:10.",
            evidence: "slack://channels/incidents/p1730821840",
            weight: 0.72,
          },
          {
            source: "slack",
            ts: minutesAgo(20),
            label: "Rollback initiated",
            detail: "priya.r triggered rollback via /deploy rollback checkout-api",
            evidence: "slack://channels/deploys/p1730822920",
            weight: 0.80,
          },
        ],
      },
      {
        id: "s5",
        agent: "report",
        tool: "synthesize + render_report",
        thought: "Composing root-cause hypothesis with evidence chain and recommended actions.",
        findings: [
          {
            source: "github",
            ts: minutesAgo(15),
            label: "PR #3322 opened (fix forward)",
            detail: "priya.r added explicit timeout + circuit breaker to PaymentsClient.",
            evidence: "github://pull/3322",
            weight: 0.65,
          },
        ],
      },
    ],
    rootCause: {
      summary:
        "Deploy v2.41.0 (PR #3318) removed the default gRPC deadline on PaymentsClient. Under steady traffic this saturated the connection pool within 6 minutes, causing 502s on /checkout.",
      confidence: 0.94,
      primarySource: "github",
      primaryRef: "PR #3318",
      affectedUsers: 12_000,
      severity: "high",
      recommendedAction:
        "Roll back v2.41.0 immediately and promote PR #3322 (timeout fix) to canary.",
      blastRadius: "checkout-api (production) · ~4.7% of requests · 12k unique users",
    },
  },
  {
    match: /search|index|stale|reindex/i,
    steps: [
      {
        id: "s1",
        agent: "github",
        tool: "search_prs",
        thought: "Looking for recent schema or migration changes in search-svc.",
        findings: [{
          source: "github", ts: minutesAgo(220),
          label: "PR #3301 — schema migration 02-add-author-fk.sql",
          detail: "Added FK column without backfill step for delta rows.",
          evidence: "github://pull/3301", weight: 0.82,
        }],
      },
      {
        id: "s2", agent: "sentry", tool: "list_issues",
        thought: "Checking error groupings on search-svc.",
        findings: [{
          source: "sentry", ts: minutesAgo(210),
          label: "MissingIndexError (+218 events)",
          detail: "search.query() failing for documents created during migration window.",
          evidence: "issue SRCH-77", weight: 0.78,
        }],
      },
      {
        id: "s3", agent: "datadog", tool: "query_metric",
        thought: "Measuring index freshness lag.",
        findings: [{
          source: "datadog", ts: minutesAgo(200),
          label: "search.index_lag = 38m",
          detail: "Reindex job missed ~12k delta rows.",
          evidence: "metric: search.index_lag_minutes = 38", weight: 0.71,
        }],
      },
      {
        id: "s4", agent: "slack", tool: "search_messages",
        thought: "Looking for ops discussion.",
        findings: [{
          source: "slack", ts: minutesAgo(180),
          label: "#data-ops: 'reindex didn't pick up new docs'",
          detail: "ana.c flagged in thread, suggested manual backfill.",
          evidence: "slack://channels/data-ops/p123", weight: 0.65,
        }],
      },
      {
        id: "s5", agent: "report", tool: "synthesize",
        thought: "Composing findings.",
        findings: [],
      },
    ],
    rootCause: {
      summary:
        "Migration PR #3301 added a required FK without a backfill step; the reindex job skipped affected rows, leaving the search index stale for ~38 minutes.",
      confidence: 0.88,
      primarySource: "github",
      primaryRef: "PR #3301",
      affectedUsers: 124,
      severity: "low",
      recommendedAction:
        "Run targeted backfill for rows in migration window; add backfill guardrail to migration template.",
      blastRadius: "search-svc · 124 users · 0.3% error rate",
    },
  },
  // Fallback / generic
  {
    match: /.*/,
    steps: [
      {
        id: "s1", agent: "github", tool: "search_prs",
        thought: "Scanning recent merges for related changes.",
        findings: [{
          source: "github", ts: minutesAgo(60),
          label: "PR #3315 merged",
          detail: "Recent change to notifications worker.",
          evidence: "github://pull/3315", weight: 0.4,
        }],
      },
      { id: "s2", agent: "sentry", tool: "list_issues",
        thought: "Checking error groupings.", findings: [] },
      { id: "s3", agent: "datadog", tool: "query_metric",
        thought: "Pulling service metrics.", findings: [] },
      { id: "s4", agent: "slack", tool: "search_messages",
        thought: "Looking for relevant discussion.", findings: [] },
      { id: "s5", agent: "report", tool: "synthesize",
        thought: "Composing findings.", findings: [] },
    ],
    rootCause: {
      summary: "Coral surfaced limited cross-source signal for this query. Consider scoping to a service or time window.",
      confidence: 0.42, primarySource: "github", primaryRef: "n/a",
      affectedUsers: 0, severity: "info",
      recommendedAction: "Re-run with a service or time-range filter.",
      blastRadius: "unknown",
    },
  },
];

export function planInvestigation(query: string): Plan {
  return PLANS.find((p) => p.match.test(query)) ?? PLANS[PLANS.length - 1];
}

export async function* runInvestigation(query: string): AsyncGenerator<
  | { type: "step_start"; step: InvestigationStep }
  | { type: "step_finish"; step: InvestigationStep }
  | { type: "complete"; result: InvestigationResult },
  void,
  unknown
> {
  const plan = planInvestigation(query);
  const completed: InvestigationStep[] = [];

  for (const stepTpl of plan.steps) {
    const step: InvestigationStep = { ...stepTpl, status: "running", durationMs: 0 };
    yield { type: "step_start", step };

    const dur = 700 + Math.random() * 900;
    await delay(dur);
    const done: InvestigationStep = { ...step, status: "success", durationMs: Math.round(dur) };
    completed.push(done);
    yield { type: "step_finish", step: done };
  }

  const timeline = completed
    .flatMap((s) => s.findings)
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  yield {
    type: "complete",
    result: {
      query,
      steps: completed,
      rootCause: plan.rootCause,
      timeline,
    },
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
