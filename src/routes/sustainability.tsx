import React, { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { useDemoStore } from "@/hooks/use-demo-store";
import { dailySeries, daysUntilExpiry, formatKg, formatMoney, formatNumber } from "@/lib/calc";
import { downloadCsv } from "@/lib/csv";
import { VEHICLES } from "@/data/seed";
import {
  Leaf,
  Fuel,
  Trash2,
  Sparkles,
  Download,
  Info,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Sliders,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Legend,
} from "recharts";
import { toast } from "sonner";
import type { DateRangePreset } from "@/types";

export const Route = createFileRoute("/sustainability")({
  component: SustainabilityPage,
});

function SustainabilityPage() {
  const { shipments, products, stock, warehouses, selectedWarehouseId } = useDemoStore();

  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [scenario, setScenario] = useState<"baseline" | "optimized">("optimized");

  // Filtered shipments & stock
  const filteredShipments = useMemo(() => {
    return selectedWarehouseId === "all"
      ? shipments
      : shipments.filter((s) => s.originWarehouseId === selectedWarehouseId);
  }, [shipments, selectedWarehouseId]);

  const filteredStock = useMemo(() => {
    return selectedWarehouseId === "all"
      ? stock
      : stock.filter((s) => s.warehouseId === selectedWarehouseId);
  }, [stock, selectedWarehouseId]);

  // Total calculated emissions (kg)
  const baselineEmissions = useMemo(() => {
    return filteredShipments.reduce((sum, s) => {
      const v = VEHICLES[s.vehicle];
      return sum + s.distanceKm * (v ? v.emissionFactor : 0.42);
    }, 0);
  }, [filteredShipments]);

  // Fuel usage (liters)
  const baselineFuel = useMemo(() => {
    return filteredShipments.reduce((sum, s) => {
      const v = VEHICLES[s.vehicle];
      return sum + s.distanceKm * (v ? v.fuelPerKm : 0.18);
    }, 0);
  }, [filteredShipments]);

  // Waste / Expiry risk value ($)
  const wasteRiskValue = useMemo(() => {
    return filteredStock.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod || !prod.expiryDate) return sum;
      const days = daysUntilExpiry(prod);
      if (days <= 30) {
        return sum + item.quantity * prod.unitCost;
      }
      return sum;
    }, 0);
  }, [filteredStock, products]);

  // Optimization simulation: 18.4% reduction
  const optimizedEmissions = Math.round(baselineEmissions * 0.816);
  const emissionsAvoided = Math.round(baselineEmissions - optimizedEmissions);
  const optimizedFuel = Math.round(baselineFuel * 0.816);

  const displayEmissions = scenario === "optimized" ? optimizedEmissions : baselineEmissions;
  const displayFuel = scenario === "optimized" ? optimizedFuel : baselineFuel;

  // Chart: Emissions trend series
  const emissionsTrend = useMemo(() => {
    return dailySeries(
      `emissions-${selectedWarehouseId}-${scenario}`,
      dateRange,
      displayEmissions / 30,
      0.2,
    ).map((pt) => ({
      date: pt.date.slice(5),
      emissions: Math.round(pt.value * 10) / 10,
      target: Math.round(pt.value * 0.85 * 10) / 10,
    }));
  }, [selectedWarehouseId, scenario, dateRange, displayEmissions]);

  // Chart: Emissions by carrier / vehicle
  const emissionsByVehicle = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const s of filteredShipments) {
      const v = VEHICLES[s.vehicle];
      const em = s.distanceKm * (v ? v.emissionFactor : 0.42);
      grouped[s.vehicle] = (grouped[s.vehicle] ?? 0) + em;
    }
    return Object.entries(grouped).map(([veh, total]) => ({
      vehicle: veh.replace("_", " ").toUpperCase(),
      emissions: Math.round(scenario === "optimized" ? total * 0.82 : total),
    }));
  }, [filteredShipments, scenario]);

  // High waste risk items
  const highWasteItems = useMemo(() => {
    return products
      .filter((p) => p.expiryDate && daysUntilExpiry(p) <= 30)
      .map((p) => {
        const totalQty = filteredStock
          .filter((s) => s.productId === p.id)
          .reduce((acc, s) => acc + s.quantity, 0);
        return {
          product: p,
          quantity: totalQty,
          daysLeft: daysUntilExpiry(p),
          riskValue: totalQty * p.unitCost,
        };
      })
      .sort((a, b) => b.riskValue - a.riskValue);
  }, [products, filteredStock]);

  // Export CSV
  const handleExportCsv = () => {
    const csvData = [
      {
        Metric: "Estimated Total Carbon Emissions (kg CO2e)",
        Scenario: scenario,
        Value: displayEmissions.toFixed(1),
        Period: dateRange,
      },
      {
        Metric: "Estimated Fuel Usage (Liters)",
        Scenario: scenario,
        Value: displayFuel.toFixed(1),
        Period: dateRange,
      },
      {
        Metric: "Estimated Emissions Avoided (kg CO2e)",
        Scenario: scenario,
        Value: emissionsAvoided.toFixed(1),
        Period: dateRange,
      },
      {
        Metric: "Waste / Expiry Risk Value (USD)",
        Scenario: scenario,
        Value: wasteRiskValue.toFixed(2),
        Period: dateRange,
      },
    ];
    downloadCsv(`ecochain-sustainability-${new Date().toISOString().slice(0, 10)}.csv`, csvData);
    toast.success("Exported sustainability impact report to CSV");
  };

  return (
    <AppShell
      pageTitle="Sustainability & ESG"
      breadcrumbs={[{ label: "EcoChain AI", href: "/overview" }, { label: "Sustainability" }]}
    >
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Sustainability & Carbon Footprint</span>
              <Leaf className="w-5 h-5 text-emerald-600" />
            </h2>
            <p className="text-sm text-muted-foreground">
              Scope 1 & 3 freight emission estimates, routing efficiency, and inventory waste
              prevention.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period Selector */}
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
                  {range}
                </button>
              ))}
            </div>

            {/* Scenario Toggle */}
            <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs">
              <button
                type="button"
                onClick={() => setScenario("baseline")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  scenario === "baseline"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Baseline
              </button>
              <button
                type="button"
                onClick={() => setScenario("optimized")}
                className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  scenario === "optimized"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-200" />
                Optimized
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-9 px-3 gap-2 text-xs border-border"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Assumptions Disclosure */}
        <div className="p-3.5 rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong>Calculation standards & assumptions:</strong> Fuel consumption and emission
            factors follow standard GLEC framework averages (Diesel truck: ~0.42 kg CO2e/km; Reefer:
            ~0.49 kg CO2e/km; EV Van: ~0.08 kg CO2e/km grid-average). Figures are deterministic
            operational estimates for decision support.
          </p>
        </div>

        {/* Bento KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Estimated Carbon Footprint"
            value={formatKg(displayEmissions)}
            icon={Leaf}
            trend={{
              value: scenario === "optimized" ? -18.4 : 0,
              isPositiveGood: true,
              label: "emissions impact",
            }}
            subtitle={`Based on ${filteredShipments.length} consignments`}
          />
          <KpiCard
            title="Estimated Fuel Usage"
            value={`${formatNumber(Math.round(displayFuel))} L`}
            icon={Fuel}
            trend={{
              value: scenario === "optimized" ? -18.4 : 0,
              isPositiveGood: true,
              label: "diesel & blend",
            }}
            subtitle="Fleet transit consumption"
          />
          <KpiCard
            title="Waste / Expiry Risk Value"
            value={formatMoney(wasteRiskValue)}
            icon={Trash2}
            trend={{
              value: wasteRiskValue > 0 ? -8.2 : 0,
              isPositiveGood: false,
              label: "perishable stock",
            }}
            subtitle="Expiring within 30 days"
            to="/inventory"
          />
          <KpiCard
            title="Emissions Avoided"
            value={formatKg(emissionsAvoided)}
            icon={Sparkles}
            trend={{ value: 18.4, isPositiveGood: true, label: "via AI route sequencing" }}
            subtitle="Optimized corridor savings"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Emissions Trend (2 cols) */}
          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Fleet Emissions Trajectory & Carbon Cap
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Daily simulated emissions (kg CO2e) vs. Net-Zero compliance cap
                </CardDescription>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {scenario === "optimized" ? "AI Optimized View" : "Baseline Corridor"}
              </span>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={emissionsTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="emissionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
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
                      unit="kg"
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
                      dataKey="emissions"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#emissionsGrad)"
                      name="Emissions"
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#F59E0B"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      fill="none"
                      name="Cap Target"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Emissions by Fleet Vehicle Category (1 col) */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground">
                Emissions by Vehicle Category
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Distribution of carbon output across fleet classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={emissionsByVehicle}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="oklch(0.923 0.008 151.9 / 0.5)"
                    />
                    <XAxis
                      dataKey="vehicle"
                      tick={{ fontSize: 10, fill: "#64748B" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748B" }}
                      tickLine={false}
                      axisLine={false}
                      unit="kg"
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
                    <Bar
                      dataKey="emissions"
                      fill="#176B4D"
                      radius={[4, 4, 0, 0]}
                      name="Emissions (kg CO2e)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Perishable Waste & Spoilage Prevention Table */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Perishable Waste & Near-Expiry Exposure Breakdown
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                High-risk articles expiring within 30 days requiring markdowns or expedited
                transfers
              </CardDescription>
            </div>
            <Link
              to="/inventory"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Open inventory <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {highWasteItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Zero products in active expiry window. Excellent shelf-life compliance.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Available Quantity</th>
                      <th className="py-2.5 px-3">Days Until Expiry</th>
                      <th className="py-2.5 px-3">At-Risk Capital Value</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {highWasteItems.map(({ product, quantity, daysLeft, riskValue }) => (
                      <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {product.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {product.sku}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {quantity} {product.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {daysLeft} days remaining
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {formatMoney(riskValue)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            to="/inventory/$productId"
                            params={{ productId: product.id }}
                            className="font-semibold text-primary hover:underline"
                          >
                            Transfer / Rebalance →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
