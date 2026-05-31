"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Database, Loader2, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/widgets/source-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CoralQuery } from "@/lib/coral/queries";
import { cn } from "@/lib/utils";

interface Props {
  query: CoralQuery;
  /** Animate plan steps in sequentially when first shown */
  animate?: boolean;
}

/**
 * Renders an executed Coral federated SQL query with:
 *  - Syntax-highlighted SQL with cross-source JOINs visually marked
 *  - Animated execution plan, source-by-source
 *  - Source pipeline diagram with row-count animation
 *  - Result preview table
 */
export function CoralQueryVisualizer({ query, animate = true }: Props) {
  const [activePlanStep, setActivePlanStep] = useState<number>(animate ? 0 : query.plan.length);

  useEffect(() => {
    if (!animate) return;
    setActivePlanStep(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setActivePlanStep(i);
      if (i >= query.plan.length) clearInterval(interval);
    }, 220);
    return () => clearInterval(interval);
  }, [query, animate]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-white/10 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400 to-coral-400 grid place-items-center">
              <Database className="h-3.5 w-3.5 text-black" />
            </div>
            Coral Federated SQL
            <Badge variant="info" className="!normal-case">
              {query.sources.length === 0 ? "planner" : `${query.sources.length}-source join`}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-emerald-400">{query.rowsReturned} rows</span>
            <span className="text-muted-foreground">{query.executionMs}ms</span>
          </div>
        </div>
        <CardDescription className="!mt-1">{query.intent}</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="sql" className="w-full">
          <TabsList className="mx-4 mt-3 !h-8">
            <TabsTrigger value="sql"><span className="font-mono mr-1">SQL</span></TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>

          <TabsContent value="sql" className="!mt-3 px-4 pb-4">
            <SqlBlock sql={query.sql} sources={query.sources} />
          </TabsContent>

          <TabsContent value="plan" className="!mt-3 px-4 pb-4">
            <PlanList plan={query.plan} active={activePlanStep} />
          </TabsContent>

          <TabsContent value="pipeline" className="!mt-3 px-4 pb-4">
            <SourcePipeline query={query} active={activePlanStep} />
          </TabsContent>

          <TabsContent value="result" className="!mt-3 px-4 pb-4">
            <ResultTable preview={query.resultPreview} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ----- SQL block with cross-source token highlighting -----------------------

function SqlBlock({ sql, sources }: { sql: string; sources: string[] }) {
  const lines = sql.split("\n");
  return (
    <pre className="glass rounded-md p-3 text-[11.5px] leading-relaxed font-mono overflow-x-auto">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.025, duration: 0.2 }}
          className="whitespace-pre"
        >
          {highlightSql(line, sources)}
        </motion.div>
      ))}
    </pre>
  );
}

const KEYWORDS = new Set([
  "SELECT","FROM","JOIN","LEFT","RIGHT","INNER","OUTER","ON","WHERE","AND",
  "OR","NOT","IN","BETWEEN","INTERVAL","NOW","GROUP","BY","ORDER","DESC",
  "ASC","LIMIT","WITH","AS","UNION","ALL","HAVING","ARRAY","ARRAY_AGG",
  "PERCENTILE","COUNT","MAX","MIN","SUM","CONCAT","INTO","NULL","TRUE",
  "FALSE","ILIKE","LIKE","CASE","WHEN","THEN","ELSE","END",
]);

