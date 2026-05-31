"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SourceIcon } from "@/components/widgets/source-icon";
import { EVIDENCE_BREAKDOWN, computeWeightedConfidence } from "@/lib/coral/queries";
import type { IntegrationSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  /** Override the demo breakdown with custom contributions */
  contributions?: typeof EVIDENCE_BREAKDOWN;
  confidence?: number; // override 0..1
}

export function ConfidenceMeter({ contributions = EVIDENCE_BREAKDOWN, confidence }: Props) {
  const score = confidence ?? computeWeightedConfidence(contributions);
  const pct = Math.round(score * 100);
  const tier = pct >= 85 ? "high" : pct >= 65 ? "medium" : "low";

  const size = 130;
  const thickness = 11;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;
  const ringColor = tier === "high" ? "#34d399" : tier === "medium" ? "#fbbf24" : "#ff5a3c";

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute -top-12 -right-12 h-48 w-48 rounded-full blur-3xl opacity-20"
        style={{ background: ringColor }}
      />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            Root Cause Confidence
          </span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            evidence-weighted
          </span>
        </CardTitle>
        <CardDescription className="text-[11px]">
          Σ (source_weight × source_confidence) — Coral's explainable model
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-[140px_1fr] gap-5 items-center">
          {/* Ring */}
          <div className="relative grid place-items-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <defs>
                <linearGradient id="conf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={ringColor} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={ringColor} />
                </linearGradient>
              </defs>
              <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
              <motion.circle
                cx={size/2} cy={size/2} r={radius} fill="none"
                stroke="url(#conf-grad)" strokeWidth={thickness} strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 10px ${ringColor}80)` }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <motion.div
                  className="text-4xl font-semibold tabular-nums"
                  style={{ color: ringColor }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {pct}
                </motion.div>
                <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground -mt-1">
                  confidence
                </div>
              </div>
            </div>
          </div>

          {/* Evidence breakdown */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              evidence contribution
            </div>
            {contributions.map((c, i) => {
              const widthPct = c.weight * 100;
              return (
                <motion.div
                  key={c.source}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-2 text-xs">
                    {c.source !== "other" ? (
                      <SourceIcon source={c.source as IntegrationSource} size={16} />
                    ) : (
                      <span className="h-4 w-4 rounded-md bg-white/[0.05] border border-white/10 inline-grid place-items-center text-[8px] font-mono">··</span>
                    )}
                    <span className="capitalize w-16">{c.source}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          c.source === "github" && "bg-zinc-300",
                          c.source === "sentry" && "bg-violet-400",
                          c.source === "datadog" && "bg-indigo-400",
                          c.source === "slack" && "bg-purple-400",
                          c.source === "pagerduty" && "bg-emerald-400",
                          c.source === "other" && "bg-cyan-400",
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 1, delay: 0.4 + i * 0.06 }}
                      />
                    </div>
                    <span className="text-[10px] font-mono tabular-nums w-10 text-right">
                      {widthPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/80 pl-6 italic">{c.note}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
