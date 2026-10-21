import React, { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import { formatKm, formatKg, formatMoneyPrecise } from "@/lib/calc";
import { ShipmentStatusBadge, SeverityBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  RotateCw,
  ShieldAlert,
  Truck,
  AlertTriangle,
  FileText,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ShipmentStatus } from "@/types";

export const Route = createFileRoute("/shipments/$shipmentId")({
  component: ShipmentDetailPage,
});

function ShipmentDetailPage() {
  const { shipmentId } = useParams({ from: "/shipments/$shipmentId" });
  const { shipments, warehouses, alerts } = useDemoStore();

  const shipment = shipments.find((s) => s.id === shipmentId);

  // Dialogs
  const [delayOpen, setDelayOpen] = useState(false);
  const [delayReason, setDelayReason] = useState("Severe traffic congestion along NH-44");
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState(
    "Rerouted via bypass expressway; carrier resumed active transit.",
  );

  if (!shipment) {
    return (
      <AppShell pageTitle="Shipment Not Found">
        <div className="py-16 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Shipment with ID {shipmentId} does not exist.
          </p>
          <Link to="/shipments">
            <Button variant="outline">Back to Shipments</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const originWh = warehouses.find((w) => w.id === shipment.originWarehouseId);
  const relatedAlerts = alerts.filter(
    (a) => a.refType === "shipment" && a.refId === shipment.id && !a.resolved,
  );

  // Status update handler
  const handleStatusChange = (newStatus: ShipmentStatus) => {
    demoStore.updateShipmentStatus(shipment.id, newStatus);
    toast.success(`Shipment status updated to ${newStatus.replace("_", " ")}`);
  };

  const handleSimulateDelay = (e: React.FormEvent) => {
    e.preventDefault();
    demoStore.simulateShipmentDelay(shipment.id, delayReason);
    toast.warning("Shipment delay simulated");
    setDelayOpen(false);
  };

  const handleRecordResolution = (e: React.FormEvent) => {
    e.preventDefault();
    demoStore.recordShipmentResolution(shipment.id, resolutionNote);
    toast.success("Delay exception resolved");
    setResolutionOpen(false);
  };

  return (
    <AppShell
      pageTitle={shipment.trackingId}
      breadcrumbs={[
        { label: "EcoChain AI", href: "/overview" },
        { label: "Shipments", href: "/shipments" },
        { label: shipment.trackingId },
      ]}
    >
      <div className="space-y-6">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/shipments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Shipments
            </Link>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {shipment.trackingId}
              </h2>
              <ShipmentStatusBadge status={shipment.status} />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Order: {shipment.orderRef} • Carrier: {shipment.carrier} • Vehicle: {shipment.vehicle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Status Dropdown */}
            <Select
              value={shipment.status}
              onValueChange={(val) => handleStatusChange(val as ShipmentStatus)}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>

            {shipment.status === "delayed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResolutionOpen(true)}
                className="h-9 px-3 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Resolve Delay</span>
              </Button>
            )}

            {shipment.status !== "delayed" && shipment.status !== "delivered" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDelayOpen(true)}
                className="h-9 px-3 gap-1.5 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simulate Delay</span>
              </Button>
            )}

            {shipment.status !== "delivered" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("delivered")}
                className="h-9 px-3 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Delivered</span>
              </Button>
            )}
          </div>
        </div>

        {/* Milestone Timeline Card */}
        <Card className="border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Delivery Milestone Progress</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {shipment.milestones.map((m, idx) => (
              <div
                key={m.label}
                className={`p-3 rounded-lg border text-xs space-y-1 relative transition-colors ${
                  m.done
                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                    : "border-border bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{m.label}</span>
                  {m.done && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {m.timestamp
                    ? new Date(m.timestamp).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Pending execution"}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Delay Exception Banner if applicable */}
        {(shipment.delayReason || shipment.resolutionNote) && (
          <Card className="border-amber-300 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                {shipment.delayReason && (
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      Reported Delay Cause:{" "}
                    </span>
                    <span className="text-amber-800 dark:text-amber-300">
                      {shipment.delayReason}
                    </span>
                  </div>
                )}
                {shipment.resolutionNote && (
                  <div className="pt-1 border-t border-amber-200 dark:border-amber-900/60">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300">
                      Resolution Logged:{" "}
                    </span>
                    <span className="text-emerald-800 dark:text-emerald-400">
                      {shipment.resolutionNote}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Shipment Details Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin & Destination Information */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Transit Route Corridor</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Origin fulfillment facility to delivery destination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Origin Warehouse
                  </span>
                  <div className="font-bold text-foreground text-sm">
                    {originWh?.name ?? shipment.originWarehouseId}
                  </div>
                  <div className="text-muted-foreground">
                    {originWh?.city}, {originWh?.region} Region
                  </div>
                </div>
                <Building2 className="w-5 h-5 text-primary shrink-0" />
              </div>

              <div className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Destination Consignee
                  </span>
                  <div className="font-bold text-foreground text-sm">{shipment.destination}</div>
                  <div className="text-muted-foreground">Domestic Destination Hub</div>
                </div>
                <MapPin className="w-5 h-5 text-sky-500 shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-lg border border-border bg-card text-center">
                  <div className="text-muted-foreground text-[10px] uppercase font-semibold">
                    Dispatch Date
                  </div>
                  <div className="font-bold text-foreground text-sm mt-0.5">
                    {new Date(shipment.dispatchDate).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-card text-center">
                  <div className="text-muted-foreground text-[10px] uppercase font-semibold">
                    Estimated Delivery (ETA)
                  </div>
                  <div className="font-bold text-foreground text-sm mt-0.5">
                    {new Date(shipment.estimatedArrival).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logistics & Vehicle Parameters */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span>Fleet & Logistics Metrics</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Carrier service level, distance, and environmental impact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Freight Carrier</span>
                <span className="font-bold text-foreground">{shipment.carrier}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Assigned Vehicle Category</span>
                <span className="font-bold text-foreground uppercase">{shipment.vehicle}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Corridor Distance</span>
                <span className="font-bold text-foreground">{formatKm(shipment.distanceKm)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Estimated Carbon Footprint</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatKg(shipment.distanceKm * 0.42)} CO2e
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Corridor Link</span>
                <Link
                  to="/route-planner"
                  className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Inspect in Route Planner →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog: Simulate Delay */}
        <Dialog open={delayOpen} onOpenChange={setDelayOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Simulate Shipment Delay Exception</DialogTitle>
              <DialogDescription>
                Simulate a transit slip for {shipment.trackingId}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSimulateDelay} className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="simReason">Delay Reason</Label>
                <Input
                  id="simReason"
                  required
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDelayOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Apply Delay
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Record Resolution */}
        <Dialog open={resolutionOpen} onOpenChange={setResolutionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Exception Resolution</DialogTitle>
              <DialogDescription>
                Document the operational mitigation action taken for {shipment.trackingId}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRecordResolution} className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="resNote">Resolution Note</Label>
                <Input
                  id="resNote"
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResolutionOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                  Confirm Resolution
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
