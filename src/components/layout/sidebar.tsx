"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  GitPullRequest,
  LayoutDashboard,
  MessageSquare,
  Radar,
  Radio,
  Rocket,
  Shield,
  Siren,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/demo", label: "Ask Coral", icon: Radar, group: "Overview", featured: true },
  { href: "/", label: "Command", icon: LayoutDashboard, group: "Overview" },
  { href: "/war-room", label: "Incident War Room", icon: Siren, group: "Operate", featured: true },
  { href: "/incidents", label: "Incident Investigator", icon: AlertTriangle, group: "Operate" },
  { href: "/sprint", label: "Sprint Health", icon: GitPullRequest, group: "Operate" },
  { href: "/release", label: "Release Readiness", icon: Rocket, group: "Operate" },
  { href: "/security", label: "Security Center", icon: Shield, group: "Defend" },
  { href: "/analytics", label: "Engineering Analytics", icon: BarChart3, group: "Insight" },
  { href: "/chat", label: "AI Chat", icon: MessageSquare, group: "Intelligence" },
  { href: "/agents", label: "Agent System", icon: Bot, group: "Intelligence" },
];

const groups = ["Overview", "Operate", "Defend", "Insight", "Intelligence"] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-white/10">
        <div className="relative">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400 to-coral-500 grid place-items-center">
            <Radar className="h-4 w-4 text-black" />
          </div>
          <div className="absolute inset-0 rounded-md bg-cyan-400 blur-md opacity-30 -z-10" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-wide">CORAL.OPS</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">command center</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map((g) => (
          <div key={g}>
            <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{g}</div>
            <div className="space-y-0.5">
              {nav.filter((n) => n.group === g).map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all relative",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                      item.featured && !active && "text-foreground"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                      />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", item.featured && !active && "text-coral-400")} />
                    <span className="truncate flex-1">{item.label}</span>
                    {item.featured && (
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-coral-500/15 text-coral-400 border border-coral-500/30">
                        LIVE
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="glass rounded-lg p-3 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Coral runtime</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>federated SQL</span>
            <span className="font-mono">OK</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>agents online</span>
            <span className="font-mono">6/6</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
