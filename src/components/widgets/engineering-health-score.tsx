"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Bug, GitBranch, Rocket, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Component {
  label: string;
  value: number;     // 0..100
  weight: number;    // 0..1
  icon: React.ElementType;
  trend: number;     // +/-
}

const COMPONENTS: Component[] = [
  { label: "Incident posture", value: 81, weight: 0.30, icon: Bug, trend: -4 },
  { label: "Sprint velocity", value: 72, weight: 0.20, icon: GitBranch, trend: -8 },
  { label: "Deploy success", value: 92, weight: 0.25, icon: Rocket, trend: +3 },
  { label: "Security posture", value: 88, weight: 0.25, icon: Shield, trend: +5 },
];

function gradeFor(score: number): { letter: string; label: string; color: string } {
  if (score >= 90) return { letter: "A", label: "Elite", color: "text-emerald-400" };
  if (score >= 80) return { letter: "B", label: "Strong", color: "text-cyan-400" };
  if (score >= 70) return { letter: "C", label: "Stable", color: "text-amber-400" };
  if (score >= 60) return { letter: "D", label: "At risk", color: "text-coral-400" };
  return { letter: "F", label: "Critical", color: "text-red-400" };
}

export function EngineeringHealthScore({ animate = true }: { animate?: boolean }) {
  const score = Math.round(COMPONENTS.reduce((s, c) => s + c.value * c.weight, 0));
  const trend = COMPONENTS.reduce((s, c) => s + c.trend * c.weight, 0);
  const grade = gradeFor(score);

  const size = 200;
  const thickness = 14;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const ringColor = score >= 85 ? "#34d399" : score >= 70 ? "#22d3ee" : score >= 55 ? "#fbbf24" : "#ff5a3c";

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-violet-500/5 to-coral-500/10 pointer-events-none" />
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-20" style={{ background: ringColor }} />

      <CardContent className="relative p-5 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-center">
          {/* Ring */}
          <div className="relative grid place-items-center mx-auto" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <defs>
                <linearGradient id="ehs-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={ringColor} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={ringColor} />
                </linearGradient>
              </defs>
              <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
              <motion.circle
                cx={size/2} cy={size/2} r={radius} fill="none"
                stroke="url(#ehs-grad)" strokeWidth={thickness} strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: animate ? circumference : offset }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.6, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 12px ${ringColor}80)` }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Engineering Health</div>
                <div className="text-6xl font-semibold tabular-nums leading-none mt-1" style={{ color: ringColor }}>
                  {score}
                </div>
                <div className="text-xs text-muted-foreground mt-1">/ 100</div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={cn("text-2xl font-bold", grade.color)}>{grade.letter}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{grade.label}</span>
                </div>
                <div className={cn(
                  "flex items-center justify-center gap-1 text-[10px] font-mono mt-1",
                  trend > 0 ? "text-emerald-400" : trend < 0 ? "text-coral-400" : "text-muted-foreground"
                )}>
                  {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(trend).toFixed(1)} vs last week
                </div>
              </div>
            </div>
          </div>

          {/* Component breakdown */}
          <div className="space-y-3 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              composite — coral weighted average
            </div>
            {COMPONENTS.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-md bg-white/[0.04] border border-white/10 grid place-items-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>{c.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">w {(c.weight * 100).toFixed(0)}%</span>
                        <span className={cn(
                          "text-[10px] font-mono",
                          c.trend > 0 ? "text-emerald-400" : c.trend < 0 ? "text-coral-400" : "text-muted-foreground"
                        )}>
                          {c.trend > 0 ? "+" : ""}{c.trend}
                        </span>
                        <span className="font-mono tabular-nums w-8 text-right">{c.value}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          c.value >= 85 ? "bg-emerald-500" : c.value >= 70 ? "bg-cyan-500" : c.value >= 55 ? "bg-amber-500" : "bg-coral-500"
                        )}
                        initial={{ width: animate ? 0 : `${c.value}%` }}
                        animate={{ width: `${c.value}%` }}
                        transition={{ duration: 1.1, delay: 0.3 + i * 0.08 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
