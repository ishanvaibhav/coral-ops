"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/widgets/source-icon";
import type { IntegrationSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: string;
  sources?: IntegrationSource[];
  highlights?: { label: string; value: string; tone: "good" | "warn" | "bad" | "neutral" }[];
}

const PROMPTS = [
  "What should leadership know today?",
  "Are we on track to ship this sprint?",
  "Any active incidents I should care about?",
  "Summarize this week's security posture",
];

export function ExecutiveCopilot() {
  const [open, setOpen] = useState(false);
  const [bumped, setBumped] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{
    id: "m0",
    role: "assistant",
    content: "I'm your Executive Copilot. I read across all 7 connected sources via Coral and give you the leadership-grade summary in seconds.",
    ts: new Date().toISOString(),
  }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Attention pulse after 6s
  useEffect(() => {
    const t = setTimeout(() => setBumped(true), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: "user", content, ts: new Date().toISOString() }]);
    setThinking(true);
    await new Promise((r) => setTimeout(r, 1100 + Math.random() * 600));
    setMessages((m) => [...m, generateReply(content)]);
    setThinking(false);
  };

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        onClick={() => { setOpen((o) => !o); setBumped(false); }}
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full grid place-items-center text-black shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all",
          "bg-gradient-to-br from-cyan-400 via-cyan-300 to-coral-400 hover:scale-105"
        )}
        aria-label="Open Executive Copilot"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span key="b" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
              <Sparkles className="h-5 w-5" />
              {bumped && (
                <motion.span
                  className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-coral-500 border-2 border-background"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] sm:w-[420px] max-h-[70vh] glass rounded-2xl border border-white/15 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <div className="shrink-0 border-b border-white/10 p-3 flex items-center gap-2.5">
              <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-cyan-400 to-coral-400 grid place-items-center">
                <Bot className="h-4 w-4 text-black" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-background animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Executive Copilot</div>
                <div className="text-[10px] text-muted-foreground">Coral · cross-source reasoning</div>
              </div>
              <Badge variant="info" className="!normal-case">7 sources</Badge>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((m) => <CopilotMessage key={m.id} msg={m} />)}
                {thinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs text-muted-foreground ml-1">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                    consulting agents…
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.slice(0, 2).map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-[10px] px-2 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask in plain English…"
                  className="flex-1 h-8 text-xs"
                  disabled={thinking}
                />
                <Button type="submit" size="sm" disabled={thinking || !input.trim()}>
                  <Send className="h-3 w-3" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CopilotMessage({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="bg-primary/15 border border-primary/30 rounded-lg rounded-tr-sm px-3 py-2 text-xs max-w-[85%]">
          {msg.content}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
      <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-400 to-coral-400 grid place-items-center shrink-0">
        <Sparkles className="h-3 w-3 text-black" />
      </div>
      <div className="flex-1 glass rounded-lg rounded-tl-sm p-3 text-xs leading-relaxed space-y-2">
        <div className="whitespace-pre-wrap">{msg.content}</div>
        {msg.highlights && (
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/10">
            {msg.highlights.map((h, i) => (
              <div key={i} className="bg-white/[0.03] rounded-md p-2 border border-white/5">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{h.label}</div>
                <div className={cn(
                  "text-sm font-semibold tabular-nums mt-0.5",
                  h.tone === "good" && "text-emerald-400",
                  h.tone === "warn" && "text-amber-400",
                  h.tone === "bad" && "text-coral-400",
                  h.tone === "neutral" && "text-foreground"
                )}>{h.value}</div>
              </div>
            ))}
          </div>
        )}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10">
            <span className="text-[9px] text-muted-foreground mr-1">sources:</span>
            {msg.sources.map((s) => (
              <SourceIcon key={s} source={s} size={14} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function generateReply(q: string): Msg {
  const lc = q.toLowerCase();
  if (/leadership|today|brief|status|summary/.test(lc)) {
    return {
      id: `a${Date.now()}`, role: "assistant", ts: new Date().toISOString(),
      content: "Here's your leadership brief, synthesized across 7 sources:",
      highlights: [
        { label: "Active Incidents", value: "1 high", tone: "warn" },
        { label: "Deploy Success", value: "92%", tone: "good" },
        { label: "Sprint Health", value: "72/100", tone: "warn" },
        { label: "Security Alerts", value: "2 critical", tone: "bad" },
      ],
      sources: ["pagerduty", "github", "jira", "sentry", "datadog"],
    };
  }
  if (/sprint|ship|on track/.test(lc)) {
    return {
      id: `a${Date.now()}`, role: "assistant", ts: new Date().toISOString(),
      content: "Sprint 41 is trending 18% behind plan. Two stale PRs (#3317, #3305) account for 11 points and have waited 36h+ for review. Recommend pairing on review today to unblock.",
      highlights: [
        { label: "Days remaining", value: "7", tone: "neutral" },
        { label: "Behind plan", value: "−18%", tone: "warn" },
      ],
      sources: ["jira", "github", "slack"],
    };
  }
  if (/incident|active|outage/.test(lc)) {
    return {
      id: `a${Date.now()}`, role: "assistant", ts: new Date().toISOString(),
      content: "INC-2041 (checkout-api) is active and being investigated by Priya. Root cause: missing gRPC timeout introduced in v2.41.0. Fix in canary now. ~12k users affected; error rate 4.7%.",
      highlights: [
        { label: "Severity", value: "P2", tone: "warn" },
        { label: "Users impacted", value: "12k", tone: "warn" },
        { label: "Time open", value: "42m", tone: "neutral" },
        { label: "ETA mitigation", value: "~15m", tone: "good" },
      ],
      sources: ["pagerduty", "sentry", "datadog", "slack"],
    };
  }
  if (/security|cve|secret/.test(lc)) {
    return {
      id: `a${Date.now()}`, role: "assistant", ts: new Date().toISOString(),
      content: "Security posture stable but two items need attention this week:\n• Stripe live key committed to payments-svc (critical, needs immediate rotation)\n• libxml2 CVE-2024-31449 (high, patch available)\n\nCompliance posture: SOC 2 96% · GDPR 88% · PCI 72%.",
      sources: ["github", "datadog"],
    };
  }
  return {
    id: `a${Date.now()}`, role: "assistant", ts: new Date().toISOString(),
    content: `Querying Coral across all sources for "${q}"… I can surface incidents, deploys, security findings, sprint status, and team analytics. Try one of the suggested prompts.`,
    sources: ["github", "slack", "sentry", "datadog", "jira", "pagerduty"],
  };
}
