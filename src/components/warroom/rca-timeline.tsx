"use client";

import { motion } from "framer-motion";
import { SourceIcon } from "@/components/widgets/source-icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Finding } from "@/lib/coral/investigation";
import { cn } from "@/lib/utils";

interface Props {
  events: Finding[];
  highlight?: number; // index to pulse
}

const KIND_STYLES = {
  github: "from-zinc-400 to-zinc-600",
  slack: "from-purple-400 to-pink-500",
  sentry: "from-violet-400 to-fuchsia-500",
  datadog: "from-indigo-400 to-blue-500",
  jira: "from-blue-400 to-blue-600",
  notion: "from-zinc-400 to-zinc-500",
  pagerduty: "from-emerald-400 to-teal-500",
} as const;

function clock(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function RcaTimeline({ events, highlight }: Props) {
  if (!events.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Root Cause Timeline</CardTitle>
          <CardDescription>Run an investigation to populate.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 grid place-items-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-lg">
            timeline empty
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Root Cause Timeline</span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {events.length} events · {clock(events[0].ts)} → {clock(events[events.length - 1].ts)}
          </span>
        </CardTitle>
        <CardDescription>
          Unified across {[...new Set(events.map((e) => e.source))].join(" · ")} — assembled by Coral.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop: horizontal animated rail */}
        <div className="hidden md:block relative pt-2 pb-1">
          <div className="absolute top-[34px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <motion.div
            className="absolute top-[34px] left-0 h-px bg-gradient-to-r from-cyan-400 via-coral-400 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.7))" }}
          />
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${events.length}, minmax(0, 1fr))` }}>
            {events.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
                className="flex flex-col items-center text-center px-1"
              >
                <div className="text-[10px] font-mono text-muted-foreground mb-1">{clock(e.ts)}</div>
                <div className="relative">
                  <motion.div
                    className={cn(
                      "h-7 w-7 rounded-full bg-gradient-to-br grid place-items-center relative z-10 border-2 border-background",
                      KIND_STYLES[e.source]
                    )}
                    animate={highlight === i ? { scale: [1, 1.2, 1] } : {}}
                    transition={highlight === i ? { duration: 1.2, repeat: Infinity } : {}}
                    style={{
                      filter: highlight === i ? "drop-shadow(0 0 8px rgba(255,90,60,0.8))" : undefined,
                    }}
                  >
                    <SourceIcon source={e.source} size={16} className="!border-0 !bg-transparent" />
                  </motion.div>
                  {highlight === i && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-coral-400"
                      animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  )}
                </div>
                <div className="mt-2 text-[11px] font-medium leading-tight line-clamp-2 max-w-[140px]">
                  {e.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden relative pl-6 mt-2">
          <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-cyan-400/60 via-white/10 to-transparent" />
          {events.map((e, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative pb-4 last:pb-0"
            >
              <div className="absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <SourceIcon source={e.source} size={14} />
                <span className="font-mono">{clock(e.ts)}</span>
              </div>
              <div className="text-sm mt-0.5 font-medium">{e.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{e.detail}</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
