"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface Series { key: string; color: string; label: string; }
interface Props {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  stacked?: boolean;
  legend?: boolean;
}

export function AnimatedBarChart({ data, xKey, series, height = 220, stacked, legend }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} width={32} />
        <Tooltip
          contentStyle={{
            background: "rgba(8, 12, 20, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        {legend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            fill={s.color}
            stackId={stacked ? "a" : undefined}
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={900}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
