import type {
  Deployment,
  Incident,
  Integration,
  PullRequest,
  SecurityFinding,
  SprintTask,
} from "@/lib/types";

const now = () => new Date();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const integrations: Integration[] = [
  { id: "github", name: "GitHub", status: "connected", lastSync: minutesAgo(2), recordCount: 18_429, latencyMs: 142 },
  { id: "slack", name: "Slack", status: "connected", lastSync: minutesAgo(1), recordCount: 92_311, latencyMs: 88 },
  { id: "sentry", name: "Sentry", status: "connected", lastSync: minutesAgo(1), recordCount: 4_421, latencyMs: 201 },
  { id: "datadog", name: "Datadog", status: "degraded", lastSync: minutesAgo(7), recordCount: 1_204_991, latencyMs: 612 },
  { id: "jira", name: "Jira", status: "connected", lastSync: minutesAgo(3), recordCount: 2_847, latencyMs: 167 },
  { id: "notion", name: "Notion", status: "connected", lastSync: minutesAgo(12), recordCount: 612, latencyMs: 244 },
  { id: "pagerduty", name: "PagerDuty", status: "connected", lastSync: minutesAgo(1), recordCount: 198, latencyMs: 95 },
];

export const incidents: Incident[] = [
  {
    id: "INC-2041",
    title: "Elevated checkout 5xx errors after v2.41.0 deploy",
    severity: "high",
    status: "investigating",
    service: "checkout-api",
    startedAt: minutesAgo(42),
    assignee: "Priya Raman",
    source: "pagerduty",
    affectedUsers: 3_812,
    errorRate: 4.7,
    description: "Checkout endpoint returning 502s for ~5% of traffic. Started shortly after canary promotion of v2.41.0.",
    rootCause: "Suspected: connection pool exhaustion in payments-svc due to a missing timeout in the new gRPC client.",
    correlatedSignals: [
      { source: "github", type: "deploy", message: "Deploy d_7741 promoted v2.41.0 to production", ts: minutesAgo(46), confidence: 0.94 },
      { source: "sentry", type: "error", message: "TimeoutError in PaymentsClient.charge (+14,221 events)", ts: minutesAgo(41), confidence: 0.91 },
      { source: "datadog", type: "metric", message: "p99 latency on /checkout: 320ms → 1.4s", ts: minutesAgo(40), confidence: 0.88 },
      { source: "slack", type: "alert", message: "Thread in #incidents: 'anyone else seeing checkout fail?'", ts: minutesAgo(38), confidence: 0.72 },
    ],
    timeline: [
      { ts: minutesAgo(46), source: "github", actor: "ci-bot", action: "deploy", details: "v2.41.0 → production via PR #3318" },
      { ts: minutesAgo(43), source: "datadog", actor: "monitor", action: "alert fired", details: "checkout-api p99 > 1s for 3m" },
      { ts: minutesAgo(42), source: "pagerduty", actor: "auto", action: "incident opened", details: "INC-2041 P2" },
      { ts: minutesAgo(40), source: "sentry", actor: "auto", action: "new issue", details: "TimeoutError grouping spike" },
      { ts: minutesAgo(35), source: "slack", actor: "priya.r", action: "ack incident", details: "investigating now" },
      { ts: minutesAgo(20), source: "github", actor: "priya.r", action: "open PR", details: "PR #3322: add timeout to PaymentsClient" },
    ],
  },
  {
    id: "INC-2039",
    title: "Datadog log ingestion lag",
    severity: "medium",
    status: "mitigated",
    service: "observability",
    startedAt: hoursAgo(6),
    resolvedAt: hoursAgo(2),
    assignee: "Marcus Chen",
    source: "datadog",
    affectedUsers: 0,
    errorRate: 0,
    description: "Log pipeline backlogged ~8 minutes. Mitigated by scaling shipper fleet.",
    correlatedSignals: [
      { source: "datadog", type: "metric", message: "log_pipeline.lag_seconds > 480", ts: hoursAgo(6), confidence: 0.96 },
    ],
    timeline: [
      { ts: hoursAgo(6), source: "datadog", actor: "monitor", action: "alert" },
      { ts: hoursAgo(5), source: "slack", actor: "marcus.c", action: "ack" },
      { ts: hoursAgo(2), source: "pagerduty", actor: "marcus.c", action: "resolve", details: "scaled shippers 4→12" },
    ],
  },
  {
    id: "INC-2036",
    title: "Search index stale after migration",
    severity: "low",
    status: "resolved",
    service: "search-svc",
    startedAt: daysAgo(2),
    resolvedAt: daysAgo(2),
    assignee: "Ana Costa",
    source: "sentry",
    affectedUsers: 124,
    errorRate: 0.3,
    description: "Reindex job missed delta rows after schema migration.",
    correlatedSignals: [],
    timeline: [
      { ts: daysAgo(2), source: "sentry", actor: "auto", action: "new issue" },
      { ts: daysAgo(2), source: "github", actor: "ana.c", action: "merge fix", details: "PR #3301" },
    ],
  },
];

