"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Database, FileText, Play, Radar, Send, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/widgets/source-icon";
import { StreamingAgentTrace, type StreamedStep } from "@/components/warroom/streaming-agent-trace";
import { CoralQueryVisualizer } from "@/components/warroom/coral-query-visualizer";
import { ConfidenceMeter } from "@/components/warroom/confidence-meter";
import { RcaTimeline } from "@/components/warroom/rca-timeline";
import { InvestigationReplay } from "@/components/warroom/investigation-replay";
import { PostmortemDialog } from "@/components/warroom/postmortem-dialog";
import { runInvestigation, type InvestigationResult } from "@/lib/coral/investigation";
import { queryForAgent, type CoralQuery } from "@/lib/coral/queries";
import type { AgentName } from "@/lib/types";

const HERO_PROMPTS = [
  "Why did checkout fail yesterday?",
  "What broke in the search service?",
  "Did the last deploy cause issues?",
];

const STREAMED_STEPS: StreamedStep[] = [
  { agent: "github",  source: "github",  prefix: "Investigating GitHub…",  result: "Found suspicious PR #3318 (PaymentsClient gRPC rewrite)", metric: "merged 46m ago" },
  { agent: "sentry",  source: "sentry",  prefix: "Investigating Sentry…",  result: "Error spike detected — TimeoutError grouping", metric: "+2,300% events" },
  { agent: "datadog", source: "datadog", prefix: "Investigating Datadog…", result: "Latency increase found — p99 320ms → 1.4s", metric: "+340%" },
  { agent: "slack",   source: "slack",   prefix: "Investigating Slack…",   result: "Rollback discussion located in #incidents", metric: "14 messages" },
  { agent: "report",  source: undefined, prefix: "Synthesizing report…",   result: "Root cause generated — PR #3318, confidence 94%", metric: "5 agents" },
];

const QUERY_SEQUENCE: AgentName[] = ["github", "sentry", "datadog", "slack", "report"];

