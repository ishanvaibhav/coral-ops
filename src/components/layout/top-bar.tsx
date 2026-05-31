"use client";

import { useEffect, useState } from "react";
import { Bell, Command, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "UTC",
        })
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-14 shrink-0 border-b border-white/10 bg-black/30 backdrop-blur-xl flex items-center px-4 lg:px-6 gap-4">
      <div className="lg:hidden flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400 to-coral-500 grid place-items-center">
          <Command className="h-4 w-4 text-black" />
        </div>
        <span className="font-semibold tracking-wide">CORAL.OPS</span>
      </div>

      <div className="flex-1 max-w-xl relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Ask anything across GitHub, Slack, Sentry, Datadog…"
          className="pl-9 pr-16 bg-white/[0.04]"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-white/10 px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Badge variant="info" className="hidden sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse" />
          1 active incident
        </Badge>
        <div className="text-xs font-mono text-muted-foreground hidden sm:block">
          UTC {time}
        </div>
        <button className="relative p-2 rounded-md hover:bg-white/[0.05] transition">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-coral-500" />
        </button>
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 grid place-items-center text-[11px] font-semibold">
          PR
        </div>
      </div>
    </header>
  );
}
