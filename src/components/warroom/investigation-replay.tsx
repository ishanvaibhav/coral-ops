"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/widgets/source-icon";
import type { Finding } from "@/lib/coral/investigation";
import { cn } from "@/lib/utils";

interface Props {
  events: Finding[];
}

function clock(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * VCR-style replay of the cross-source investigation. Press play and watch
 * events tick into view chronologically with a moving playhead.
 */
export function InvestigationReplay({ events }: Props) {
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(2);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute relative offsets across the timeline span
  const sorted = [...events].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  const first = sorted[0] ? new Date(sorted[0].ts).getTime() : 0;
  const last = sorted[sorted.length - 1] ? new Date(sorted[sorted.length - 1].ts).getTime() : 0;
  const span = Math.max(1, last - first);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    if (index >= sorted.length - 1) {
      setPlaying(false);
      return;
    }
    const baseDelay = 1100 / speed;
    timerRef.current = setTimeout(() => {
      setIndex((i) => Math.min(i + 1, sorted.length - 1));
    }, baseDelay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, index, speed, sorted.length]);

  const restart = () => { setIndex(-1); setPlaying(true); };
  const playPause = () => {
    if (index >= sorted.length - 1) restart();
    else setPlaying((p) => !p);
  };
  const step = (dir: 1 | -1) => {
    setPlaying(false);
    setIndex((i) => Math.max(-1, Math.min(sorted.length - 1, i + dir)));
  };

  const currentPct =
    index < 0
      ? 0
      : ((new Date(sorted[index].ts).getTime() - first) / span) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-400 to-pink-500 grid place-items-center">
              <Play className="h-3.5 w-3.5 text-black" />
            </span>
            Investigation Replay
          </CardTitle>
          <Badge variant="info" className="!normal-case">
            {index < 0 ? "0" : index + 1} / {sorted.length}
          </Badge>
        </div>
        <CardDescription className="!mt-1">
          Reconstruct the cross-source story step-by-step.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Transport controls */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={restart} title="Restart">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => step(-1)} title="Step back">
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={playPause} className="!shadow-[0_0_15px_rgba(167,139,250,0.4)]">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause" : index >= sorted.length - 1 ? "Replay" : "Play"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => step(1)} title="Step forward">
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
          <div className="ml-auto flex gap-1">
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "text-[10px] font-mono px-2 py-1 rounded border transition",
                  speed === s
                    ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-400"
                    : "border-white/10 bg-white/[0.02] text-muted-foreground hover:text-foreground"
                )}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Scrubber */}
        <div className="relative h-12 mt-2">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/10" />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-0.5 bg-gradient-to-r from-violet-400 to-pink-400"
            animate={{ width: `${currentPct}%` }}
            transition={{ duration: 0.3 }}
            style={{ filter: "drop-shadow(0 0 6px rgba(167,139,250,0.6))" }}
          />
          {sorted.map((e, i) => {
            const pct = ((new Date(e.ts).getTime() - first) / span) * 100;
            const reached = i <= index;
            return (
              <button
                key={i}
                onClick={() => { setPlaying(false); setIndex(i); }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                style={{ left: `${pct}%` }}
                title={`${clock(e.ts)} — ${e.label}`}
              >
                <motion.div
                  animate={{
                    scale: i === index ? [1, 1.3, 1] : 1,
                  }}
                  transition={{ duration: 1, repeat: i === index ? Infinity : 0 }}
                  className={cn(
                    "h-3 w-3 rounded-full border-2 transition-all",
                    reached
                      ? "border-background"
                      : "border-white/20 bg-white/[0.05]"
                  )}
                  style={
                    reached
                      ? {
                          background:
                            sourceColor(e.source) + (i === index ? "" : ""),
                          boxShadow:
                            i === index
                              ? `0 0 12px ${sourceColor(e.source)}cc`
                              : `0 0 6px ${sourceColor(e.source)}66`,
                        }
                      : undefined
                  }
                />
                <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                  {clock(e.ts)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Live event card */}
        <div className="relative h-24">
          <AnimatePresence mode="wait">
            {index >= 0 && (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="glass rounded-lg p-3 absolute inset-0 border"
                style={{ borderColor: sourceColor(sorted[index].source) + "40" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-9 w-9 rounded-md grid place-items-center shrink-0"
                    style={{ background: sourceColor(sorted[index].source) + "20" }}
                  >
                    <SourceIcon source={sorted[index].source} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {clock(sorted[index].ts)}
                      </span>
                      <Badge variant="secondary" className="!normal-case">
                        {sorted[index].source}
                      </Badge>
                      <span className="ml-auto text-[10px] font-mono text-cyan-400">
                        weight {(sorted[index].weight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-sm font-medium mt-1">{sorted[index].label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {sorted[index].detail}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {index < 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-lg"
              >
                Press play to reconstruct the incident
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

function sourceColor(s: string) {
  const map: Record<string, string> = {
    github: "#a1a1aa",
    sentry: "#a78bfa",
    datadog: "#818cf8",
    slack: "#c084fc",
    pagerduty: "#34d399",
    jira: "#60a5fa",
    notion: "#a1a1aa",
  };
  return map[s] || "#22d3ee";
}
