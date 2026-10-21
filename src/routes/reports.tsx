import React, { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { useDemoStore } from "@/hooks/use-demo-store";
import { dailySeries, formatKg, formatMoney, formatNumber, isShipmentOnTime } from "@/lib/calc";
import { downloadCsv } from "@/lib/csv";
import { VEHICLES } from "@/data/seed";
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Building2,
  Boxes,
  Truck,
  Leaf,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import type { DateRangePreset } from "@/types";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

type ReportCategory =
  "inventory_performance" | "shipment_performance" | "order_fulfillment" | "sustainability_summary";

function ReportsPage() {
  const { products, stock, shipments, warehouses, selectedWarehouseId } = useDemoStore();

  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [category, setCategory] = useState<ReportCategory>("inventory_performance");
  const [reportWh, setReportWh] = useState<string>(selectedWarehouseId);

  // Filtered dataset
  const filteredStock = useMemo(() => {
    return reportWh === "all" ? stock : stock.filter((s) => s.warehouseId === reportWh);
  }, [stock, reportWh]);

  const filteredShipments = useMemo(() => {
    return reportWh === "all"
      ? shipments
      : shipments.filter((s) => s.originWarehouseId === reportWh);
  }, [shipments, reportWh]);

  // Calculations
  const inventoryVal = filteredStock.reduce((acc, s) => {
    const p = products.find((prod) => prod.id === s.productId);
    return acc + (p ? p.unitCost * s.quantity : 0);
  }, 0);

  const deliveredShipments = filteredShipments.filter((s) => s.status === "delivered");
  const onTimeCount = deliveredShipments.filter(isShipmentOnTime).length;
  const onTimeRate =
    deliveredShipments.length > 0
      ? Math.round((onTimeCount / deliveredShipments.length) * 100)
      : 94;

  const totalEmissions = filteredShipments.reduce((sum, s) => {
    const v = VEHICLES[s.vehicle];
    return sum + s.distanceKm * (v ? v.emissionFactor : 0.42);
  }, 0);

  // Dynamic series based on category
  const chartSeries = useMemo(() => {
    const key = `${category}-${reportWh}-${dateRange}`;
    let base = 85;
    if (category === "inventory_performance") base = 120;
    if (category === "sustainability_summary") base = totalEmissions / 30;

    return dailySeries(key, dateRange, base, 0.15).map((pt) => ({
      date: pt.date.slice(5),
      metric: Math.round(pt.value * 10) / 10,
    }));
  }, [category, reportWh, dateRange, totalEmissions]);

  // CSV Export
  const handleExportCsv = () => {
    let rows: Record<string, string | number>[] = [];

    if (category === "inventory_performance") {
      rows = products.map((p) => {
        const qty = filteredStock
          .filter((s) => s.productId === p.id)
          .reduce((sum, s) => sum + s.quantity, 0);
        return {
          SKU: p.sku,
          Name: p.name,
          Category: p.category,
          Unit: p.unit,
          AvailableCount: qty,
          UnitCost: p.unitCost,
          ValuationUSD: (qty * p.unitCost).toFixed(2),
        };
      });
    } else if (category === "shipment_performance" || category === "order_fulfillment") {
      rows = filteredShipments.map((s) => ({
        TrackingID: s.trackingId,
        OrderRef: s.orderRef,
        Destination: s.destination,
        Carrier: s.carrier,
        Status: s.status,
        DistanceKm: s.distanceKm,
        ETA: s.estimatedArrival,
      }));
    } else {
      rows = [
        { Metric: "Total Calculated Emissions (kg CO2e)", Value: totalEmissions.toFixed(1) },
        { Metric: "Optimized Savings (kg CO2e)", Value: (totalEmissions * 0.184).toFixed(1) },
        { Metric: "On-Time Fulfillment Rate", Value: `${onTimeRate}%` },
      ];
    }

    downloadCsv(`ecochain-report-${category}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success("Executive report exported as CSV");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell
      pageTitle="Reports & Analytics"
      breadcrumbs={[{ label: "EcoChain AI", href: "/overview" }, { label: "Reports" }]}
    >
      <div className="space-y-6">
        {/* Header & Export Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print-hidden">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Operational Reports & Executive Summary</span>
              <FileBarChart className="w-5 h-5 text-primary" />
            </h2>
            <p className="text-sm text-muted-foreground">
              Audit-ready summaries, historical KPI records, and printable statements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3 gap-2 text-xs border-border"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={handleExportCsv}
              className="h-9 px-3 gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Row (Hidden in Print) */}
        <Card className="p-4 border-border bg-card print-hidden">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Selector */}
            <Select value={category} onValueChange={(val) => setCategory(val as ReportCategory)}>
              <SelectTrigger className="w-[210px] h-9 text-xs font-medium">
                <SelectValue placeholder="Report Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventory_performance">Inventory Performance</SelectItem>
                <SelectItem value="shipment_performance">Shipment Performance</SelectItem>
                <SelectItem value="order_fulfillment">Order Fulfillment</SelectItem>
                <SelectItem value="sustainability_summary">Sustainability Summary</SelectItem>
              </SelectContent>
            </Select>

            {/* Warehouse Selector */}
            <Select value={reportWh} onValueChange={setReportWh}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Facility Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities (Network)</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period Selector */}
            <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs ml-auto">
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
                  {range}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Printable Executive Statement Header */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/60">
            <span>EcoChain AI Operations Intelligence Engine</span>
            <span>
              Generated:{" "}
              {new Date().toLocaleDateString([], {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="pt-2">
            <h3 className="text-lg font-bold text-foreground">
              {category === "inventory_performance" &&
                "Inventory Asset Valuation & Replenishment Audit"}
              {category === "shipment_performance" &&
                "Freight Logistics & Carrier SLA Compliance Report"}
              {category === "order_fulfillment" && "Order Fulfillment & Dispatch Velocity Analysis"}
              {category === "sustainability_summary" &&
                "Environmental Impact & Carbon Efficiency Statement"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Scope:{" "}
              {reportWh === "all"
                ? "Enterprise Network (4 Hubs)"
                : warehouses.find((w) => w.id === reportWh)?.name}{" "}
              • Reporting Period: {dateRange}
            </p>
          </div>
        </div>

        {/* Dynamic Category Summary Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {category === "inventory_performance" && (
            <>
              <KpiCard
                title="Network Valuation"
                value={formatMoney(inventoryVal)}
                icon={Boxes}
                subtitle="At standard acquisition cost"
              />
              <KpiCard
                title="Catalog SKUs"
                value={formatNumber(products.length)}
                icon={Layers}
                subtitle="Active product records"
              />
              <KpiCard
                title="Low Stock Items"
                value={formatNumber(filteredStock.filter((s) => s.quantity <= 30).length)}
                icon={Boxes}
                subtitle="Below threshold"
              />
              <KpiCard
                title="Safety Stock Compliance"
                value="96.2%"
                icon={CheckCircle2}
                subtitle="Within safety bounds"
              />
            </>
          )}

          {category === "shipment_performance" && (
            <>
              <KpiCard
                title="Total Dispatches"
                value={formatNumber(filteredShipments.length)}
                icon={Truck}
                subtitle="In selected timeframe"
              />
              <KpiCard
                title="On-Time Delivery Rate"
                value={`${onTimeRate}%`}
                icon={CheckCircle2}
                subtitle="Target 95.0%"
              />
              <KpiCard
                title="Transit Exceptions"
                value={formatNumber(filteredShipments.filter((s) => s.status === "delayed").length)}
                icon={Truck}
                subtitle="Delayed shipments"
              />
              <KpiCard
                title="Avg Transit Distance"
                value={formatKg(
                  filteredShipments.length > 0
                    ? filteredShipments.reduce((sum, s) => sum + s.distanceKm, 0) /
                        filteredShipments.length
                    : 0,
                ).replace("kg", "km")}
                icon={Truck}
                subtitle="Per consignment"
              />
            </>
          )}

          {category === "order_fulfillment" && (
            <>
              <KpiCard
                title="Orders Invoiced"
                value={formatNumber(filteredShipments.length)}
                icon={Boxes}
                subtitle="Outbound volume"
              />
              <KpiCard
                title="Same-Day Dispatch"
                value="91.4%"
                icon={CheckCircle2}
                subtitle="Processed within 24h"
              />
              <KpiCard
                title="Fulfillment Accuracy"
                value="99.2%"
                icon={CheckCircle2}
                subtitle="Zero picking errors"
              />
              <KpiCard
                title="Pending Outbound"
                value={formatNumber(
                  filteredShipments.filter((s) => s.status === "preparing").length,
                )}
                icon={Truck}
                subtitle="In staging dock"
              />
            </>
          )}

          {category === "sustainability_summary" && (
            <>
              <KpiCard
                title="Total Freight Carbon"
                value={formatKg(totalEmissions)}
                icon={Leaf}
                subtitle="Scope 1 & 3 freight output"
              />
              <KpiCard
                title="Emissions Avoided"
                value={formatKg(totalEmissions * 0.184)}
                icon={CheckCircle2}
                subtitle="Via route optimization"
              />
              <KpiCard
                title="Fleet Fuel Burn"
                value={`${formatNumber(Math.round(totalEmissions / 2.68))} L`}
                icon={Leaf}
                subtitle="Diesel & biofuels"
              />
              <KpiCard
                title="Green Fleet Ratio"
                value="28.5%"
                icon={Leaf}
                subtitle="EV & high-efficiency units"
              />
            </>
          )}
        </div>

        {/* Historical Trend Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">
              Historical Operational Trend Analysis
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Daily telemetry over the selected {dateRange} period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
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
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
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
                    dataKey="metric"
                    stroke="#176B4D"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#reportGrad)"
                    name="Performance Metric"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
