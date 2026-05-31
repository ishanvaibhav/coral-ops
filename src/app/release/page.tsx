"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle2, GitMerge, Rocket, ShieldAlert, XCircle } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/widgets/metric-card";
import { fixtures } from "@/lib/mock/dataset";
import { cn, formatRelative } from "@/lib/utils";
import type { Deployment } from "@/lib/types";

function riskColor(score: number) {
  if (score >= 65) return "text-coral-400 border-coral-500/40 bg-coral-500/10";
  if (score >= 40) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
  return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
}

function statusMeta(s: Deployment["status"]) {
  switch (s) {
    case "success": return { icon: CheckCircle2, label: "success", className: "text-emerald-400" };
    case "failed": return { icon: XCircle, label: "failed", className: "text-coral-400" };
    case "rolled_back": return { icon: GitMerge, label: "rolled back", className: "text-coral-400" };
    case "in_progress": return { icon: Activity, label: "in progress", className: "text-cyan-400 animate-pulse" };
  }
}

export default function ReleasePage() {
  const candidate = fixtures.deployments.find((d) => d.status === "in_progress")!;

  const checks = [
    { name: "Unit tests", status: "pass", detail: "1,842 passed in 3m 14s" },
    { name: "Integration tests", status: "pass", detail: "All scenarios green" },
    { name: "Security scan (Snyk)", status: "warn", detail: "1 high-severity (libxml2)" },
    { name: "Active P1 incidents", status: "pass", detail: "0 open" },
    { name: "Service stability (24h)", status: "warn", detail: "checkout-api error rate 4.7%" },
    { name: "Bundle size", status: "pass", detail: "+0.4% vs baseline" },
    { name: "DB migration risk", status: "pass", detail: "Backwards-compatible additive change" },
    { name: "Feature flag rollout", status: "pending", detail: "Defaulted off" },
  ];

  return (
    <PageShell
      title="Release Readiness Checker"
      subtitle="Risk score for the next deploy. Cross-checked against Sentry, Datadog, GitHub CI, and active incidents."
      actions={
        <>
          <Button variant="outline" size="sm"><ShieldAlert className="h-3.5 w-3.5" /> Snapshot</Button>
          <Button size="sm"><Rocket className="h-3.5 w-3.5" /> Promote canary</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Risk Score" value={candidate.riskScore} unit="/100" accent="amber" sub="medium risk" />
        <MetricCard label="Deploys / day" value="5.2" trend={12} accent="cyan" sub="last 14d" />
        <MetricCard label="Change Failure" value="8.3%" trend={1} trendInverted accent="coral" sub="target <5%" />
        <MetricCard label="MTTR" value="47m" trend={-9} trendInverted accent="emerald" sub="last 30d" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card className="xl:col-span-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 to-transparent" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center justify-between">
              Current candidate
              <Badge variant="warning">canary</Badge>
            </CardTitle>
            <CardDescription>{candidate.service} {candidate.version} · PR #{candidate.prNumber}</CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <div className={cn("inline-block px-3 py-2 rounded-lg border text-2xl font-semibold tabular-nums", riskColor(candidate.riskScore))}>
              risk {candidate.riskScore}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="glass rounded-md p-2">
                <div className="text-muted-foreground">Author</div>
                <div className="font-medium">{candidate.author}</div>
              </div>
              <div className="glass rounded-md p-2">
                <div className="text-muted-foreground">Files</div>
                <div className="font-medium">{candidate.changedFiles}</div>
              </div>
              <div className="glass rounded-md p-2">
                <div className="text-muted-foreground">Env</div>
                <div className="font-medium">{candidate.env}</div>
              </div>
              <div className="glass rounded-md p-2">
                <div className="text-muted-foreground">Duration</div>
                <div className="font-medium">{Math.round(candidate.durationSec / 60)}m</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Coral predicts <strong className="text-amber-400">42%</strong> chance of triggering an alert within 30m
              based on similarity to past failed deploys.
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Pre-flight Checks</CardTitle>
            <CardDescription>Aggregated by Coral from CI, Sentry, Datadog, and PagerDuty</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {checks.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-md p-3 flex items-start gap-3"
              >
                <div className={cn(
                  "h-2 w-2 rounded-full mt-1.5 shrink-0",
                  c.status === "pass" && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
                  c.status === "warn" && "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
                  c.status === "pending" && "bg-white/30"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.detail}</div>
                </div>
                <Badge variant={c.status === "pass" ? "success" : c.status === "warn" ? "warning" : "secondary"}>
                  {c.status}
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent Deploys</CardTitle>
          <CardDescription>Last 24h across services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {fixtures.deployments.map((d, i) => {
              const meta = statusMeta(d.status);
              const Icon = meta.icon;
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-lg p-3 flex items-center gap-3"
                >
                  <Icon className={cn("h-4 w-4 shrink-0", meta.className)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{d.service}</span>
                      <span className="font-mono text-muted-foreground">{d.version}</span>
                      <Badge variant="secondary">{d.env}</Badge>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded border font-mono", riskColor(d.riskScore))}>
                        risk {d.riskScore}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      by {d.author} · PR #{d.prNumber} · {formatRelative(d.startedAt)} · {Math.round(d.durationSec / 60)}m
                    </div>
                  </div>
                  <Badge variant={d.status === "success" ? "success" : d.status === "in_progress" ? "info" : "destructive"}>
                    {meta.label}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
