import { cn } from "@/lib/utils";
import type { IntegrationSource } from "@/lib/types";

const meta: Record<IntegrationSource, { label: string; bg: string; fg: string }> = {
  github: { label: "GH", bg: "bg-white/10", fg: "text-white" },
  slack: { label: "SL", bg: "bg-purple-500/20", fg: "text-purple-300" },
  sentry: { label: "SE", bg: "bg-violet-500/20", fg: "text-violet-300" },
  datadog: { label: "DD", bg: "bg-indigo-500/20", fg: "text-indigo-300" },
  jira: { label: "JR", bg: "bg-blue-500/20", fg: "text-blue-300" },
  notion: { label: "NO", bg: "bg-zinc-500/20", fg: "text-zinc-200" },
  pagerduty: { label: "PD", bg: "bg-emerald-500/20", fg: "text-emerald-300" },
};

export function SourceIcon({ source, size = 20, className }: { source: IntegrationSource; size?: number; className?: string }) {
  const m = meta[source];
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-md font-mono font-semibold text-[10px] border border-white/10",
        m.bg, m.fg, className
      )}
      style={{ width: size, height: size }}
      title={source}
    >
      {m.label}
    </span>
  );
}
