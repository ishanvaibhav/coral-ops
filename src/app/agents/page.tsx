"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Bot, Cpu, Database, FileText, Github, MessageSquare, Shield, Zap } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { coral } from "@/lib/coral/client";
import type { AgentName } from "@/lib/types";

const AGENTS: { name: AgentName; icon: React.ElementType; gradient: string; }[] = [
  { name: "orchestrator", icon: Cpu, gradient: "from-cyan-400 to-blue-500" },
  { name: "github", icon: Github, gradient: "from-zinc-400 to-zinc-600" },
  { name: "slack", icon: MessageSquare, gradient: "from-purple-400 to-pink-500" },
  { name: "sentry", icon: Activity, gradient: "from-violet-400 to-fuchsia-500" },
  { name: "datadog", icon: Database, gradient: "from-indigo-400 to-blue-500" },
  { name: "security", icon: Shield, gradient: "from-emerald-400 to-teal-500" },
  { name: "report", icon: FileText, gradient: "from-amber-400 to-coral-500" },
];

interface AgentLog { id: string; agent: AgentName; text: string; ts: number; }

export default function AgentsPage() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [running, setRunning] = useState<AgentName | null>(null);

  useEffect(() => {
    const seed: AgentLog[] = [
      { id: "l1", agent: "orchestrator", text: "Runtime started · 6 agents registered · 7 sources connected", ts: Date.now() - 8000 },
      { id: "l2", agent: "github", text: "Indexed 18,429 records · last sync 2m ago", ts: Date.now() - 6000 },
      { id: "l3", agent: "datadog", text: "WARN: 612ms p95 latency on metric adapter — degraded", ts: Date.now() - 4000 },
      { id: "l4", agent: "sentry", text: "Subscribed to release-tagged issue groupings", ts: Date.now() - 2000 },
    ];
    setLogs(seed);

    const unsub = coral.stream(["deploy.update", "incident.new", "error.spike", "metric.anomaly"], (e) => {
      setLogs((l) => [...l.slice(-30), {
        id: `l${Date.now()}`,
        agent: agentForSource(e.source),
        text: `event ${e.type} from ${e.source}`,
        ts: Date.now(),
      }]);
    });
    return unsub;
  }, []);

  const runAgent = async (name: AgentName) => {
    setRunning(name);
    setLogs((l) => [...l, { id: `r${Date.now()}`, agent: name, text: `invoke ${name}.run(prompt='probe')`, ts: Date.now() }]);
    const res = await coral.agent(name, "probe");
    setLogs((l) => [
      ...l,
      { id: `r${Date.now()}-1`, agent: name, text: `→ ${res.toolCalls.length} tool calls, confidence ${(res.confidence*100).toFixed(0)}%`, ts: Date.now() },
      { id: `r${Date.now()}-2`, agent: name, text: res.output.slice(0, 140) + (res.output.length > 140 ? "…" : ""), ts: Date.now() },
    ]);
    setRunning(null);
  };

  return (
    <PageShell
      title="Multi-Agent System"
      subtitle="Coral runtime · MCP-style specialist agents · live tool traces and routing."
      actions={<Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" /> all systems nominal</Badge>}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENTS.map((a, i) => {
            const profile = coral.agents[a.name];
            const Icon = a.icon;
            const isRunning = running === a.name;
            return (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-hover h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${a.gradient} grid place-items-center relative`}>
                          <Icon className="h-5 w-5 text-black" />
                          {isRunning && (
                            <div className="absolute inset-0 rounded-lg border-2 border-cyan-400 animate-ping" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="capitalize">{a.name} agent</CardTitle>
                          <CardDescription className="mt-0.5">
                            {profile.tools.length} tools · {profile.sources.length} sources
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={isRunning ? "info" : "success"}>
                        {isRunning ? "running" : "idle"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{profile.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.tools.map((t) => (
                        <code key={t} className="text-[10px] font-mono bg-white/[0.04] border border-white/10 rounded px-1.5 py-0.5">
                          {t}
                        </code>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => runAgent(a.name)}
                      disabled={isRunning}
                    >
                      <Zap className="h-3 w-3" /> {isRunning ? "Running…" : "Invoke"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className="h-fit xl:sticky xl:top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Live Agent Trace</CardTitle>
            <CardDescription>Real-time tool calls and stream events</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-1.5 font-mono text-[11px]">
                {logs.slice().reverse().map((l) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-muted-foreground tabular-nums shrink-0">
                      {new Date(l.ts).toLocaleTimeString("en-US", { hour12: false }).slice(3)}
                    </span>
                    <span className="text-cyan-400 shrink-0">[{l.agent}]</span>
                    <span className="text-muted-foreground">{l.text}</span>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function agentForSource(src: string): AgentName {
  if (src === "github") return "github";
  if (src === "slack") return "slack";
  if (src === "sentry") return "sentry";
  if (src === "datadog") return "datadog";
  return "orchestrator";
}
