import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import { dailySeries, formatMoney, formatNumber, isShipmentOnTime } from "@/lib/calc";
import {
  Boxes,
  Truck,
  Clock,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StockStatusBadge, ShipmentStatusBadge, SeverityBadge } from "@/components/StatusBadge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import type { DateRangePreset } from "@/types";

export const Route = createFileRoute("/overview")({
  component: OverviewPage,
});

const PIE_COLORS = ["#176B4D", "#3B82F6", "#F59E0B", "#10B981", "#8B5CF6"];

function OverviewPage() {
  const {
    products,
    stock,
    shipments,
    warehouses,
    alerts,
    activity,
    selectedWarehouseId,
    lastRefreshedAt,
  } = useDemoStore();

  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      demoStore.refresh();
      setIsRefreshing(false);
      toast.success("Operational metrics updated");
    }, 450);
  };

  // Filtered dataset according to selected warehouse
  const filteredStock =
    selectedWarehouseId === "all"
      ? stock
      : stock.filter((s) => s.warehouseId === selectedWarehouseId);

  const filteredShipments =
    selectedWarehouseId === "all"
      ? shipments
      : shipments.filter((s) => s.originWarehouseId === selectedWarehouseId);

  // Calculations
  const totalOrders = filteredShipments.length;
  const activeOrders = filteredShipments.filter((s) => s.status !== "delivered").length;
  const delayedShipments = filteredShipments.filter((s) => s.status === "delayed").length;

  const totalInventoryValue = filteredStock.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    return acc + (product ? product.unitCost * item.quantity : 0);
  }, 0);

  const deliveredShipments = filteredShipments.filter((s) => s.status === "delivered");
  const onTimeCount = deliveredShipments.filter(isShipmentOnTime).length;
  const onTimeRate =
    deliveredShipments.length > 0
      ? Math.round((onTimeCount / deliveredShipments.length) * 100)
      : 94;

  // Chart data: Delivery performance trend
  const deliverySeries = dailySeries(
    `delivery-${selectedWarehouseId}`,
    dateRange,
    onTimeRate,
    0.08,
  ).map((pt) => ({
    date: pt.date.slice(5),
    rate: Math.min(100, Math.round(pt.value)),
  }));

  // Chart data: Inventory distribution by warehouse or category
  const inventoryByWarehouse = warehouses.map((wh) => {
    const whStock = stock.filter((s) => s.warehouseId === wh.id);
    const value = whStock.reduce((acc, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return acc + (p ? p.unitCost * item.quantity : 0);
    }, 0);
    return { name: wh.code, fullName: wh.name, value: Math.round(value) };
  });

  const activeAlerts = alerts.filter((a) => !a.resolved).slice(0, 4);
  const recentShipments = filteredShipments.slice(0, 5);
  const recentActivities = activity.slice(0, 5);

  return (
    <AppShell
      pageTitle="Operations Overview"
      breadcrumbs={[{ label: "EcoChain AI", href: "/overview" }, { label: "Overview" }]}
    >
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Operations Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time intelligence across supply chain logistics, facilities, and inventory
              health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Selector */}
            <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs">
              {(["7d", "30d", "90d"] as DateRangePreset[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    dateRange === range
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range === "7d"
                    ? "Past 7 Days"
                    : range === "30d"
                      ? "Past 30 Days"
                      : "Past 90 Days"}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 px-3 gap-2 text-xs border-border"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              />
              <span>{isRefreshing ? "Updating..." : "Refresh"}</span>
            </Button>
          </div>
        </div>

        {/* Bento KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Active Orders"
            value={formatNumber(activeOrders)}
            icon={Truck}
            trend={{ value: 4.8, isPositiveGood: true, label: "vs prior period" }}
            subtitle={`${totalOrders} lifetime dispatches`}
            to="/shipments"
          />
          <KpiCard
            title="Inventory Value"
            value={formatMoney(totalInventoryValue)}
            icon={Boxes}
            trend={{ value: 2.1, isPositiveGood: true, label: "network aggregate" }}
            subtitle={`${filteredStock.length} SKU locations tracked`}
            to="/inventory"
          />
          <KpiCard
            title="On-Time Delivery Rate"
            value={`${onTimeRate}%`}
            icon={PackageCheck}
            trend={{ value: 1.4, isPositiveGood: true, label: "target 95%" }}
            subtitle={`${deliveredShipments.length} deliveries verified`}
            to="/shipments"
          />
          <KpiCard
            title="Delayed Shipments"
            value={formatNumber(delayedShipments)}
            icon={AlertTriangle}
            trend={{
              value: delayedShipments > 0 ? -12 : 0,
              isPositiveGood: false,
              label: "exceptions",
            }}
            subtitle={delayedShipments > 0 ? "Requires rerouting action" : "Zero active delays"}
            to="/shipments"
          />
        </div>

        {/* AI Operations Briefing Banner (Bento style) */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card p-5 relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span>AI Daily Operations Briefing</span>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Simulated
                  </span>
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Updated{" "}
                  {new Date(lastRefreshedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Distribution operations are operating at <strong>94% on-time efficiency</strong>{" "}
                across 4 facilities. Priority action needed:{" "}
                <strong>Cheddar Cheese stock at Chennai South</strong> is near zero while Bengaluru
                holds surplus; recommending a 40-block inventory rebalance. Route plan{" "}
                <strong>RP001</strong> offers 21.6% emission reduction upon optimization.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/ai-insights"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Review AI recommendations <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-border">•</span>
                <Link
                  to="/route-planner"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  Inspect suggested routes <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Two-Column Analytics Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Delivery Performance Chart (2 Cols) */}
          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Delivery Performance & SLA Trend
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Daily on-time percentage over the selected {dateRange} timeframe
                </CardDescription>
              </div>
              <Link
                to="/reports"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                Analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={deliverySeries}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="deliveryFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#176B4D" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#176B4D" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="oklch(0.923 0.008 151.9 / 0.5)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[80, 100]}
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <Tooltip
                      formatter={(val: number) => [`${val}%`, "On-Time Rate"]}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#176B4D"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#deliveryFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Distribution Chart (1 Col) */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground">
                Inventory Valuation by Hub
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Asset capital distribution across regional hubs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryByWarehouse}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {inventoryByWarehouse.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatMoney(val), "Value"]}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                {inventoryByWarehouse.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="font-medium text-foreground truncate">{item.name}:</span>
                    <span className="text-muted-foreground font-semibold">
                      {formatMoney(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Alerts & Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Alerts */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Actionable Operational Alerts
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Critical anomalies requiring immediate supply chain attention
                </CardDescription>
              </div>
              <Link
                to="/ai-insights"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                All insights <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No open priority alerts at this time.
                  </p>
                ) : (
                  activeAlerts.map((alert) => {
                    const targetLink =
                      alert.refType === "product"
                        ? `/inventory/${alert.refId}`
                        : `/shipments/${alert.refId}`;
                    return (
                      <div
                        key={alert.id}
                        className="p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={alert.severity} />
                            <span className="text-xs font-semibold text-foreground truncate">
                              {alert.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {alert.message}
                          </p>
                        </div>
                        <Link
                          to={targetLink}
                          className="shrink-0 text-xs font-medium text-primary hover:underline"
                        >
                          Resolve →
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Operational Activity */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Recent Operational Activity
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Audit log of dispatches, inventory intakes, and AI actions
                </CardDescription>
              </div>
              <Link
                to="/inventory"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                Inventory log <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start justify-between gap-3 text-xs pb-2.5 border-b border-border/50 last:border-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{act.message}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • System verified
                      </p>
                    </div>
                    {act.linkTo && (
                      <Link
                        to={act.linkTo}
                        className="text-[11px] font-semibold text-primary hover:underline shrink-0"
                      >
                        View
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Shipments Table Preview */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                In-Flight & Recent Shipments
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Active consignments across the distribution network
              </CardDescription>
            </div>
            <Link
              to="/shipments"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              View all shipments <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Tracking ID</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">Carrier</th>
                    <th className="py-2.5 px-3">ETA</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentShipments.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-foreground">{s.trackingId}</td>
                      <td className="py-2.5 px-3 text-foreground">{s.destination}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{s.carrier}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(s.estimatedArrival).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <ShipmentStatusBadge status={s.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to="/shipments/$shipmentId"
                          params={{ shipmentId: s.id }}
                          className="font-semibold text-primary hover:underline"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
