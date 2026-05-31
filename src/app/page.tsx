"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  GitCommit,
  Rocket,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageShell } from "@/components/layout/page-shell";
import { MetricCard } from "@/components/widgets/metric-card";
import { HealthRing } from "@/components/widgets/health-ring";
import { IntegrationGrid } from "@/components/widgets/integration-grid";
import { EngineeringHealthScore } from "@/components/widgets/engineering-health-score";
import { LiveEventStream } from "@/components/warroom/live-event-stream";
import { Siren } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/widgets/severity-badge";
import { SourceIcon } from "@/components/widgets/source-icon";
import { AnimatedAreaChart } from "@/components/charts/animated-area";
import { AnimatedBarChart } from "@/components/charts/animated-bar";
import { fixtures } from "@/lib/mock/dataset";
import { seriesDeployFreq, seriesLatency } from "@/lib/mock/fixtures";
import { formatRelative } from "@/lib/utils";

export default function DashboardPage() {
  const activeIncidents = fixtures.incidents.filter(i => i.status !== "resolved");
  const todayDeploys = fixtures.deployments.length;
  const succeeded = fixtures.deployments.filter(d => d.status === "success").length;

  return (
    <PageShell
      title="Engineering Command Center"
      subtitle="Live operational view powered by Coral federated queries across all connected sources."
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href="/war-room"><Siren className="h-3.5 w-3.5" /> War Room</Link>
          </Button>
          <Button size="sm" asChild className="!bg-gradient-to-r !from-cyan-500 !to-coral-500 !text-black hover:!opacity-90 !shadow-[0_0_18px_rgba(34,211,238,0.4)]">
            <Link href="/demo"><Zap className="h-3.5 w-3.5" /> Ask Coral Anything</Link>
          </Button>
        </>
      }
    >
      {/* Engineering Health Score — single-number hero */}
      <EngineeringHealthScore />

      {/* Top metric strip */}
      <div className="mt-4" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Team Health" value="78" unit="/100" trend={-4} accent="cyan" icon={<Users className="h-4 w-4" />} sub="grade B" delay={0.0} />
        <MetricCard label="Sprint Health" value="72" unit="/100" trend={-8} accent="amber" icon={<Activity className="h-4 w-4" />} sub="day 7/14" delay={0.05} />
        <MetricCard label="Active Incidents" value={activeIncidents.length} trend={100} accent="coral" icon={<AlertTriangle className="h-4 w-4" />} sub="1 high · 1 med" delay={0.1} />
        <MetricCard label="Deploys Today" value={`${succeeded}/${todayDeploys}`} trend={12} trendInverted={false} accent="emerald" icon={<Rocket className="h-4 w-4" />} sub="83% success" delay={0.15} />
        <MetricCard label="PR Throughput" value="14" unit="/day" trend={5} accent="violet" icon={<GitCommit className="h-4 w-4" />} sub="median age 6h" delay={0.2} />
      </div>

      {/* Hero row: rings + chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Health Composite
              <Badge variant="info">live</Badge>
            </CardTitle>
            <CardDescription>Computed by Coral across 7 sources</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex gap-6 justify-center flex-wrap">
              <HealthRing score={78} label="TEAM" grade="B" />
              <HealthRing score={72} label="SPRINT" grade="B-" />
            </div>
            <div className="w-full space-y-2 mt-2">
              {[
                { name: "Delivery velocity", val: 82 },
                { name: "Code review flow", val: 64 },
                { name: "Incident response", val: 88 },
                { name: "On-call load", val: 71 },
              ].map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="flex items-center gap-3 text-xs"
                >
                  <span className="w-32 text-muted-foreground">{c.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${c.val}%` }}
                      transition={{ duration: 1, delay: 0.4 + i * 0.08 }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono">{c.val}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              p50/p95/p99 latency — last 24h
              <Badge variant="warning">spike @ 14:00 UTC</Badge>
            </CardTitle>
            <CardDescription>Datadog APM via Coral. Spike correlates with deploy d_7741.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedAreaChart
              data={seriesLatency}
              xKey="hour"
              height={260}
              series={[
                { key: "p50", color: "#22d3ee", label: "p50" },
                { key: "p95", color: "#a78bfa", label: "p95" },
                { key: "p99", color: "#ff5a3c", label: "p99" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Integrations */}
      <div className="mt-4">
        <IntegrationGrid />
      </div>

      {/* Three-col with live stream on right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_340px] gap-4 mt-4 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Active Incidents
              <Link href="/incidents" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                view all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardTitle>
            <CardDescription>Open + investigating, sorted by impact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {fixtures.incidents.slice(0, 3).map((inc) => (
              <Link
                key={inc.id}
                href={`/incidents?id=${inc.id}`}
                className="glass rounded-lg p-3 flex items-start gap-3 hover:bg-white/[0.06] transition group"
              >
                <SourceIcon source={inc.source} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{inc.id}</span>
                    <SeverityBadge severity={inc.severity} />
                    <Badge variant="secondary">{inc.status}</Badge>
                  </div>
                  <div className="text-sm mt-1 truncate group-hover:text-primary transition">{inc.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-3">
                    <span>{inc.service}</span>
                    <span>·</span>
                    <span>{inc.affectedUsers.toLocaleString()} users</span>
                    <span>·</span>
                    <span>{formatRelative(inc.startedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/war-room"><Siren className="h-3.5 w-3.5" /> Investigate in War Room</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Deploys — last 14 days
              <Link href="/release" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                release center <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardTitle>
            <CardDescription>GitHub + CI via Coral. Deploy frequency 5.2/day.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedBarChart
              data={seriesDeployFreq}
              xKey="day"
              height={170}
              stacked
              legend
              series={[
                { key: "deploys", color: "#22d3ee", label: "deploys" },
                { key: "failures", color: "#ff5a3c", label: "failed" },
              ]}
            />
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              {[
                { label: "Lead time", val: "1.4d", trend: "-12%" },
                { label: "Change fail", val: "8.3%", trend: "+1.2%" },
                { label: "MTTR", val: "47m", trend: "-9%" },
              ].map((m) => (
                <div key={m.label} className="glass rounded-md py-2">
                  <div className="text-lg font-semibold tabular-nums">{m.val}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">{m.trend}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <LiveEventStream height={520} intervalMs={3200} />
      </div>

    </PageShell>
  );
}