function highlightSql(line: string, sources: string[]) {
  // Tokenize and emit highlighted spans
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  // Handle full-line comments
  const trimmed = line.trimStart();
  if (trimmed.startsWith("--")) {
    return <span className="text-muted-foreground italic">{line}</span>;
  }
  const regex = /([\s,();])|('[^']*')|(\b[A-Za-z_][\w.]*\b)|(\d+(\.\d+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{line.slice(last, m.index)}</span>);
    const tok = m[0];
    if (m[2]) {
      out.push(<span key={key++} className="text-amber-300">{tok}</span>);
    } else if (m[3]) {
      const up = tok.toUpperCase();
      if (KEYWORDS.has(up)) {
        out.push(<span key={key++} className="text-violet-400 font-semibold">{tok}</span>);
      } else if (sources.some((s) => tok.startsWith(s + ".") || tok === s)) {
        const [src, ...rest] = tok.split(".");
        out.push(
          <span key={key++} className="text-cyan-300 font-semibold bg-cyan-500/10 px-0.5 rounded">
            {src}
          </span>
        );
        if (rest.length) out.push(<span key={key++} className="text-foreground">.{rest.join(".")}</span>);
      } else if (tok.includes(".")) {
        out.push(<span key={key++} className="text-foreground/90">{tok}</span>);
      } else {
        out.push(<span key={key++} className="text-foreground/80">{tok}</span>);
      }
    } else if (m[4]) {
      out.push(<span key={key++} className="text-emerald-300">{tok}</span>);
    } else {
      out.push(<span key={key++}>{tok}</span>);
    }
    last = m.index + tok.length;
  }
  if (last < line.length) out.push(<span key={key++}>{line.slice(last)}</span>);
  return <>{out}</>;
}

// ----- Plan list ------------------------------------------------------------

function PlanList({ plan, active }: { plan: CoralQuery["plan"]; active: number }) {
  return (
    <div className="space-y-1.5">
      {plan.map((step, i) => {
        const done = i < active;
        const running = i === active;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "glass rounded-md p-2.5 flex items-center gap-3 border transition-colors",
              done && "border-emerald-500/20",
              running && "border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.15)]",
              !done && !running && "border-white/5 opacity-60"
            )}
          >
            <div className="w-5 grid place-items-center">
              {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              {running && <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />}
              {!done && !running && <span className="h-1.5 w-1.5 rounded-full bg-white/20" />}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground w-5">#{i + 1}</span>
            {step.source && <SourceIcon source={step.source} size={16} />}
            <span className="text-xs flex-1 font-mono">{step.step}</span>
            {step.rows !== undefined && (
              <span className="text-[10px] font-mono text-cyan-400 tabular-nums">
                {step.rows.toLocaleString()} rows
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ----- Source pipeline (visual diagram) -------------------------------------

function SourcePipeline({ query, active }: { query: CoralQuery; active: number }) {
  const visited = new Set<string>();
  query.plan.slice(0, active + 1).forEach((p) => p.source && visited.add(p.source));

  const stages = [
    { label: "Sources", items: query.sources.length ? query.sources : ["coral"] as string[] },
    { label: "Coral planner", items: ["plan"] },
    { label: "Federated executor", items: ["execute"] },
    { label: "Result", items: [`${query.rowsReturned} rows`] },
  ];

  return (
    <div className="glass rounded-md p-4">
      <div className="grid grid-cols-4 gap-3 items-center">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="relative">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 text-center">{stage.label}</div>
            <div className="space-y-1.5">
              {stage.items.map((item) => {
                const isSource = idx === 0 && query.sources.includes(item as never);
                const isActive = isSource ? visited.has(item) : active > 0;
                return (
                  <motion.div
                    key={item}
                    animate={{
                      borderColor: isActive ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.1)",
                      backgroundColor: isActive ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.02)",
                    }}
                    className="rounded-md border p-2 flex items-center gap-2 text-xs justify-center"
                  >
                    {isSource ? (
                      <>
                        <SourceIcon source={item as never} size={14} />
                        <span className="capitalize">{item}</span>
                      </>
                    ) : (
                      <span className="font-mono">{item}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
            {idx < stages.length - 1 && (
              <div className="absolute top-1/2 -right-2 translate-y-1 hidden md:block">
                <ChevronRight className={cn("h-4 w-4", active > 0 ? "text-cyan-400" : "text-muted-foreground/40")} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Flowing particles */}
      {active > 0 && query.sources.length > 0 && (
        <div className="relative h-1 mt-4 overflow-hidden rounded-full bg-white/[0.05]">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}

// ----- Result table ---------------------------------------------------------

function ResultTable({ preview }: { preview: CoralQuery["resultPreview"] }) {
  return (
    <div className="glass rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {preview.columns.map((c) => (
                <th key={c} className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 font-mono tabular-nums">
                    {String(cell)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