export default function DemoPage() {
  const [phase, setPhase] = useState<"idle" | "streaming" | "reveal">("idle");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [activeQueryIdx, setActiveQueryIdx] = useState(0);
  const [postmortemOpen, setPostmortemOpen] = useState(false);
  const investigationStarted = useRef(false);

  const launch = (text: string) => {
    if (phase !== "idle") return;
    setQuery(text);
    setPhase("streaming");

    // Run the actual investigation in the background to populate timeline + result
    if (!investigationStarted.current) {
      investigationStarted.current = true;
      (async () => {
        for await (const evt of runInvestigation(text)) {
          if (evt.type === "complete") setResult(evt.result);
        }
      })();
    }
  };

  // Rotate query visualizer through agent queries during reveal
  useEffect(() => {
    if (phase !== "reveal") return;
    const id = setInterval(() => {
      setActiveQueryIdx((i) => (i + 1) % QUERY_SEQUENCE.length);
    }, 4500);
    return () => clearInterval(id);
  }, [phase]);

  const reset = () => {
    setPhase("idle");
    setQuery("");
    setResult(null);
    setActiveQueryIdx(0);
    investigationStarted.current = false;
  };

  return (
    <div className="relative min-h-full">
      {/* Animated background grid */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-coral-500/[0.05] pointer-events-none" />

      {/* PHASE 1 — Idle hero */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6 py-12"
          >
            {/* Logo + tagline */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-300 to-coral-400 grid place-items-center">
                  <Radar className="h-8 w-8 text-black" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-cyan-400"
                  animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="absolute inset-0 rounded-2xl bg-cyan-400 blur-2xl opacity-30 -z-10" />
              </div>
              <Badge variant="info" className="mb-3 !normal-case">
                <Sparkles className="h-3 w-3 mr-1" /> Powered by Coral Protocol
              </Badge>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-center">
                Ask Coral <span className="gradient-text">Anything</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mt-4 text-center max-w-xl">
                Federated SQL + autonomous agents across GitHub, Slack, Sentry,
                Datadog, Jira, Notion, and PagerDuty.
              </p>
            </motion.div>

            {/* Source row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-2 mt-6 flex-wrap justify-center"
            >
              {(["github","slack","sentry","datadog","jira","notion","pagerduty"] as const).map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05, type: "spring" }}
                  className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5"
                >
                  <SourceIcon source={s} size={16} />
                  <span className="text-xs capitalize">{s}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </motion.div>
              ))}
            </motion.div>

            {/* Big input */}
            <motion.form
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              onSubmit={(e) => { e.preventDefault(); launch(query || HERO_PROMPTS[0]); }}
              className="w-full max-w-2xl mt-10 relative"
            >
              <div className="glass rounded-2xl p-2 flex items-center gap-2 border-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
                <Sparkles className="h-5 w-5 text-cyan-400 ml-3 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Why did checkout fail yesterday?"
                  className="bg-transparent flex-1 outline-none text-base md:text-lg py-3 placeholder:text-muted-foreground/70"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="!shadow-[0_0_20px_rgba(34,211,238,0.4)] !px-5"
                >
                  <Send className="h-4 w-4" /> Ask
                </Button>
              </div>

              {/* Suggested prompts */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {HERO_PROMPTS.map((p, i) => (
                  <motion.button
                    key={p}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.06 }}
                    onClick={() => launch(p)}
                    className="text-sm px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-cyan-500/10 hover:border-cyan-400/40 hover:text-cyan-400 transition group"
                  >
                    <span className="text-muted-foreground group-hover:text-cyan-400 transition mr-1">›</span>
                    {p}
                  </motion.button>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-center mt-8 text-xs text-muted-foreground"
              >
                Press <kbd className="font-mono border border-white/10 rounded px-1.5 py-0.5">Enter</kbd> to start the multi-agent investigation
              </motion.div>
            </motion.form>

            {/* Footer nav */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 text-xs"
            >
              <Link href="/" className="text-muted-foreground hover:text-foreground transition">
                Skip to dashboard →
              </Link>
            </motion.div>
          </motion.div>
        )}

        {/* PHASE 2 — Streaming */}
        {phase === "streaming" && (
          <motion.div
            key="streaming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-3xl mx-auto px-6 py-12"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-6"
            >
              <Badge variant="info" className="mb-3 !normal-case">
                <Sparkles className="h-3 w-3 mr-1" /> Coral orchestrator running
              </Badge>
              <div className="text-2xl font-semibold">{query || HERO_PROMPTS[0]}</div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                5 agents dispatched in parallel · streaming results
              </div>
            </motion.div>

            <StreamingAgentTrace
              steps={STREAMED_STEPS}
              running={true}
              stepDelay={400}
              typeSpeed={16}
              onComplete={() => {
                setTimeout(() => setPhase("reveal"), 800);
              }}
            />
          </motion.div>
        )}

        {/* PHASE 3 — Reveal (the full payoff) */}
        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-4"
          >
            {/* Hero answer banner */}
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-coral-500/15 via-amber-500/10 to-cyan-500/15 pointer-events-none" />
                <CardContent className="relative p-6">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div>
                      <Badge variant="info" className="mb-2 !normal-case">
                        <Sparkles className="h-3 w-3 mr-1" /> Coral · root cause identified
                      </Badge>
                      <div className="text-xl md:text-2xl font-semibold max-w-3xl">
                        {result?.rootCause.summary ??
                          "Deploy v2.41.0 (PR #3318) removed the default gRPC deadline on PaymentsClient, saturating the connection pool and causing 502s on /checkout."}
                      </div>
                    </div>
                    <div className="ml-auto flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPostmortemOpen(true)}
                      >
                        <FileText className="h-3.5 w-3.5" /> Postmortem
                      </Button>
                      <Button size="sm" onClick={reset} variant="outline">
                        <Play className="h-3.5 w-3.5" /> New question
                      </Button>
                      <Button size="sm" asChild className="!bg-coral-500 !text-white hover:!bg-coral-600">
                        <Link href="/war-room">
                          Open War Room <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Confidence + RCA timeline */}
            <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <ConfidenceMeter confidence={result?.rootCause.confidence ?? 0.94} />
              </motion.div>
              {result && (
                <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <RcaTimeline events={result.timeline} />
                </motion.div>
              )}
            </div>

            {/* Coral Query Visualizer + Replay */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <Database className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Coral Query · agent {QUERY_SEQUENCE[activeQueryIdx]}</span>
                  <div className="ml-auto flex gap-1">
                    {QUERY_SEQUENCE.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveQueryIdx(i)}
                        className={`h-1.5 rounded-full transition-all ${i === activeQueryIdx ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
                      />
                    ))}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeQueryIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CoralQueryVisualizer query={queryForAgent(QUERY_SEQUENCE[activeQueryIdx])} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {result && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <InvestigationReplay events={result.timeline} />
                </motion.div>
              )}
            </div>

            {/* CTA strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2"
            >
              {[
                { href: "/war-room",  label: "Open War Room",          desc: "Full investigation interface" },
                { href: "/",          label: "Engineering Dashboard",  desc: "Composite health score + KPIs" },
                { href: "/analytics", label: "DORA Analytics",         desc: "MTTR, lead time, deploy freq" },
              ].map((c, i) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="glass rounded-lg p-4 flex items-center gap-3 hover:bg-white/[0.06] transition group"
                >
                  <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold group-hover:text-cyan-400 transition">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.desc}</div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-cyan-400 transition" />
                </Link>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PostmortemDialog
        open={postmortemOpen}
        onClose={() => setPostmortemOpen(false)}
        result={result}
      />
    </div>
  );
}
