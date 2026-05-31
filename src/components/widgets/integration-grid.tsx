"use client";

import { motion } from "framer-motion";
import { fixtures } from "@/lib/mock/dataset";
import { Card } from "@/components/ui/card";
import { SourceIcon } from "@/components/widgets/source-icon";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function IntegrationGrid() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold">Connected sources</div>
          <div className="text-xs text-muted-foreground">Federated via Coral protocol</div>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {fixtures.integrations.filter(i => i.status === "connected").length}/{fixtures.integrations.length} online
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {fixtures.integrations.map((i, idx) => (
          <motion.div
            key={i.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass rounded-lg p-3 hover:bg-white/[0.06] transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <SourceIcon source={i.id} size={24} />
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  i.status === "connected" && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
                  i.status === "degraded" && "bg-amber-400",
                  i.status === "disconnected" && "bg-red-400"
                )}
              />
            </div>
            <div className="text-xs font-semibold">{i.name}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              sync {formatRelative(i.lastSync)}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/80 mt-1">
              {i.recordCount.toLocaleString()} rec · {i.latencyMs}ms
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
