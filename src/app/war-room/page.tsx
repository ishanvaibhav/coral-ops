"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronRight, Pause, Play, Send, Sparkles, Zap } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AgentInvestigation } from "@/components/warroom/agent-investigation";
import { RcaTimeline } from "@/components/warroom/rca-timeline";
import { RootCauseCard } from "@/components/warroom/root-cause-card";
import { LiveEventStream } from "@/components/warroom/live-event-stream";
import { PostmortemDialog } from "@/components/warroom/postmortem-dialog";
import { ConfidenceMeter } from "@/components/warroom/confidence-meter";
import { InvestigationReplay } from "@/components/warroom/investigation-replay";
import { CoralQueryVisualizer } from "@/components/warroom/coral-query-visualizer";
import { runInvestigation, type InvestigationResult, type InvestigationStep } from "@/lib/coral/investigation";
import { queryForAgent } from "@/lib/coral/queries";

const SCENARIOS = [
  "Why is checkout failing?",
  "What broke in the search service?",
  "Did the last deploy cause issues?",
];

export default function WarRoomPage() {
  const [query, setQuery] = useState("");
  const [steps, setSteps] = useState<InvestigationStep[]>([]);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [active, setActive] = useState<string | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [postmortemOpen, setPostmortemOpen] = useState(false);
  const cancelRef = useRef(false);

  const launch = async (q: string) => {
    if (running || !q.trim()) return;
    cancelRef.current = false;
    setQuery(q);
    setSteps([]);
    setResult(null);
    setActive(undefined);
    setRunning(true);

    for await (const evt of runInvestigation(q)) {
      if (cancelRef.current) break;
      if (evt.type === "step_start") {
        setSteps((s) => [...s, evt.step]);
        setActive(evt.step.id);
      } else if (evt.type === "step_finish") {
        setSteps((s) => s.map((x) => (x.id === evt.step.id ? evt.step : x)));
      } else if (evt.type === "complete") {
        setResult(evt.result);
        setActive(undefined);
      }
    }
    setRunning(false);
  };

  // Auto-launch the headline scenario on first mount so judges see action immediately
  useEffect(() => {
    const t = setTimeout(() => launch(SCENARIOS[0]), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = () => { cancelRef.current = true; setRunning(false); };

  return (
    <PageShell
      title="Incident War Room"
      subtitle="Autonomous multi-agent investigation. Ask in plain English — Coral coordinates 5 specialist agents in parallel and assembles a root-cause hypothesis."
      actions={
        <>
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            INC-2041 · {result?.rootCause.affectedUsers.toLocaleString() ?? "12,000"} users
          </Badge>
          <Button size="sm" variant="outline" asChild>
            <Link href="/demo"><Sparkles className="h-3.5 w-3.5" /> Demo Mode</Link>
          </Button>
        </>
      }
    >
      {/* Query bar */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-coral-500/10 pointer-events-none" />
        {running && (
          <motion.div
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
        <CardContent className="relative p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); launch(query); }}
            className="flex flex-col md:flex-row gap-2"
          >
            <div className="flex-1 flex items-center gap-2 glass rounded-lg px-3 py-2">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Ask in plain English — e.g. "Why is checkout failing?"'
                className="bg-transparent flex-1 outline-none text-sm placeholder:text-muted-foreground"
                disabled={running}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={running || !query.trim()}
                className="!shadow-[0_0_20px_rgba(34,211,238,0.4)]"
              >
                {running ? <Pause className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                {running ? "Investigating…" : "Investigate"}
              </Button>
              {running && (
                <Button type="button" variant="outline" onClick={cancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">scenarios</span>
            {SCENARIOS.map((s) => (
              <button
                key={s}
                onClick={() => launch(s)}
                disabled={running}
                className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-cyan-400/30 text-muted-foreground hover:text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Result + investigation + live stream */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 mt-4">
        <div className="space-y-4 min-w-0">
          {/* Root cause hero appears once result is ready */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <RootCauseCard
                  result={result}
                  onPostmortem={() => setPostmortemOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confidence + RCA Timeline side-by-side */}
          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                <ConfidenceMeter confidence={result.rootCause.confidence} />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}>
                <RcaTimeline events={result.timeline} />
              </motion.div>
            </div>
          )}

          {/* Show timeline-only while running */}
          {!result && steps.some(s => s.findings.length > 0) && (
            <RcaTimeline
              events={steps.flatMap(s => s.findings).sort((a, b) =>
                new Date(a.ts).getTime() - new Date(b.ts).getTime()
              )}
            />
          )}

          {/* Investigation Replay */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <InvestigationReplay events={result.timeline} />
            </motion.div>
          )}

          {/* Agent investigation (with per-step SQL expander) */}
          {steps.length > 0 ? (
            <AgentInvestigation steps={steps} activeId={active} />
          ) : (
            <Card className="border-dashed border-white/15">
              <CardContent className="p-10 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-3">
                  <Sparkles className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="text-sm font-semibold">Awaiting investigation</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Type a question above or pick a scenario. Five Coral agents will run in parallel.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Highlight Coral SQL */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <CoralQueryVisualizer query={queryForAgent("datadog")} animate={false} />
            </motion.div>
          )}
        </div>

        {/* Live event stream */}
        <div className="space-y-4">
          <LiveEventStream height={680} />
        </div>
      </div>

      <PostmortemDialog
        open={postmortemOpen}
        onClose={() => setPostmortemOpen(false)}
        result={result}
      />
    </PageShell>
  );
}
