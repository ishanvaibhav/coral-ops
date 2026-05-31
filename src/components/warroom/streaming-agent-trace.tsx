"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SourceIcon } from "@/components/widgets/source-icon";
import type { AgentName, IntegrationSource } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Streaming "agent typing" effect — the line types itself out character by
 * character, then the finding card appears. Designed for the landing demo
 * where every detail must feel alive, not a `Loading...` blob.
 */

export interface StreamedStep {
  agent: AgentName;
  source?: IntegrationSource;
  prefix: string;        // e.g. "Investigating GitHub..."
  result: string;        // e.g. "Found PR #3318"
  metric?: string;       // e.g. "+2,300% events"
}

interface Props {
  steps: StreamedStep[];
  running: boolean;
  onComplete?: () => void;
  /** Milliseconds between completed steps */
  stepDelay?: number;
  /** Milliseconds per typed character */
  typeSpeed?: number;
}

export function StreamingAgentTrace({
  steps,
  running,
  onComplete,
  stepDelay = 350,
  typeSpeed = 18,
}: Props) {
  const [active, setActive] = useState<number>(-1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [resultText, setResultText] = useState<Record<number, string>>({});
  const cancelled = useRef(false);

  useEffect(() => {
    if (!running) return;
    cancelled.current = false;
    setActive(-1);
    setCompleted(new Set());
    setResultText({});

    (async () => {
      for (let i = 0; i < steps.length; i++) {
        if (cancelled.current) return;
        setActive(i);
        // "Investigating..." phase
        await delay(700 + Math.random() * 300);
        if (cancelled.current) return;
        // Type the result character by character
        const full = steps[i].result;
        for (let c = 1; c <= full.length; c++) {
          if (cancelled.current) return;
          setResultText((r) => ({ ...r, [i]: full.slice(0, c) }));
          await delay(typeSpeed);
        }
        setCompleted((s) => new Set([...s, i]));
        await delay(stepDelay);
      }
      onComplete?.();
    })();

    return () => { cancelled.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, steps]);

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {steps.map((s, i) => {
          if (i > active) return null;
          const isDone = completed.has(i);
          const isRunning = i === active && !isDone;
          const text = resultText[i] ?? "";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "glass rounded-lg p-3 border transition-colors",
                isDone && "border-emerald-500/30",
                isRunning && "border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.15)]",
                !isDone && !isRunning && "border-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 grid place-items-center shrink-0">
                  {s.source ? (
                    <SourceIcon source={s.source} size={16} className="!border-0 !bg-transparent" />
                  ) : (
                    <span className="text-[10px] font-mono">{s.agent.slice(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">
                      {s.prefix}
                    </span>
                    <span className="ml-auto flex items-center gap-1.5 text-xs shrink-0">
                      {isRunning && !text && (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                          <span className="text-cyan-400 font-mono">searching…</span>
                        </>
                      )}
                      {isDone && (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400 font-mono">done</span>
                        </>
                      )}
                    </span>
                  </div>
                  {(text || isDone) && (
                    <div className="mt-1 text-sm font-medium flex items-center gap-2 flex-wrap">
                      <span className="text-emerald-400">✓</span>
                      <span>{text}</span>
                      {isRunning && text && (
                        <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse" />
                      )}
                      {s.metric && isDone && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-coral-500/15 text-coral-400 border border-coral-500/30">
                          {s.metric}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
