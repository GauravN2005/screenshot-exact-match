import React, { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SchematicMap } from "@/components/SchematicMap";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import { DESTINATIONS, VEHICLES } from "@/data/seed";
import {
  computeRouteMetrics,
  formatKg,
  formatKm,
  formatMinutes,
  formatMoneyPrecise,
  type RoutePoint,
} from "@/lib/calc";
import {
  Navigation,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Truck,
  Zap,
  TrendingDown,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { RoutePlan, VehicleType } from "@/types";

export const Route = createFileRoute("/route-planner")({
  component: RoutePlannerPage,
});

function RoutePlannerPage() {
  const { warehouses, routePlans, selectedWarehouseId } = useDemoStore();

  const [originWhId, setOriginWhId] = useState<string>(
    selectedWarehouseId !== "all" ? selectedWarehouseId : (warehouses[0]?.id ?? "wh-blr"),
  );
  const [destinationName, setDestinationName] = useState<string>("Hyderabad");
  const [stops, setStops] = useState<string[]>(["Nagpur"]);
  const [newStopInput, setNewStopInput] = useState<string>("");
  const [vehicle, setVehicle] = useState<VehicleType>("reefer");
  const [priority, setPriority] = useState<"standard" | "express" | "economy">("standard");
  const [activeMapView, setActiveMapView] = useState<"suggested" | "current">("suggested");
  const [isApproved, setIsApproved] = useState(false);

  // Lookup destination coordinates
  const destPoint = useMemo(() => {
    const found = DESTINATIONS.find((d) => d.name.toLowerCase() === destinationName.toLowerCase());
    return found ? { x: found.x, y: found.y } : { x: 64, y: 66 };
  }, [destinationName]);

  const originWh = warehouses.find((w) => w.id === originWhId) ?? warehouses[0];
  const originPoint: RoutePoint = useMemo(() => {
    return originWh ? { x: originWh.mapX, y: originWh.mapY } : { x: 58, y: 70 };
  }, [originWh]);

  const stopPoints: RoutePoint[] = useMemo(() => {
    return stops
      .map((name) => {
        const d = DESTINATIONS.find((dest) => dest.name.toLowerCase() === name.toLowerCase());
        return d ? { x: d.x, y: d.y } : null;
      })
      .filter((p): p is RoutePoint => Boolean(p));
  }, [stops]);

  // Compute metrics deterministically
  const { current: currentMetrics, suggested: suggestedMetrics } = useMemo(() => {
    return computeRouteMetrics(originPoint, destPoint, stopPoints, vehicle, priority);
  }, [originPoint, destPoint, stopPoints, vehicle, priority]);

  // Savings calculations
  const distanceSavings = Math.round(
    ((currentMetrics.distanceKm - suggestedMetrics.distanceKm) / currentMetrics.distanceKm) * 100,
  );
  const fuelSavings = Math.round(
    ((currentMetrics.fuelCost - suggestedMetrics.fuelCost) / currentMetrics.fuelCost) * 100,
  );
  const emissionSavings = Math.round(
    ((currentMetrics.emissionsKg - suggestedMetrics.emissionsKg) / currentMetrics.emissionsKg) *
      100,
  );
  const timeSavingsMinutes = currentMetrics.travelMinutes - suggestedMetrics.travelMinutes;

  // Add Stop
  const handleAddStop = () => {
    if (!newStopInput) return;
    if (stops.includes(newStopInput)) {
      toast.error("Stop already added to route sequence");
      return;
    }
    setStops([...stops, newStopInput]);
    setNewStopInput("");
    setIsApproved(false);
  };

  // Remove Stop
  const handleRemoveStop = (stopToRemove: string) => {
    setStops(stops.filter((s) => s !== stopToRemove));
    setIsApproved(false);
  };

  // Approve & Save Plan
  const handleApprovePlan = () => {
    const newPlan: RoutePlan = {
      id: `RP${String(routePlans.length + 1).padStart(3, "0")}`,
      originWarehouseId: originWhId,
      destination: destinationName,
      destinationPoint: destPoint,
      stops,
      vehicle,
      priority,
      createdAt: new Date().toISOString(),
      status: "approved",
      current: currentMetrics,
      suggested: suggestedMetrics,
    };

    demoStore.approveRoutePlan(newPlan);
    setIsApproved(true);
    toast.success(`Route plan to ${destinationName} approved & saved to operations log!`);
  };

  return (
    <AppShell
      pageTitle="Smart Route Planner"
      breadcrumbs={[{ label: "EcoChain AI", href: "/overview" }, { label: "Route Planner" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Smart Route Planner & Simulator
            </h2>
            <p className="text-sm text-muted-foreground">
              Compare transit corridors, optimize multimodal logistics, and minimize fleet carbon
              emissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Simulated Optimization Engine</span>
            </span>
          </div>
        </div>

        {/* Two-Column Desktop Layout (Map Left, Configuration & Comparison Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Area (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <SchematicMap
              warehouses={warehouses}
              originWarehouseId={originWhId}
              destination={destinationName}
              destinationPoint={destPoint}
              stops={stops}
              activeView={activeMapView}
              onToggleView={setActiveMapView}
            />

            {/* Approved Route Plans Audit Preview */}
            <Card className="border-border bg-card p-4">
              <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recently Approved Operations Route Plans ({routePlans.length})</span>
              </h4>
              <div className="space-y-2">
                {routePlans.slice(0, 3).map((plan) => {
                  const wh = warehouses.find((w) => w.id === plan.originWarehouseId);
                  return (
                    <div
                      key={plan.id}
                      className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground font-semibold">
                          {plan.id}
                        </span>
                        <span className="font-semibold text-foreground">
                          {wh?.name ?? plan.originWarehouseId} → {plan.destination}
                        </span>
                        {plan.stops.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            (via {plan.stops.join(", ")})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          {formatKm(plan.suggested.distanceKm)} (
                          {formatKg(plan.suggested.emissionsKg)} CO2e)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 uppercase">
                          {plan.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Configuration & Comparison Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span>Route Parameters & Stops</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Configure origin, destination, intermediate delivery stops, and fleet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Origin Facility */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Origin Warehouse Hub</Label>
                  <Select
                    value={originWhId}
                    onValueChange={(val) => {
                      setOriginWhId(val);
                      setIsApproved(false);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Destination Hub */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Final Destination Consignee</Label>
                  <Select
                    value={destinationName}
                    onValueChange={(val) => {
                      setDestinationName(val);
                      setIsApproved(false);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DESTINATIONS.map((d) => (
                        <SelectItem key={d.name} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Intermediate Stops */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Intermediate Delivery Stops</Label>
                    <span className="text-[11px] text-muted-foreground">
                      {stops.length} stops added
                    </span>
                  </div>

                  {stops.length > 0 && (
                    <div className="space-y-1.5">
                      {stops.map((stop, idx) => (
                        <div
                          key={stop}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-foreground">{stop}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStop(stop)}
                            className="h-6 w-6 text-muted-foreground hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Stop Input */}
                  <div className="flex items-center gap-2">
                    <Select value={newStopInput} onValueChange={setNewStopInput}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Add delivery stop..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DESTINATIONS.filter(
                          (d) => d.name !== destinationName && !stops.includes(d.name),
                        ).map((d) => (
                          <SelectItem key={d.name} value={d.name}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddStop}
                      disabled={!newStopInput}
                      className="h-8 px-2.5 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                {/* Vehicle & Priority */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/60">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Vehicle Type</Label>
                    <Select
                      value={vehicle}
                      onValueChange={(v) => {
                        setVehicle(v as VehicleType);
                        setIsApproved(false);
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VEHICLES).map(([key, v]) => (
                          <SelectItem key={key} value={key}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Service Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(p) => {
                        setPriority(p as "standard" | "express" | "economy");
                        setIsApproved(false);
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="express">Express Priority</SelectItem>
                        <SelectItem value="economy">Economy Green</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Comparison Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span>Current vs. Suggested Route</span>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    -{distanceSavings > 0 ? distanceSavings : 0}% distance
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Simulated multi-point optimization metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs">
                {/* Metric Rows */}
                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated Distance:</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        {formatKm(currentMetrics.distanceKm)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-bold text-foreground">
                        {formatKm(suggestedMetrics.distanceKm)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated Travel Time:</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        {formatMinutes(currentMetrics.travelMinutes)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-bold text-foreground">
                        {formatMinutes(suggestedMetrics.travelMinutes)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated Fuel Cost:</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        {formatMoneyPrecise(currentMetrics.fuelCost)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-bold text-foreground">
                        {formatMoneyPrecise(suggestedMetrics.fuelCost)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <span className="font-semibold text-foreground">Carbon Emissions:</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        {formatKg(currentMetrics.emissionsKg)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatKg(suggestedMetrics.emissionsKg)} CO2e
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approve Button */}
                <Button
                  onClick={handleApprovePlan}
                  disabled={isApproved}
                  className={`w-full h-10 font-semibold gap-2 ${
                    isApproved
                      ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isApproved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Route Approved & Dispatched</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Approve & Save Suggested Plan</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
