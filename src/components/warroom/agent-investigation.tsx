"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Bot, CheckCircle2, ChevronDown, Code2, Cpu, Database, FileText, Github, Loader2, MessageSquare, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentName } from "@/lib/types";
import type { InvestigationStep } from "@/lib/coral/investigation";
import { SourceIcon } from "@/components/widgets/source-icon";
import { CoralQueryVisualizer } from "@/components/warroom/coral-query-visualizer";
import { queryForAgent } from "@/lib/coral/queries";
import { cn } from "@/lib/utils";

const AGENT_META: Record<AgentName, { label: string; icon: React.ElementType; color: string }> = {
  orchestrator: { label: "Orchestrator", icon: Cpu, color: "text-cyan-400" },
  github: { label: "GitHub Agent", icon: Github, color: "text-zinc-300" },
  slack: { label: "Slack Agent", icon: MessageSquare, color: "text-purple-400" },
  sentry: { label: "Sentry Agent", icon: Activity, color: "text-violet-400" },
  datadog: { label: "Datadog Agent", icon: Database, color: "text-indigo-400" },
  security: { label: "Security Agent", icon: Shield, color: "text-emerald-400" },
  report: { label: "Report Agent", icon: FileText, color: "text-amber-400" },
};

interface Props {
  steps: InvestigationStep[];
  activeId?: string;
}

export function AgentInvestigation({ steps, activeId }: Props) {
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Autonomous Agent Investigation
        </CardTitle>
        <CardDescription>
          Coral orchestrator coordinates 5 specialist agents · each agent's reasoning streams live below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence initial={false}>
          {steps.map((step, i) => {
            const meta = AGENT_META[step.agent];
            const Icon = meta.icon;
            const isActive = step.id === activeId && step.status === "running";
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "glass rounded-lg p-4 border transition-all",
                  isActive
                    ? "border-cyan-400/40 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
                    : step.status === "success"
                      ? "border-emerald-500/20"
                      : "border-white/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "relative h-9 w-9 rounded-md grid place-items-center shrink-0 border",
                    isActive ? "bg-cyan-500/10 border-cyan-400/40" : "bg-white/[0.04] border-white/10"
                  )}>
                    <Icon className={cn("h-4 w-4", meta.color)} />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-md border-2 border-cyan-400"
                        animate={{ scale: [1, 1.25], opacity: [0.8, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{meta.label}</span>
                      <code className="text-[10px] font-mono bg-white/[0.04] border border-white/10 rounded px-1.5 py-0.5">
                        {step.tool}
                      </code>
                      <span className="ml-auto flex items-center gap-1.5 text-xs">
                        {step.status === "pending" && <span className="text-muted-foreground">queued</span>}
                        {step.status === "running" && (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                            <span className="text-cyan-400">running…</span>
                          </>
                        )}
                        {step.status === "success" && (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-mono">{step.durationMs}ms</span>
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1.5 italic leading-relaxed">
                      <span className="text-cyan-400/70 not-italic">thinking →</span> {step.thought}
                    </p>

                    {step.status === "running" && (
                      <motion.div
                        className="mt-2 h-0.5 bg-white/[0.06] overflow-hidden rounded-full"
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-400 to-coral-400"
                          initial={{ width: "0%" }}
                          animate={{ width: ["0%", "70%", "92%"] }}
                          transition={{ duration: 1.4, ease: "easeOut" }}
                        />
                      </motion.div>
                    )}

                    {step.status === "success" && step.findings.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {step.findings.map((f, j) => (
                          <motion.div
                            key={j}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + j * 0.08 }}
                            className="flex items-start gap-2 bg-white/[0.02] rounded-md p-2 border border-white/5"
                          >
                            <SourceIcon source={f.source} size={16} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium">{f.label}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">{f.detail}</div>
                              <code className="text-[10px] font-mono text-cyan-400/70 mt-1 block truncate">
                                {f.evidence}
                              </code>
                            </div>
                            <div className="text-[10px] text-right shrink-0">
                              <div className="text-muted-foreground">weight</div>
                              <div className="font-mono font-semibold text-primary">{(f.weight * 100).toFixed(0)}%</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {step.status === "success" && step.findings.length === 0 && (
                      <div className="mt-2 text-[11px] text-muted-foreground italic">
                        ✓ no significant signals matched
                      </div>
                    )}

                    {/* Coral query inspector */}
                    {step.status === "success" && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedQuery(expandedQuery === step.id ? null : step.id)}
                          className="text-[10px] font-mono inline-flex items-center gap-1.5 px-2 py-1 rounded border border-cyan-400/20 bg-cyan-500/[0.04] text-cyan-400 hover:bg-cyan-500/10 transition"
                        >
                          <Code2 className="h-3 w-3" />
                          {expandedQuery === step.id ? "Hide" : "View"} Coral SQL
                          <ChevronDown className={cn("h-3 w-3 transition", expandedQuery === step.id && "rotate-180")} />
                        </button>
                        <AnimatePresence>
                          {expandedQuery === step.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="mt-2 overflow-hidden"
                            >
                              <CoralQueryVisualizer query={queryForAgent(step.agent)} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
