import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number; // percentage, e.g. 5.4 or -2.1
    direction?: "up" | "down" | "neutral";
    label?: string; // e.g. "vs last 30d"
    isPositiveGood?: boolean; // defaults to true
  };
  subtitle?: string;
  to?: string;
  className?: string;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  to,
  className,
  onClick,
}: KpiCardProps) {
  const isPositiveGood = trend?.isPositiveGood ?? true;
  const isGood = trend ? (trend.value >= 0 ? isPositiveGood : !isPositiveGood) : true;

  const content = (
    <Card
      onClick={onClick}
      className={cn(
        "p-5 transition-all duration-200 hover:shadow-md border-border/80 bg-card group relative overflow-hidden",
        to || onClick ? "cursor-pointer hover:border-primary/40" : "",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
            {value}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 transition-transform duration-200 group-hover:scale-110">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded",
              trend.value === 0
                ? "bg-muted text-muted-foreground"
                : isGood
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
            )}
          >
            {trend.value > 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : trend.value < 0 ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            <span>
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
          </div>
        )}
        <span className="text-muted-foreground truncate">
          {trend?.label ?? subtitle ?? "Real-time demo view"}
        </span>
      </div>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
