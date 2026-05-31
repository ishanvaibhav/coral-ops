# Coral.Ops — AI Engineering Command Center

A modern, dark-themed command center for engineering organizations.
Federates **GitHub · Slack · Sentry · Datadog · Jira · Notion · PagerDuty**
through the **Coral Protocol** multi-agent data layer.

> **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Shadcn UI ·
> Framer Motion · Recharts · Coral Protocol SDK pattern.

---

## Features

| # | Module | Description |
|---|--------|-------------|
| ⭐ | **Incident War Room** (`/war-room`) | **Flagship.** Autonomous 5-agent investigation in plain English. Live agent reasoning, animated RCA timeline, root-cause hypothesis card with confidence + recommended action, one-click AI postmortem, live event stream. |
| 1 | **Executive Dashboard** (`/`) | Engineering Health Score (single-number composite, A–F grade), team & sprint health, KPI strip, latency, integration grid, live event stream |
| 2 | **Incident Investigator** (`/incidents`) | NL incident analysis, root-cause detection, error correlation, animated timeline, AI postmortems |
| 3 | **Sprint Health Analyzer** (`/sprint`) | Task completion, blockers, PR review bottlenecks, velocity, team load |
| 4 | **Release Readiness** (`/release`) | Deploy risk scoring, pre-flight checks, recent deploys |
| 5 | **Security Center** (`/security`) | Secret leaks, CVEs, compliance posture |
| 6 | **AI Engineering Chat** (`/chat`) | Multi-source conversational reasoning |
| 7 | **Engineering Analytics** (`/analytics`) | DORA: MTTR, deploy freq, lead/cycle time, incident trends |
| 8 | **Multi-Agent System** (`/agents`) | GitHub · Slack · Sentry · Datadog · Security · Report · Orchestrator |
| 🪸 | **Executive Copilot** *(floating)* | Persistent floating chat available on every page. Asks Coral across all 7 sources and returns leadership-grade summaries with KPI tiles. |

### Hackathon-winning showpieces

- **🎤 Ask Coral Anything** (`/demo`) — full-screen landing demo. Type a question → 5 agents stream their findings character-by-character → root cause + confidence + RCA timeline + Coral SQL + investigation replay all reveal at once. **This is the judge-facing front door.**
- **Coral Query Visualizer** — every agent step exposes the actual federated SQL it ran. Tabs: **SQL** (syntax-highlighted with source tokens), **Plan** (animated step-by-step executor), **Pipeline** (source→planner→executor→result diagram with flowing particles), **Result** (the actual rows). This is what makes Coral's value prop unmistakable.
- **Confidence Meter** — explainable, evidence-weighted root cause score. Each source's contribution shown as a bar (GitHub 40% · Sentry 25% · Datadog 20% · Slack 9% · Other 6%) with per-source confidence and a note explaining what it found.
- **Investigation Replay** — VCR-style scrubber that reconstructs the cross-source story step-by-step at 1×/2×/4× speed. Animated playhead, clickable timeline dots, source-colored event card with weight.
- **Autonomous Investigation** — `/war-room` 5-agent flow with each agent's *thought*, tool call, latency, findings, and "View Coral SQL" expander.
- **Animated RCA Timeline** — horizontal rail with source-colored nodes and pulse highlights.
- **AI Postmortem Generator** — one-click streaming dialog (Summary → Timeline → Root Cause → Impact → Resolution → Action Items).
- **Engineering Health Score** — single 0–100 composite with A–F grade.
- **Live Event Stream** — right-side panel: PRs, deploys, errors, incidents, rollbacks in real time.
- **Executive Copilot** — floating multi-source chat available on every page.

---

## 🎤 2-minute demo script

Open <http://localhost:3000/demo>.