export const deployments: Deployment[] = [
  { id: "d_7744", service: "checkout-api", version: "v2.41.1", status: "in_progress", env: "canary", author: "priya.r", startedAt: minutesAgo(8), durationSec: 480, riskScore: 38, prNumber: 3322, changedFiles: 4 },
  { id: "d_7743", service: "search-svc", version: "v1.18.2", status: "success", env: "production", author: "ana.c", startedAt: hoursAgo(2), durationSec: 312, riskScore: 12, prNumber: 3320, changedFiles: 2 },
  { id: "d_7742", service: "api-gateway", version: "v3.7.0", status: "success", env: "production", author: "marcus.c", startedAt: hoursAgo(5), durationSec: 540, riskScore: 22, prNumber: 3319, changedFiles: 11 },
  { id: "d_7741", service: "checkout-api", version: "v2.41.0", status: "rolled_back", env: "production", author: "priya.r", startedAt: hoursAgo(1), durationSec: 410, riskScore: 71, prNumber: 3318, changedFiles: 28 },
  { id: "d_7740", service: "notifications", version: "v0.9.4", status: "success", env: "production", author: "leo.k", startedAt: hoursAgo(9), durationSec: 220, riskScore: 8, prNumber: 3315, changedFiles: 1 },
  { id: "d_7739", service: "billing-worker", version: "v4.2.1", status: "failed", env: "staging", author: "dan.s", startedAt: hoursAgo(11), durationSec: 90, riskScore: 55, prNumber: 3314, changedFiles: 6 },
];

export const pullRequests: PullRequest[] = [
  { id: "pr_3322", number: 3322, repo: "payments-svc", title: "Add request timeout to PaymentsClient gRPC", author: "priya.r", status: "review", ageHours: 0.5, additions: 84, deletions: 12, reviewers: ["marcus.c", "ana.c"], reviewWaitHours: 0.4 },
  { id: "pr_3317", number: 3317, repo: "api-gateway", title: "Migrate auth middleware to typed handlers", author: "marcus.c", status: "review", ageHours: 72, additions: 612, deletions: 480, reviewers: ["priya.r"], reviewWaitHours: 36 },
  { id: "pr_3312", number: 3312, repo: "frontend", title: "Redesign settings page", author: "leo.k", status: "approved", ageHours: 20, additions: 1820, deletions: 940, reviewers: ["ana.c", "priya.r"], reviewWaitHours: 8 },
  { id: "pr_3309", number: 3309, repo: "search-svc", title: "Cache hot queries in Redis", author: "ana.c", status: "open", ageHours: 6, additions: 220, deletions: 18, reviewers: [], reviewWaitHours: 6 },
  { id: "pr_3305", number: 3305, repo: "notifications", title: "Batch SMS sends to reduce vendor cost", author: "dan.s", status: "review", ageHours: 96, additions: 140, deletions: 22, reviewers: ["leo.k"], reviewWaitHours: 60 },
];

export const sprintTasks: SprintTask[] = [
  { id: "t1", key: "PAY-412", title: "Add timeout + retry to PaymentsClient", status: "in_review", assignee: "priya.r", points: 3, ageDays: 1, blockers: [], prUrl: "github/pr/3322" },
  { id: "t2", key: "API-201", title: "Migrate auth middleware to typed handlers", status: "in_review", assignee: "marcus.c", points: 8, ageDays: 6, blockers: ["needs platform review"], prUrl: "github/pr/3317" },
  { id: "t3", key: "FE-88", title: "Redesign settings page", status: "in_review", assignee: "leo.k", points: 5, ageDays: 3, blockers: [], prUrl: "github/pr/3312" },
  { id: "t4", key: "SRCH-44", title: "Cache hot queries in Redis", status: "in_progress", assignee: "ana.c", points: 5, ageDays: 1, blockers: [] },
  { id: "t5", key: "SEC-19", title: "Rotate leaked Stripe key", status: "blocked", assignee: "dan.s", points: 2, ageDays: 4, blockers: ["awaiting finance sign-off"] },
  { id: "t6", key: "NOT-12", title: "Batch SMS sends", status: "in_review", assignee: "dan.s", points: 3, ageDays: 4, blockers: [] },
  { id: "t7", key: "OBS-77", title: "Reduce log pipeline lag", status: "done", assignee: "marcus.c", points: 5, ageDays: 0, blockers: [] },
  { id: "t8", key: "PAY-415", title: "Add idempotency keys to refunds", status: "todo", assignee: "priya.r", points: 5, ageDays: 0, blockers: [] },
  { id: "t9", key: "FE-91", title: "Empty-states for dashboard", status: "in_progress", assignee: "leo.k", points: 3, ageDays: 2, blockers: [] },
  { id: "t10", key: "API-205", title: "Rate-limit per API key", status: "todo", assignee: "marcus.c", points: 5, ageDays: 0, blockers: [] },
];

