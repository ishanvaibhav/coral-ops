"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/widgets/source-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentMessage, AgentName, IntegrationSource } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Why did checkout-api start failing at 14:00 UTC?",
  "Summarize all PRs Priya touched this sprint",
  "Find any leaked secrets in the last 7 days",
  "What's the p99 latency trend on api-gateway?",
  "Generate a Friday status report for leadership",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "m0",
      role: "system",
      content: "Coral multi-agent runtime online. Connected to GitHub, Slack, Sentry, Datadog, Jira, Notion, PagerDuty.",
      ts: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    setInput("");
    const userMsg: AgentMessage = { id: `m${Date.now()}`, role: "user", content, ts: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);

    // Simulate orchestrator + agent steps
    await new Promise((r) => setTimeout(r, 600));

    const agentsHit: AgentName[] = pickAgents(content);
    for (const a of agentsHit) {
      await new Promise((r) => setTimeout(r, 500));
      setMessages((m) => [...m, {
        id: `m${Date.now()}-${a}`,
        role: "tool",
        agent: a,
        content: agentToolText(a, content),
        ts: new Date().toISOString(),
      }]);
    }

    await new Promise((r) => setTimeout(r, 700));
    const finalMsg: AgentMessage = {
      id: `m${Date.now()}-final`,
      role: "agent",
      agent: "orchestrator",
      content: composeAnswer(content, agentsHit),
      ts: new Date().toISOString(),
      sources: agentsHit.flatMap(agentSources),
    };
    setMessages((m) => [...m, finalMsg]);
    setThinking(false);
  };

  return (
    <PageShell
      title="AI Engineering Chat"
      subtitle="Conversational interface backed by Coral's multi-agent runtime. Query all connected tools and reason across them."
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        <Card className="h-[calc(100vh-220px)] flex flex-col">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Conversation</CardTitle>
            <CardDescription>Coral orchestrator routes intent to specialist agents and composes the answer.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
                {thinking && <ThinkingIndicator />}
              </AnimatePresence>
            </div>

            <div className="border-t border-white/10 p-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything across your engineering stack…"
                  className="flex-1"
                  disabled={thinking}
                />
                <Button type="submit" disabled={thinking || !input.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-xs glass rounded-md p-2.5 hover:bg-white/[0.06] transition"
                >
                  {s}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active sources</CardTitle>
              <CardDescription>Routed by Coral planner</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(["github","slack","sentry","datadog","jira","notion","pagerduty"] as IntegrationSource[]).map(s => (
                <div key={s} className="flex items-center gap-1.5 text-xs">
                  <SourceIcon source={s} size={18} />
                  <span className="capitalize">{s}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function MessageBubble({ msg }: { msg: AgentMessage }) {
  if (msg.role === "system") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[11px] text-center text-muted-foreground font-mono"
      >
        — {msg.content} —
      </motion.div>
    );
  }
  if (msg.role === "tool") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-3 ml-10"
      >
        <div className="h-6 w-6 rounded-md bg-white/[0.05] border border-white/10 grid place-items-center text-[9px] font-mono uppercase text-cyan-400">
          {msg.agent?.slice(0, 2)}
        </div>
        <div className="flex-1 glass rounded-md p-2.5 text-xs font-mono text-muted-foreground">
          <span className="text-cyan-400">[{msg.agent}]</span> {msg.content}
        </div>
      </motion.div>
    );
  }
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      <div className={cn(
        "h-8 w-8 rounded-md grid place-items-center shrink-0",
        isUser ? "bg-gradient-to-br from-cyan-500 to-purple-500" : "bg-gradient-to-br from-coral-500 to-amber-500"
      )}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-black" />}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-lg p-3 text-sm",
        isUser ? "bg-primary/10 border border-primary/20" : "glass"
      )}>
        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-1.5">
            {msg.sources.map((s, i) => (
              <Badge key={i} variant="secondary" className="!normal-case">
                <SourceIcon source={s.source} size={12} className="mr-1" />
                {s.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ThinkingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs text-muted-foreground ml-11">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-cyan-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      orchestrator planning…
    </motion.div>
  );
}

function pickAgents(q: string): AgentName[] {
  const lc = q.toLowerCase();
  const agents: AgentName[] = [];
  if (/pr|commit|repo|deploy|merge|code/.test(lc)) agents.push("github");
  if (/error|exception|crash|stacktrace|sentry/.test(lc)) agents.push("sentry");
  if (/latency|metric|trace|p99|p95|datadog/.test(lc)) agents.push("datadog");
  if (/discuss|channel|message|slack|thread/.test(lc)) agents.push("slack");
  if (/secret|cve|vulnerab|leak|security/.test(lc)) agents.push("security");
  if (/report|summary|postmortem|status/.test(lc)) agents.push("report");
  if (agents.length === 0) agents.push("github", "sentry", "datadog");
  return agents.slice(0, 4);
}

function agentToolText(a: AgentName, q: string) {
  const map: Record<AgentName, string> = {
    orchestrator: "planning sub-queries",
    github: "search_prs(query) → 12 matches · get_commit(sha) ok",
    slack: "search_messages(channel=#incidents, q) → 8 threads",
    sentry: "list_issues(release=v2.41.0) → 1 grouping · 14,221 events",
    datadog: "query_metric(service:checkout-api,p99) · search_logs ok",
    security: "scan_secrets(repos=all) → 1 finding · list_vulns ok",
    report: "render_report(template=exec_brief)",
  };
  return map[a];
}

function agentSources(a: AgentName): { source: IntegrationSource; label: string }[] {
  const map: Record<AgentName, IntegrationSource[]> = {
    orchestrator: [],
    github: ["github"],
    slack: ["slack"],
    sentry: ["sentry"],
    datadog: ["datadog"],
    security: ["github", "datadog"],
    report: [],
  };
  return map[a].map((s) => ({ source: s, label: `${s} adapter` }));
}

function composeAnswer(q: string, agents: AgentName[]): string {
  const lc = q.toLowerCase();
  if (lc.includes("checkout") || lc.includes("14:00")) {
    return `Based on signals from ${agents.join(", ")}:

The checkout-api regression at 14:00 UTC traces to deploy d_7741 (v2.41.0, PR #3318). The new gRPC PaymentsClient was deployed without an explicit request timeout, which let slow downstream responses saturate the connection pool (50/50 in-flight) by T+6m. Sentry captured 14,221 TimeoutError events under a single grouping, while Datadog p99 latency on /checkout jumped from 320ms to 1.4s. Priya opened PR #3322 to add the missing timeout; canary in progress now.

Want me to draft a postmortem or check whether similar timeouts exist on other gRPC clients?`;
  }
  if (lc.includes("secret") || lc.includes("leak")) {
    return `Security agent found **1 critical** and **2 medium** secret/dependency findings in the last 7 days:

• Stripe live key committed to payments-svc (commit a3f2c1d) — needs immediate rotation.
• libxml2 CVE-2024-31449 (RCE) in go.sum — patch available.
• axios 0.21.1 prototype pollution in frontend — bump to 1.7.x.

I can open Jira tickets and auto-assign to the appropriate code owners.`;
  }
  if (lc.includes("report") || lc.includes("status")) {
    return `**Friday Engineering Status — week of $(today)**

✓ 5.2 deploys/day, MTTR 47m (both elite-tier per DORA)
⚠ 1 active P2 incident (checkout-api) — mitigation in canary
⚠ Sprint 41 trending 18% behind plan; 2 stale PRs blocking 11 points
✓ Security posture stable; 1 critical secret needs rotation (tracked SEC-19)
✓ Team load balanced except Dan (88%) and Priya (92%)

Generated by Coral report agent. Sources: 7. Confidence: 0.86.`;
  }
  return `Synthesized response from ${agents.join(", ")}. The query "${q}" returned ${Math.floor(Math.random()*40)+10} relevant records across sources; see citations below. Want me to drill into a specific source or generate a report?`;
}
