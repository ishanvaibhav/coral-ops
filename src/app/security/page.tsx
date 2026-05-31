"use client";

import { motion } from "framer-motion";
import { FileLock, Lock, Shield, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/widgets/metric-card";
import { SeverityBadge } from "@/components/widgets/severity-badge";
import { SourceIcon } from "@/components/widgets/source-icon";
import { Progress } from "@/components/ui/progress";
import { fixtures } from "@/lib/mock/dataset";
import { formatRelative } from "@/lib/utils";

export default function SecurityPage() {
  const f = fixtures.securityFindings;
  const critical = f.filter((x) => x.severity === "critical").length;
  const high = f.filter((x) => x.severity === "high").length;
  const open = f.filter((x) => x.status === "open").length;
  const secrets = f.filter((x) => x.type === "secret_leak");
  const vulns = f.filter((x) => x.type === "vulnerability" || x.type === "dependency");
  const compliance = f.filter((x) => x.type === "compliance");

  const compliances = [
    { name: "SOC 2 Type II", value: 96 },
    { name: "GDPR data handling", value: 88 },
    { name: "PCI DSS scope", value: 72 },
    { name: "Internal SRE policy", value: 84 },
  ];

  return (
    <PageShell
      title="Security Center"
      subtitle="Unified posture across repo, runtime, and dependencies. Real-time scanning via Coral."
      actions={<Button size="sm"><ShieldCheck className="h-3.5 w-3.5" /> Generate audit</Button>}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Critical Findings" value={critical} trend={100} accent="coral" sub="rotate now" icon={<Shield className="h-4 w-4" />} />
        <MetricCard label="High Severity" value={high} trend={0} accent="amber" sub="needs triage" />
        <MetricCard label="Open Findings" value={open} trend={-10} trendInverted accent="cyan" sub="all sources" />
        <MetricCard label="Avg Time-to-Fix" value="2.1d" trend={-20} trendInverted accent="emerald" sub="P1+P2" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-coral-400" /> Secret Leaks</CardTitle>
            <CardDescription>Repository scanning across GitHub orgs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {secrets.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-lg p-3 border-l-2 border-coral-500"
              >
                <div className="flex items-center gap-2">
                  <SourceIcon source={s.source} size={18} />
                  <SeverityBadge severity={s.severity} />
                  <Badge variant="destructive">{s.type.replace("_", " ")}</Badge>
                  <span className="ml-auto text-[10px] text-muted-foreground">{formatRelative(s.detectedAt)}</span>
                </div>
                <div className="text-sm font-medium mt-1.5">{s.title}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">{s.location}</div>
              </motion.div>
            ))}
            {secrets.length === 0 && <div className="text-xs text-muted-foreground">No secrets detected.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileLock className="h-4 w-4 text-amber-400" /> Vulnerabilities</CardTitle>
            <CardDescription>CVEs in dependencies and configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[360px] overflow-y-auto">
            {vulns.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <SourceIcon source={v.source} size={18} />
                  <SeverityBadge severity={v.severity} />
                  {v.cve && <Badge variant="outline" className="font-mono">{v.cve}</Badge>}
                  <span className="ml-auto text-[10px] text-muted-foreground">{formatRelative(v.detectedAt)}</span>
                </div>
                <div className="text-sm font-medium mt-1.5">{v.title}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">{v.location}</div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Posture</CardTitle>
            <CardDescription>Continuous checks via Coral policy engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {compliances.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span>{c.name}</span>
                  <span className="font-mono">{c.value}%</span>
                </div>
                <Progress
                  value={c.value}
                  indicatorClassName={c.value >= 90 ? "bg-emerald-500" : c.value >= 75 ? "bg-cyan-500" : "bg-amber-500"}
                />
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Findings</CardTitle>
            <CardDescription>Policy drift & coverage gaps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {compliance.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <SourceIcon source={c.source} size={18} />
                  <SeverityBadge severity={c.severity} />
                  <span className="ml-auto text-[10px] text-muted-foreground">{formatRelative(c.detectedAt)}</span>
                </div>
                <div className="text-sm font-medium mt-1.5">{c.title}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">{c.location}</div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
