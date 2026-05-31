"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/widgets/metric-card";
import { AnimatedAreaChart } from "@/components/charts/animated-area";
import { AnimatedBarChart } from "@/components/charts/animated-bar";
import { AnimatedLineChart } from "@/components/charts/animated-line";
import { seriesDeployFreq, seriesIncidentTrend, seriesMTTR, seriesVelocity } from "@/lib/mock/fixtures";

export default function AnalyticsPage() {
  return (
    <PageShell
      title="Engineering Analytics"
      subtitle="DORA + flow metrics powered by Coral SQL across GitHub, Jira, Sentry, Datadog, and PagerDuty."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Deploy Frequency" value="5.2" unit="/day" trend={12} accent="cyan" sub="elite" />
        <MetricCard label="Lead Time" value="1.4" unit="d" trend={-12} trendInverted accent="emerald" sub="commit→prod" />
        <MetricCard label="Change Fail Rate" value="8.3" unit="%" trend={1} trendInverted accent="amber" sub="target <5%" />
        <MetricCard label="MTTR" value="47" unit="min" trend={-9} trendInverted accent="violet" sub="P1/P2 weighted" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>MTTR — 12 week trend</CardTitle>
            <CardDescription>Mean time to recovery across all severities</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedAreaChart
              data={seriesMTTR}
              xKey="week"
              series={[{ key: "mttr", color: "#a78bfa", label: "MTTR (min)" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deploy Frequency vs Failures</CardTitle>
            <CardDescription>Last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedBarChart
              data={seriesDeployFreq}
              xKey="day"
              stacked
              legend
              series={[
                { key: "deploys", color: "#22d3ee", label: "deploys" },
                { key: "failures", color: "#ff5a3c", label: "failed" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Cycle Time — Velocity</CardTitle>
            <CardDescription>Planned vs delivered story points per sprint</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedLineChart
              data={seriesVelocity}
              xKey="sprint"
              series={[
                { key: "planned", color: "rgba(255,255,255,0.4)", label: "planned" },
                { key: "completed", color: "#22d3ee", label: "completed" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Trends — 30 days</CardTitle>
            <CardDescription>Stacked by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedBarChart
              data={seriesIncidentTrend.map(d => ({ ...d, day: `D${d.day}` }))}
              xKey="day"
              stacked
              legend
              height={240}
              series={[
                { key: "critical", color: "#ff5a3c", label: "critical" },
                { key: "high", color: "#f59e0b", label: "high" },
                { key: "medium", color: "#22d3ee", label: "medium" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>DORA Performance Tier</CardTitle>
          <CardDescription>Based on Google's research, computed by Coral on rolling 90d window</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Deploy Frequency", value: "Elite", color: "emerald", note: "Multiple per day" },
              { label: "Lead Time", value: "High", color: "cyan", note: "Less than 1 week" },
              { label: "Change Fail Rate", value: "Medium", color: "amber", note: "8.3% (target <5%)" },
              { label: "MTTR", value: "Elite", color: "emerald", note: "Less than 1 hour" },
            ].map((t) => (
              <div key={t.label} className="glass rounded-lg p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.label}</div>
                <div className={`text-2xl font-semibold mt-1 text-${t.color}-400`}>{t.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.note}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
