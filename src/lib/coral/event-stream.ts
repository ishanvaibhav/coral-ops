/**
 * Live engineering event stream (Coral subscription simulator).
 * Emits a realistic mix of PRs, deploys, errors, incidents, and rollbacks.
 */

import type { IntegrationSource, Severity } from "@/lib/types";

export type LiveEventKind =
  | "pr_opened"
  | "pr_merged"
  | "deploy_started"
  | "deploy_success"
  | "deploy_failed"
  | "error_spike"
  | "incident_opened"
  | "incident_resolved"
  | "rollback"
  | "alert"
  | "slack_thread";

export interface LiveEvent {
  id: string;
  kind: LiveEventKind;
  source: IntegrationSource;
  title: string;
  detail?: string;
  severity?: Severity;
  ts: string;
  actor?: string;
  ref?: string;
}

const POOL: Omit<LiveEvent, "id" | "ts">[] = [
  { kind: "pr_opened", source: "github", title: "PR #3329 opened", detail: "feat(billing): add idempotency keys", actor: "priya.r", ref: "pull/3329" },
  { kind: "pr_merged", source: "github", title: "PR #3322 merged", detail: "fix: add gRPC timeout to PaymentsClient", actor: "marcus.c", ref: "pull/3322" },
  { kind: "deploy_started", source: "github", title: "Deploy started → checkout-api", detail: "v2.41.1 → canary", actor: "ci-bot" },
  { kind: "deploy_success", source: "github", title: "Deploy succeeded → search-svc", detail: "v1.18.2 → production · 5m 12s", actor: "ci-bot" },
  { kind: "deploy_failed", source: "github", title: "Deploy failed → billing-worker", detail: "staging · migration timeout", severity: "medium", actor: "ci-bot" },
  { kind: "error_spike", source: "sentry", title: "Error spike: TimeoutError", detail: "+1,210 events in 5m on payments-svc", severity: "high" },
  { kind: "incident_opened", source: "pagerduty", title: "Incident opened: INC-2041", detail: "checkout-api P2", severity: "high", actor: "auto" },
  { kind: "incident_resolved", source: "pagerduty", title: "Incident resolved: INC-2039", detail: "log pipeline mitigated", actor: "marcus.c" },
  { kind: "rollback", source: "github", title: "Rollback initiated → checkout-api", detail: "v2.41.0 → v2.40.4", severity: "high", actor: "priya.r" },
  { kind: "alert", source: "datadog", title: "Datadog monitor triggered", detail: "p99 /checkout > 1s for 3m", severity: "high" },
  { kind: "slack_thread", source: "slack", title: "#incidents thread updated", detail: "12 new messages on INC-2041", actor: "alex.t" },
  { kind: "alert", source: "datadog", title: "CPU saturation: api-gateway", detail: "node-7 > 92% for 5m", severity: "medium" },
];

let counter = 0;

export function createEventStream(opts: {
  intervalMs?: number;
  onEvent: (e: LiveEvent) => void;
}) {
  const interval = opts.intervalMs ?? 2800;

  // Seed with a few historical events so the panel isn't empty
  const seed = Array.from({ length: 6 }).map((_, i) => mintEvent(i * 4));
  seed.reverse().forEach(opts.onEvent);

  const id = setInterval(() => {
    opts.onEvent(mintEvent(0));
  }, interval);

  return () => clearInterval(id);
}

function mintEvent(secondsAgo: number): LiveEvent {
  const tpl = POOL[Math.floor(Math.random() * POOL.length)];
  counter++;
  return {
    ...tpl,
    id: `evt_${Date.now()}_${counter}`,
    ts: new Date(Date.now() - secondsAgo * 1000).toISOString(),
  };
}
