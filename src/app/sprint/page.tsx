"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Circle, Clock, GitPullRequest, Loader, XCircle } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/widgets/metric-card";
import { AnimatedBarChart } from "@/components/charts/animated-bar";
import { fixtures } from "@/lib/mock/dataset";
import { seriesVelocity, teamMembers } from "@/lib/mock/fixtures";
import { cn } from "@/lib/utils";
import type { SprintTask } from "@/lib/types";

const statusMeta: Record<SprintTask["status"], { icon: React.ElementType; color: string; label: string }> = {
  todo: { icon: Circle, color: "text-muted-foreground", label: "To-do" },
  in_progress: { icon: Loader, color: "text-cyan-400", label: "In progress" },
  in_review: { icon: GitPullRequest, color: "text-violet-400", label: "In review" },
  blocked: { icon: AlertCircle, color: "text-coral-400", label: "Blocked" },
  done: { icon: CheckCircle2, color: "text-emerald-400", label: "Done" },
};

export default function SprintPage() {
  const completed = fixtures.sprintTasks.filter((t) => t.status === "done");
  const blocked = fixtures.sprintTasks.filter((t) => t.status === "blocked");
  const inReview = fixtures.sprintTasks.filter((t) => t.status === "in_review");
  const total = fixtures.sprintTasks.reduce((s, t) => s + t.points, 0);
  const done = completed.reduce((s, t) => s + t.points, 0);

  const stalePRs = fixtures.pullRequests.filter((p) => p.reviewWaitHours > 24);

  return (
    <PageShell
      title="Sprint Health Analyzer"
      subtitle="Sprint 41 · Day 7 of 14 · Tracking completion, blockers, and review bottlenecks across Jira + GitHub."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Sprint Progress" value={`${done}/${total}`} unit="pts" trend={-8} accent="amber" sub="behind plan" />
        <MetricCard label="Completion Rate" value={`${Math.round((done / total) * 100)}%`} trend={-12} accent="cyan" sub="target 70%" />
        <MetricCard label="Blockers" value={blocked.length} trend={100} accent="coral" sub="needs unblock" />
        <MetricCard label="Stale PRs" value={stalePRs.length} trend={50} accent="violet" sub=">24h wait" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Velocity — last 8 sprints</CardTitle>
            <CardDescription>Planned vs completed story points. Current sprint trending below team avg.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedBarChart
              data={seriesVelocity}
              xKey="sprint"
              height={240}
              legend
              series={[
                { key: "planned", color: "rgba(255,255,255,0.2)", label: "planned" },
                { key: "completed", color: "#22d3ee", label: "completed" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Load</CardTitle>
            <CardDescription>WIP weighted by point complexity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 grid place-items-center text-[10px] font-semibold">
                      {m.avatar}
                    </div>
                    <span>{m.name}</span>
                  </div>
                  <span className={cn("font-mono", m.load >= 85 ? "text-coral-400" : m.load >= 70 ? "text-amber-400" : "text-muted-foreground")}>
                    {m.load}%
                  </span>
                </div>
                <Progress
                  value={m.load}
                  indicatorClassName={cn(
                    m.load >= 85 ? "bg-coral-500" : m.load >= 70 ? "bg-amber-500" : "bg-cyan-500"
                  )}
                />
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Sprint Board</CardTitle>
            <CardDescription>Aggregated from Jira via Coral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {fixtures.sprintTasks.map((t, i) => {
                const Meta = statusMeta[t.status];
                const Icon = Meta.icon;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass rounded-lg p-3 flex items-start gap-3"
                  >
                    <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", Meta.color, t.status === "in_progress" && "animate-spin")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">{t.key}</span>
                        <Badge variant="secondary">{t.points} pts</Badge>
                        {t.ageDays > 3 && <Badge variant="warning"><Clock className="h-2.5 w-2.5 mr-1" />{t.ageDays}d old</Badge>}
                      </div>
                      <div className="text-sm mt-0.5 truncate">{t.title}</div>
                      {t.blockers.length > 0 && (
                        <div className="text-[11px] text-coral-400 mt-1 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          blocked: {t.blockers.join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{t.assignee}</div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PR Review Bottlenecks</CardTitle>
            <CardDescription>Stale PRs blocking merge throughput</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {fixtures.pullRequests.map((pr, i) => (
              <motion.div
                key={pr.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-violet-400" />
                  <span className="font-mono text-[11px] text-muted-foreground">{pr.repo}#{pr.number}</span>
                  <Badge variant={pr.status === "review" ? "warning" : "secondary"}>{pr.status}</Badge>
                  {pr.reviewWaitHours > 24 && <Badge variant="destructive">stale {Math.floor(pr.reviewWaitHours)}h</Badge>}
                </div>
                <div className="text-sm mt-1">{pr.title}</div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span>{pr.author}</span>
                  <span>·</span>
                  <span className="text-emerald-400">+{pr.additions}</span>
                  <span className="text-coral-400">−{pr.deletions}</span>
                  <span>·</span>
                  <span>{pr.reviewers.length === 0 ? "no reviewer" : `${pr.reviewers.length} reviewers`}</span>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>AI Sprint Insights</CardTitle>
          <CardDescription>Coral correlated PRs, tasks, and team load to surface risks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            { color: "coral", text: "Sprint is 18% behind plan. Two large in-review PRs (#3317, #3305) account for 11 of those points and have waited 36h+ for review." },
            { color: "amber", text: "Dan Stein is at 88% load with 1 blocker (SEC-19 awaiting finance). Consider reassigning NOT-12 to free capacity." },
            { color: "cyan", text: "Priya is rotating between PAY-412 and INC-2041; pairing Marcus on review could land both within sprint." },
            { color: "emerald", text: "OBS-77 closed early — Marcus has headroom to absorb a 3-point task." },
          ].map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                "glass rounded-md p-3 border-l-2",
                tip.color === "coral" && "border-coral-500",
                tip.color === "amber" && "border-amber-500",
                tip.color === "cyan" && "border-cyan-500",
                tip.color === "emerald" && "border-emerald-500"
              )}
            >
              {tip.text}
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