| Time | Action | What to say |
|------|--------|-------------|
| 0:00 | Show `/demo` landing | *"Engineering teams spend hours connecting dots across GitHub, Slack, Sentry, Datadog. Coral does it in seconds. Ask anything."* |
| 0:10 | Type: **"Why did checkout fail yesterday?"** Press Enter | *"Coral dispatches 5 specialist agents in parallel."* |
| 0:15 | Streaming traces appear, characters type live | *"Each agent investigates its source — GitHub finds the suspicious PR, Sentry sees the error spike, Datadog catches the latency jump, Slack finds the rollback discussion."* |
| 0:40 | Reveal phase animates in | *"Coral synthesizes a root cause with 94% confidence."* |
| 0:50 | Point at **Confidence Meter** | *"Explainable — every source contributes a weighted vote. GitHub 40%, Sentry 25%…"* |
| 1:05 | Point at **RCA Timeline** | *"Cross-source timeline: 14:14 PR merged, 14:16 deploy, 14:20 error spike, 14:23 rollback discussion, 14:34 rollback — assembled from 4 separate APIs."* |
| 1:25 | Click into **Coral Query Visualizer** tabs | *"This is the federated SQL Coral generated. JOIN across sentry.issues, github.deployments, datadog.metrics, slack.messages — in one query. Here's the execution plan. Here's the actual result rows."* |
| 1:50 | Click **▶ Play** on **Investigation Replay** | *"Replay the incident at 2× speed — every agent's finding reconstructed chronologically."* |
| 2:10 | Click **Generate Postmortem** | *"And one click → exec-ready postmortem in markdown."* |
| 2:30 | Navigate to `/war-room` then `/` | *"War Room for live ops. Dashboard rolls up the Engineering Health Score across the org. Floating Executive Copilot is on every page for leadership questions."* |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Next.js 15 App Router (RSC + Client Components)                     │
│  ├── /app/*           Pages & API routes                              │
│  ├── /components/*    UI (shadcn), widgets, charts, layout            │
│  └── /lib                                                             │
│       ├── coral/      Federated SQL + multi-agent client              │
│       ├── mock/       In-memory federated dataset (dev/demo)          │
│       └── types.ts    Domain model shared across UI + agents          │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                ┌──────────────────────────────────┐
                │     Coral Protocol Runtime       │
                │  ┌────────────────────────────┐  │
                │  │  Federated SQL Planner     │  │
                │  └────────────────────────────┘  │
                │  ┌────────────────────────────┐  │
                │  │  Multi-Agent Orchestrator  │  │
                │  └────────────────────────────┘  │
                └──────────────────────────────────┘
                                  │
        ┌────────┬────────┬────────┼────────┬────────┬────────┐
        ▼        ▼        ▼        ▼        ▼        ▼        ▼
     GitHub   Slack   Sentry   Datadog   Jira   Notion  PagerDuty
```

### Coral as the data layer

All cross-source joins, SQL queries, and agent tool calls flow through
`src/lib/coral/client.ts`. In production it wraps `@coral-protocol/sdk`;
in dev/demo mode it executes against the in-memory federated dataset
(`src/lib/mock/dataset.ts`) with the **identical contract**.

```ts
import { coral } from "@/lib/coral/client";

// Federated SQL across sources
const { rows } = await coral.sql(`
  SELECT i.*, d.version
  FROM incidents i
  JOIN github.deployments d ON d.service = i.service
  WHERE i.status = :status
`, { status: "investigating" });

// Multi-agent reasoning
const res = await coral.agent("orchestrator",
  "Why did checkout-api start failing at 14:00 UTC?"
);

// Live stream
coral.stream(["incident.new", "deploy.update"], (e) => console.log(e));
```

---

## Getting started

```bash
cd command-center
npm install
cp .env.example .env.local   # add Coral + source keys for production
npm run dev
```

Open <http://localhost:3000>.

In demo mode no keys are required — the Coral client falls back to the
in-memory federated dataset, so every page renders with realistic data.

---

## Project structure

```
command-center/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # root layout + sidebar + topbar
│   │   ├── page.tsx                # /  Executive Dashboard
│   │   ├── incidents/page.tsx      # Incident Investigator
│   │   ├── sprint/page.tsx         # Sprint Health Analyzer
│   │   ├── release/page.tsx        # Release Readiness
│   │   ├── security/page.tsx       # Security Center
│   │   ├── analytics/page.tsx      # Engineering Analytics
│   │   ├── chat/page.tsx           # AI Engineering Chat
│   │   ├── agents/page.tsx         # Multi-Agent System
│   │   ├── globals.css
│   │   └── api/
│   │       ├── coral/query/route.ts
│   │       ├── coral/agent/route.ts
│   │       ├── incidents/route.ts
│   │       ├── deployments/route.ts
│   │       └── security/route.ts
│   ├── components/
│   │   ├── layout/    (sidebar, top-bar, page-shell)
│   │   ├── ui/        (shadcn primitives)
│   │   ├── widgets/   (metric-card, health-ring, severity-badge, source-icon, integration-grid)
│   │   └── charts/    (animated area/bar/line)
│   └── lib/
│       ├── coral/client.ts         # 🪸 Coral SDK abstraction
│       ├── mock/dataset.ts         # in-memory federated executor
│       ├── mock/fixtures.ts        # realistic demo data
│       ├── types.ts                # domain model
│       └── utils.ts
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── package.json
```

---

## Design system

- **Theme**: Dark futuristic with a teal/cyan primary + coral accents.
- **Cards**: Glassmorphism — `backdrop-blur-xl` + subtle inner highlights.
- **Charts**: Recharts with animated draw-in + gradient fills.
- **Motion**: Framer Motion for staggered list entries, layout-animated nav,
  shared element transitions, and pulse glows on live elements.
- **Typography**: System UI sans + monospace for IDs/metrics/timestamps.
- **Accessibility**: Focus rings preserved, semantic HTML, ARIA via Radix.

---

## Replacing the demo Coral client

Swap the implementation of `src/lib/coral/client.ts` to call the real
Coral runtime — the contract (`sql`, `agent`, `stream`) is stable.

```ts
import { CoralClient } from "@coral-protocol/sdk";
const c = new CoralClient({ apiKey: process.env.CORAL_API_KEY! });

export const coral = {
  sql: (q, p) => c.sql(q, p),
  agent: (name, prompt, ctx) => c.agents[name].invoke({ prompt, context: ctx }),
  stream: (topics, cb) => c.subscribe(topics, cb),
  agents: c.agentRegistry,
};
```