export const securityFindings: SecurityFinding[] = [
  { id: "sec_1", type: "secret_leak", severity: "critical", source: "github", title: "Stripe live key committed to repo `payments-svc`", location: "src/config/stripe.ts:14 @ a3f2c1d", detectedAt: hoursAgo(3), status: "open" },
  { id: "sec_2", type: "vulnerability", severity: "high", source: "github", title: "libxml2 CVE-2024-31449 (RCE)", location: "go.sum", detectedAt: hoursAgo(20), status: "acknowledged", cve: "CVE-2024-31449" },
  { id: "sec_3", type: "dependency", severity: "medium", source: "github", title: "axios 0.21.1 — prototype pollution", location: "frontend/package.json", detectedAt: daysAgo(2), status: "open", cve: "CVE-2021-3749" },
  { id: "sec_4", type: "compliance", severity: "medium", source: "datadog", title: "PII detected in log stream `checkout-api`", location: "logs.checkout.error", detectedAt: hoursAgo(8), status: "open" },
  { id: "sec_5", type: "vulnerability", severity: "low", source: "github", title: "Outdated TLS cipher in nginx config", location: "infra/nginx.conf:42", detectedAt: daysAgo(4), status: "open" },
  { id: "sec_6", type: "compliance", severity: "info", source: "github", title: "Missing CODEOWNERS for /infra", location: ".github/CODEOWNERS", detectedAt: daysAgo(7), status: "open" },
];

export const teamMembers = [
  { id: "priya.r", name: "Priya Raman", role: "Staff Engineer", avatar: "PR", load: 92 },
  { id: "marcus.c", name: "Marcus Chen", role: "Senior Engineer", avatar: "MC", load: 78 },
  { id: "ana.c", name: "Ana Costa", role: "Engineer", avatar: "AC", load: 64 },
  { id: "leo.k", name: "Leo Kim", role: "Frontend Engineer", avatar: "LK", load: 71 },
  { id: "dan.s", name: "Dan Stein", role: "SRE", avatar: "DS", load: 88 },
];

// Time-series for charts
export const seriesVelocity = Array.from({ length: 8 }, (_, i) => ({
  sprint: `S-${i + 1}`,
  planned: 30 + Math.round(Math.sin(i) * 4) + i,
  completed: 28 + Math.round(Math.cos(i) * 5) + i - (i === 6 ? 6 : 0),
}));

export const seriesDeployFreq = Array.from({ length: 14 }, (_, i) => ({
  day: `D-${14 - i}`,
  deploys: Math.max(0, Math.round(5 + Math.sin(i / 2) * 3 + (i > 10 ? 2 : 0))),
  failures: Math.max(0, Math.round(Math.random() * (i > 10 ? 2 : 1))),
}));

export const seriesMTTR = Array.from({ length: 12 }, (_, i) => ({
  week: `W-${12 - i}`,
  mttr: Math.round(45 + Math.sin(i / 2) * 18 + (i === 11 ? 12 : 0)),
}));

export const seriesLatency = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  p50: 80 + Math.round(Math.sin(i / 3) * 15),
  p95: 220 + Math.round(Math.sin(i / 3) * 40),
  p99: 380 + Math.round(Math.sin(i / 3) * 90) + (i === 14 ? 800 : 0),
}));

export const seriesIncidentTrend = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  critical: i === 22 ? 2 : Math.random() < 0.1 ? 1 : 0,
  high: Math.random() < 0.2 ? 1 : 0,
  medium: Math.random() < 0.3 ? 1 : 0,
}));
