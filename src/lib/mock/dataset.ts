/**
 * In-memory federated dataset. The Coral SQL client routes queries here in
 * dev/demo mode. Replace with the real `@coral-protocol/sdk` runtime in prod.
 */

import type {
  Deployment,
  Incident,
  Integration,
  PullRequest,
  SecurityFinding,
  SprintTask,
} from "@/lib/types";
import {
  deployments,
  incidents,
  integrations,
  pullRequests,
  securityFindings,
  sprintTasks,
} from "./fixtures";

type Table =
  | "incidents"
  | "deployments"
  | "pull_requests"
  | "sprint_tasks"
  | "security_findings"
  | "integrations";

const tables: Record<Table, unknown[]> = {
  incidents,
  deployments,
  pull_requests: pullRequests,
  sprint_tasks: sprintTasks,
  security_findings: securityFindings,
  integrations,
};

function detectTable(q: string): Table | null {
  const lc = q.toLowerCase();
  for (const t of Object.keys(tables) as Table[]) {
    if (lc.includes(t)) return t;
  }
  return null;
}

export const mockDataset = {
  async execute(query: string, params: Record<string, unknown> = {}) {
    const table = detectTable(query);
    if (!table) return [];
    let rows = [...tables[table]];

    // very small predicate engine for demo (id = :id, status = :status)
    const lc = query.toLowerCase();
    if (/where\s+id\s*=\s*:id/.test(lc) && params.id != null) {
      rows = rows.filter((r) => (r as { id: string }).id === params.id);
    }
    if (/status\s*=\s*:status/.test(lc) && params.status != null) {
      rows = rows.filter((r) => (r as { status: string }).status === params.status);
    }

    // ORDER BY ... DESC LIMIT n
    const limitMatch = /limit\s+(\d+)/i.exec(query);
    if (limitMatch) rows = rows.slice(0, parseInt(limitMatch[1], 10));

    return rows;
  },
};

export const fixtures = {
  incidents: incidents as Incident[],
  deployments: deployments as Deployment[],
  pullRequests: pullRequests as PullRequest[],
  sprintTasks: sprintTasks as SprintTask[],
  securityFindings: securityFindings as SecurityFinding[],
  integrations: integrations as Integration[],
};
