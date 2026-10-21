import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AlertSeverity,
  Priority,
  RecommendationCategory,
  RecommendationStatus,
  ShipmentStatus,
  StockStatus,
} from "@/types";
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Truck, ShieldAlert } from "lucide-react";

export function StockStatusBadge({ status }: { status: StockStatus }) {
  switch (status) {
    case "in_stock":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium dark:bg-emerald-950/40 dark:text-emerald-400"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          In Stock
        </Badge>
      );
    case "low_stock":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 font-medium dark:bg-amber-950/40 dark:text-amber-400"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </Badge>
      );
    case "out_of_stock":
      return (
        <Badge
          variant="outline"
          className="bg-rose-50 text-rose-700 border-rose-200 font-medium dark:bg-rose-950/40 dark:text-rose-400"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Out of Stock
        </Badge>
      );
    case "near_expiry":
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200 font-medium dark:bg-orange-950/40 dark:text-orange-400"
        >
          <Clock className="w-3 h-3 mr-1" />
          Near Expiry
        </Badge>
      );
  }
}

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  switch (status) {
    case "preparing":
      return (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-700 border-slate-200 font-medium dark:bg-slate-900 dark:text-slate-300"
        >
          <Clock className="w-3 h-3 mr-1" />
          Preparing
        </Badge>
      );
    case "in_transit":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 font-medium dark:bg-blue-950/40 dark:text-blue-400"
        >
          <Truck className="w-3 h-3 mr-1" />
          In Transit
        </Badge>
      );
    case "delayed":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 font-medium dark:bg-amber-950/40 dark:text-amber-400 animate-pulse"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Delayed
        </Badge>
      );
    case "delivered":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium dark:bg-emerald-950/40 dark:text-emerald-400"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Delivered
        </Badge>
      );
  }
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    critical: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300",
    high: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
    medium: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
    low: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400",
  };

  return (
    <Badge variant="outline" className={cn("capitalize font-medium text-xs", styles[priority])}>
      {priority}
    </Badge>
  );
}

export function RecommendationStatusBadge({ status }: { status: RecommendationStatus }) {
  switch (status) {
    case "open":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
          Open Action
        </Badge>
      );
    case "accepted":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="outline"
          className="bg-slate-100 text-slate-600 border-slate-200 font-medium"
        >
          Declined
        </Badge>
      );
    case "review":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 font-medium"
        >
          <Clock className="w-3 h-3 mr-1" />
          Under Review
        </Badge>
      );
  }
}

export function RecommendationCategoryBadge({ category }: { category: RecommendationCategory }) {
  const labels: Record<RecommendationCategory, string> = {
    low_stock_risk: "Stock Risk",
    excess_inventory: "Excess Stock",
    demand_forecast: "Demand Forecast",
    shipment_delay_risk: "Delay Risk",
    stock_transfer: "Transfer Optimization",
  };

  return (
    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
      {labels[category] ?? category}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  switch (severity) {
    case "critical":
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-medium">
          <ShieldAlert className="w-3 h-3 mr-1" />
          Critical
        </Badge>
      );
    case "warning":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 font-medium"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Warning
        </Badge>
      );
    case "info":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
          Info
        </Badge>
      );
  }
}
