import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/types";

const styles: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]",
  high: "bg-coral-500/15 text-coral-400 border-coral-500/40",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  low: "bg-cyan-500/15 text-cyan-400 border-cyan-500/40",
  info: "bg-white/[0.05] text-muted-foreground border-white/15",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        styles[severity],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}
