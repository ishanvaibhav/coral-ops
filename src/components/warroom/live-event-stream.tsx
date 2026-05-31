"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, Bell, GitBranch, GitMerge, GitPullRequest,
  MessageSquare, Radio, Rocket, RotateCcw, XCircle, Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SourceIcon } from "@/components/widgets/source-icon";
import { createEventStream, type LiveEvent, type LiveEventKind } from "@/lib/coral/event-stream";
import { cn, formatRelative } from "@/lib/utils";

const KIND_META: Record<LiveEventKind, { icon: React.ElementType; color: string; label: string }> = {
  pr_opened: { icon: GitPullRequest, color: "text-cyan-400", label: "PR Opened" },
  pr_merged: { icon: GitMerge, color: "text-violet-400", label: "PR Merged" },
  deploy_started: { icon: Rocket, color: "text-cyan-400", label: "Deploy Started" },
  deploy_success: { icon: Rocket, color: "text-emerald-400", label: "Deploy Success" },
  deploy_failed: { icon: XCircle, color: "text-coral-400", label: "Deploy Failed" },
  error_spike: { icon: AlertTriangle, color: "text-coral-400", label: "Error Spike" },
  incident_opened: { icon: Bell, color: "text-coral-400", label: "Incident Opened" },
  incident_resolved: { icon: Activity, color: "text-emerald-400", label: "Incident Resolved" },
  rollback: { icon: RotateCcw, color: "text-amber-400", label: "Rollback" },
  alert: { icon: Zap, color: "text-amber-400", label: "Alert" },
  slack_thread: { icon: MessageSquare, color: "text-purple-400", label: "Slack Thread" },
};

interface Props {
  height?: number;
  intervalMs?: number;
  title?: string;
}

export function LiveEventStream({ height = 520, intervalMs, title = "Live Event Stream" }: Props) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const unsub = createEventStream({
      intervalMs,
      onEvent: (e) => setEvents((prev) => [e, ...prev].slice(0, 50)),
    });
    return unsub;
  }, [paused, intervalMs]);

  return (
    <Card className="flex flex-col" style={{ height }}>
      <CardHeader className="shrink-0 border-b border-white/10 pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", paused ? "bg-amber-400" : "bg-emerald-400 animate-ping")} />
              <span className={cn("relative inline-flex rounded-full h-2 w-2", paused ? "bg-amber-400" : "bg-emerald-400")} />
            </span>
            <Radio className="h-3.5 w-3.5" />
            {title}
          </span>
          <button
            onClick={() => setPaused((p) => !p)}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground border border-white/10 rounded px-1.5 py-0.5"
          >
            {paused ? "RESUME" : "PAUSE"}
          </button>
        </CardTitle>
        <CardDescription className="text-[11px]">
          Coral subscription · all 7 sources · {events.length} events buffered
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-1.5">
            <AnimatePresence initial={false}>
              {events.map((e) => {
                const meta = KIND_META[e.kind];
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="glass rounded-md p-2.5 hover:bg-white/[0.06] transition group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={cn(
                        "h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 grid place-items-center shrink-0",
                        meta.color
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            {meta.label}
                          </span>
                          <SourceIcon source={e.source} size={14} />
                          {e.severity && (
                            <Badge variant={
                              e.severity === "critical" || e.severity === "high" ? "destructive" :
                              e.severity === "medium" ? "warning" : "info"
                            }>{e.severity}</Badge>
                          )}
                          <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                            {formatRelative(e.ts)}
                          </span>
                        </div>
                        <div className="text-xs font-medium mt-1 truncate">{e.title}</div>
                        {e.detail && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{e.detail}</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {events.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-8">waiting for events…</div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
