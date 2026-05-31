"use client";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Props {
  label: string;
  value: ReactNode;
  unit?: string;
  trend?: number;
  trendInverted?: boolean; // for metrics where down is good (e.g. MTTR)
  sub?: ReactNode;
  accent?: "cyan" | "coral" | "emerald" | "amber" | "violet";
  icon?: ReactNode;
  delay?: number;
}

const accentMap: Record<NonNullable<Props["accent"]>, string> = {
  cyan: "from-cyan-500/20 to-cyan-500/0 text-cyan-400",
  coral: "from-coral-500/20 to-coral-500/0 text-coral-400",
  emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-400",
  amber: "from-amber-500/20 to-amber-500/0 text-amber-400",
  violet: "from-violet-500/20 to-violet-500/0 text-violet-400",
};

export function MetricCard({
  label,
  value,
  unit,
  trend,
  trendInverted,
  sub,
  accent = "cyan",
  icon,
  delay = 0,
}: Props) {
  const goodDirection = trend === undefined ? null : trendInverted ? trend < 0 : trend > 0;
  const TrendIcon = trend === undefined ? Minus : trend === 0 ? Minus : trend > 0 ? ArrowUp : ArrowDown;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden glass-hover">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", accentMap[accent])} />
        <div className="relative p-5">
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
            {icon && <span className={cn("opacity-80", accentMap[accent].split(" ").find(c => c.startsWith("text")))}>{icon}</span>}
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            {trend !== undefined ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-mono",
                  goodDirection === null ? "text-muted-foreground" : goodDirection ? "text-emerald-400" : "text-coral-400"
                )}
              >
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend)}%
              </span>
            ) : <span />}
            {sub && <span className="text-muted-foreground">{sub}</span>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
