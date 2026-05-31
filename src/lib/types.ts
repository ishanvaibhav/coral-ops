// ============================================================================
// Domain Types — shared across UI, agents, and Coral data layer
// ============================================================================

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type HealthGrade = "A" | "B" | "C" | "D" | "F";

export type IntegrationSource =
  | "github"
  | "slack"
  | "sentry"
  | "datadog"
  | "jira"
  | "notion"
  | "pagerduty";

export interface Integration {
  id: IntegrationSource;
  name: string;
  status: "connected" | "degraded" | "disconnected";
  lastSync: string; // ISO
  recordCount: number;
  latencyMs: number;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: "open" | "investigating" | "mitigated" | "resolved";
  service: string;
  startedAt: string;
  resolvedAt?: string;
  assignee: string;
  source: "pagerduty" | "sentry" | "datadog";
  affectedUsers: number;
  errorRate: number; // percent
  description: string;
  rootCause?: string;
  correlatedSignals: CorrelatedSignal[];
  timeline: TimelineEvent[];
}

export interface CorrelatedSignal {
  source: IntegrationSource;
  type: "error" | "deploy" | "metric" | "log" | "alert" | "pr";
  message: string;
  ts: string;
  confidence: number; // 0..1
}

export interface TimelineEvent {
  ts: string;
  source: IntegrationSource;
  actor: string;
  action: string;
  details?: string;
}

export interface Deployment {
  id: string;
  service: string;
  version: string;
  status: "success" | "failed" | "in_progress" | "rolled_back";
  env: "production" | "staging" | "canary";
  author: string;
  startedAt: string;
  durationSec: number;
  riskScore: number; // 0..100
  prNumber: number;
  changedFiles: number;
}

export interface SprintTask {
  id: string;
  key: string; // JIRA-1234
  title: string;
  status: "todo" | "in_progress" | "in_review" | "blocked" | "done";
  assignee: string;
  points: number;
  ageDays: number;
  blockers: string[];
  prUrl?: string;
}

export interface PullRequest {
  id: string;
  number: number;
  repo: string;
  title: string;
  author: string;
  status: "open" | "review" | "approved" | "merged" | "closed";
  ageHours: number;
  additions: number;
  deletions: number;
  reviewers: string[];
  reviewWaitHours: number;
}

export interface SecurityFinding {
  id: string;
  type: "secret_leak" | "vulnerability" | "compliance" | "dependency";
  severity: Severity;
  source: IntegrationSource;
  title: string;
  location: string;
  detectedAt: string;
  status: "open" | "acknowledged" | "fixed" | "false_positive";
  cve?: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "agent" | "system" | "tool";
  agent?: AgentName;
  content: string;
  ts: string;
  toolCalls?: ToolCall[];
  sources?: { source: IntegrationSource; label: string; url?: string }[];
}

export type AgentName =
  | "orchestrator"
  | "github"
  | "slack"
  | "sentry"
  | "datadog"
  | "security"
  | "report";

export interface ToolCall {
  id: string;
  agent: AgentName;
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
  durationMs: number;
  status: "pending" | "success" | "error";
}

export interface MetricSeries {
  label: string;
  data: { ts: string; value: number }[];
}

export interface TeamHealth {
  score: number;
  grade: HealthGrade;
  trend: number;
  components: { name: string; value: number; weight: number }[];
}
