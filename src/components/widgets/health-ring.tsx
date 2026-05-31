"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  score: number; // 0..100
  label: string;
  grade?: string;
  size?: number;
  thickness?: number;
}

export function HealthRing({ score, label, grade, size = 160, thickness = 10 }: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 85 ? "#34d399" : score >= 70 ? "#22d3ee" : score >= 55 ? "#fbbf24" : "#ff5a3c";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${label})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-semibold tabular-nums" style={{ color }}>{score}</div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
          {grade && (
            <div className={cn("mt-1 inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border")} style={{ borderColor: color + "60", color }}>
              {grade}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
