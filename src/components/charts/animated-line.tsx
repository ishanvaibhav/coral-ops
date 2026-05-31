"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Series { key: string; color: string; label: string; }
interface Props {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
}

export function AnimatedLineChart({ data, xKey, series, height = 220 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
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
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={{ fill: s.color, r: 2 }}
            activeDot={{ r: 5, style: { filter: `drop-shadow(0 0 6px ${s.color})` } }}
            isAnimationActive
            animationDuration={1000}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
