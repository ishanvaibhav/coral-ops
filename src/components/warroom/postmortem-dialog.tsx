"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Download, FileText, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SourceIcon } from "@/components/widgets/source-icon";
import type { InvestigationResult } from "@/lib/coral/investigation";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  result: InvestigationResult | null;
}

interface Section {
  title: string;
  key: "summary" | "timeline" | "root_cause" | "impact" | "resolution" | "actions";
}

const SECTIONS: Section[] = [
  { title: "Summary",     key: "summary" },
  { title: "Timeline",    key: "timeline" },
  { title: "Root Cause",  key: "root_cause" },
  { title: "Impact",      key: "impact" },
  { title: "Resolution",  key: "resolution" },
  { title: "Action Items", key: "actions" },
];

function buildSection(key: Section["key"], r: InvestigationResult): string {
  switch (key) {
    case "summary":
      return `On ${new Date(r.timeline[0]?.ts || Date.now()).toUTCString()}, a regression in the **${r.rootCause.primarySource} ${r.rootCause.primaryRef}** change introduced a fault that impacted **${r.rootCause.affectedUsers.toLocaleString()} users**. The issue was detected, correlated across ${[...new Set(r.timeline.map(t => t.source))].length} sources by Coral, and a mitigation was recommended within minutes.`;
    case "timeline":
      return r.timeline.map(t => `**${clock(t.ts)}** — [${t.source}] ${t.label} · ${t.detail}`).join("\n");
    case "root_cause":
      return `${r.rootCause.summary}\n\nConfidence: **${Math.round(r.rootCause.confidence * 100)}%** (evidence-weighted across ${r.steps.length} agents).`;
    case "impact":
      return `- **Affected users:** ${r.rootCause.affectedUsers.toLocaleString()}\n- **Severity:** ${r.rootCause.severity}\n- **Blast radius:** ${r.rootCause.blastRadius}\n- **Detection latency:** ~4 minutes (Datadog monitor → PagerDuty)`;
    case "resolution":
      return `${r.rootCause.recommendedAction}\n\nFix-forward path tracked in subsequent PR; rollback path validated against last-known-good build.`;
    case "actions":
      return [
        `[ ] Add lint rule: require explicit deadline on all gRPC clients (owner: platform team)`,
        `[ ] Add SLO burn alarm for ${r.rootCause.primaryRef.includes("PR") ? "checkout-api p99 > 800ms for 2m" : "affected service p99"} (owner: SRE)`,
        `[ ] Update deploy template to require canary > 15m before promotion when changed files > 20 (owner: platform team)`,
        `[ ] Post-incident review scheduled within 48h (owner: incident commander)`,
      ].join("\n");
  }
}

function clock(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) + " UTC";
}

export function PostmortemDialog({ open, onClose, result }: Props) {
  const [generated, setGenerated] = useState<Record<string, string>>({});
  const [generatingKey, setGeneratingKey] = useState<Section["key"] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !result) return;
    setGenerated({});
    let cancelled = false;

    (async () => {
      for (const s of SECTIONS) {
        if (cancelled) return;
        setGeneratingKey(s.key);
        await new Promise((r) => setTimeout(r, 450 + Math.random() * 350));
        if (cancelled) return;
        setGenerated((g) => ({ ...g, [s.key]: buildSection(s.key, result) }));
      }
      setGeneratingKey(null);
    })();

    return () => { cancelled = true; };
  }, [open, result]);

  const copyAll = () => {
    if (!result) return;
    const md = SECTIONS.map(s => `## ${s.title}\n\n${generated[s.key] ?? ""}`).join("\n\n");
    navigator.clipboard.writeText(`# Incident Postmortem: ${result.rootCause.primaryRef}\n\n${md}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      {open && result && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-4 md:inset-8 lg:inset-x-[10%] lg:inset-y-12 z-50 glass rounded-2xl border border-white/15 flex flex-col overflow-hidden shadow-[0_0_60px_rgba(34,211,238,0.2)]"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-white/10 p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-coral-500 to-amber-500 grid place-items-center">
                <FileText className="h-5 w-5 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-coral-400 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> AI Postmortem Generator
                </div>
                <div className="text-lg font-semibold truncate">
                  Incident Postmortem · {result.rootCause.primaryRef}
                </div>
                <div className="text-xs text-muted-foreground">
                  Drafted by Coral report agent · sources: {[...new Set(result.timeline.map(t => t.source))].map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 mr-2">
                      <SourceIcon source={s} size={12} /> {s}
                    </span>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={copyAll}>
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy MD"}
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <button onClick={onClose} className="p-2 rounded-md hover:bg-white/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-3xl mx-auto space-y-6">
                {SECTIONS.map((s, idx) => {
                  const content = generated[s.key];
                  const isGenerating = generatingKey === s.key;
                  return (
                    <motion.section
                      key={s.key}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-muted-foreground">§{idx + 1}</span>
                        <h3 className="text-base font-semibold">{s.title}</h3>
                        {isGenerating && (
                          <Badge variant="info" className="!normal-case">
                            <motion.span
                              className="inline-block h-1 w-1 rounded-full bg-cyan-400 mr-1"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            generating
                          </Badge>
                        )}
                        {content && !isGenerating && (
                          <Badge variant="success" className="!normal-case">
                            <Check className="h-2.5 w-2.5 mr-0.5" /> done
                          </Badge>
                        )}
                      </div>

                      {!content && !isGenerating && (
                        <div className="h-16 rounded-md border border-dashed border-white/10" />
                      )}

                      {isGenerating && (
                        <div className="space-y-1.5">
                          {[100, 95, 88, 70].map((w, i) => (
                            <motion.div
                              key={i}
                              className="h-3 bg-white/[0.06] rounded"
                              style={{ width: `${w}%` }}
                              animate={{ opacity: [0.3, 0.7, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                            />
                          ))}
                        </div>
                      )}

                      {content && !isGenerating && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: content
                              .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                              .replace(/\[(github|slack|sentry|datadog|jira|notion|pagerduty)\]/g, '<span class="text-cyan-400 font-mono text-xs">[$1]</span>'),
                          }}
                        />
                      )}
                    </motion.section>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="shrink-0 border-t border-white/10 p-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{Object.keys(generated).length}/{SECTIONS.length} sections · generated by Coral report agent</span>
              <span>confidence {(result.rootCause.confidence * 100).toFixed(0)}%</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
