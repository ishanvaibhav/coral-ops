import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary border-primary/30",
        secondary: "bg-white/[0.05] text-foreground border-white/10",
        destructive: "bg-red-500/15 text-red-400 border-red-500/30",
        success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        info: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        outline: "text-foreground border-white/15",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
