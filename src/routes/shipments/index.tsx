import React, { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import { formatNumber } from "@/lib/calc";
import { downloadCsv } from "@/lib/csv";
import { ShipmentStatusBadge } from "@/components/StatusBadge";
import {
  Truck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Shipment, ShipmentStatus } from "@/types";

export const Route = createFileRoute("/shipments/")({
  component: ShipmentsPage,
});

function ShipmentsPage() {
  const { shipments, warehouses, selectedWarehouseId } = useDemoStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Delay simulation dialog
  const [delayOpen, setDelayOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [delayReason, setDelayReason] = useState("Severe weather / road obstruction");

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchesWarehouse =
        selectedWarehouseId === "all" ? true : s.originWarehouseId === selectedWarehouseId;

      const matchesSearch =
        s.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.orderRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.carrier.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" ? true : s.status === statusFilter;

      const matchesCarrier = carrierFilter === "all" ? true : s.carrier === carrierFilter;

      return matchesWarehouse && matchesSearch && matchesStatus && matchesCarrier;
    });
  }, [shipments, selectedWarehouseId, searchTerm, statusFilter, carrierFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Summary Metrics
  const activeCount = shipments.filter(
    (s) => s.status === "in_transit" || s.status === "preparing",
  ).length;
  const delayedCount = shipments.filter((s) => s.status === "delayed").length;
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length;
  const totalCount = shipments.length;

  // Carriers list
  const carriers = Array.from(new Set(shipments.map((s) => s.carrier)));

  // CSV Export
  const handleExportCsv = () => {
    const csvData = filteredShipments.map((s) => {
      const wh = warehouses.find((w) => w.id === s.originWarehouseId);
      return {
        TrackingID: s.trackingId,
        OrderRef: s.orderRef,
        OriginWarehouse: wh?.name ?? s.originWarehouseId,
        Destination: s.destination,
        Carrier: s.carrier,
        Vehicle: s.vehicle,
        DistanceKm: s.distanceKm,
        DispatchDate: s.dispatchDate,
        EstimatedArrival: s.estimatedArrival,
        Status: s.status,
        DelayReason: s.delayReason ?? "None",
      };
    });
    downloadCsv(`ecochain-shipments-${new Date().toISOString().slice(0, 10)}.csv`, csvData);
    toast.success(`Exported ${csvData.length} shipment records to CSV`);
  };

  const handleSimulateDelay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    demoStore.simulateShipmentDelay(selectedShipment.id, delayReason);
    toast.warning(`Delay simulated for ${selectedShipment.trackingId}`);
    setDelayOpen(false);
  };

  const handleMarkDelivered = (shipmentId: string) => {
    demoStore.updateShipmentStatus(shipmentId, "delivered", "Delivered on schedule");
    toast.success("Shipment marked as delivered");
  };

  return (
    <AppShell
      pageTitle="Shipment Tracking"
      breadcrumbs={[{ label: "EcoChain AI", href: "/overview" }, { label: "Shipments" }]}
    >
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Shipment Tracking & Logistics
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitor in-flight consignments, carrier performance, and delivery exceptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Consignments"
            value={formatNumber(totalCount)}
            icon={Truck}
            subtitle="Full active network"
          />
          <KpiCard
            title="Active In-Transit"
            value={formatNumber(activeCount)}
            icon={Clock}
            subtitle="En route to destinations"
          />
          <KpiCard
            title="Delayed Shipments"
            value={formatNumber(delayedCount)}
            icon={AlertTriangle}
            trend={{
              value: delayedCount > 0 ? -delayedCount : 0,
              isPositiveGood: false,
              label: "exceptions",
            }}
            subtitle={delayedCount > 0 ? "Requires mitigation" : "Zero delays"}
          />
          <KpiCard
            title="Completed Deliveries"
            value={formatNumber(deliveredCount)}
            icon={CheckCircle2}
            trend={{ value: 94.2, isPositiveGood: true, label: "SLA compliance" }}
            subtitle="Delivered successfully"
          />
        </div>

        {/* Filters Card */}
        <Card className="p-4 border-border bg-card">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search tracking ID, order, carrier..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={carrierFilter}
                onValueChange={(val) => {
                  setCarrierFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  {carriers.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Shipments Table */}
        <Card className="border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Tracking ID</th>
                  <th className="py-3 px-4 font-semibold">Order Ref</th>
                  <th className="py-3 px-4 font-semibold">Origin Hub</th>
                  <th className="py-3 px-4 font-semibold">Destination</th>
                  <th className="py-3 px-4 font-semibold">Carrier / Vehicle</th>
                  <th className="py-3 px-4 font-semibold">Dispatch Date</th>
                  <th className="py-3 px-4 font-semibold">ETA</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedShipments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                      No matching shipments found. Try adjusting your search query or status filter.
                    </td>
                  </tr>
                ) : (
                  paginatedShipments.map((s) => {
                    const originWh = warehouses.find((w) => w.id === s.originWarehouseId);
                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="py-3 px-4">
                          <Link
                            to="/shipments/$shipmentId"
                            params={{ shipmentId: s.id }}
                            className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <span>{s.trackingId}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{s.orderRef}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {originWh?.city ?? s.originWarehouseId}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{s.destination}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {s.carrier} ({s.vehicle})
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(s.dispatchDate).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(s.estimatedArrival).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <ShipmentStatusBadge status={s.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {s.status === "in_transit" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedShipment(s);
                                  setDelayOpen(true);
                                }}
                                className="h-7 px-2 text-[11px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              >
                                Simulate Delay
                              </Button>
                            )}

                            {s.status !== "delivered" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkDelivered(s.id)}
                                className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                Deliver
                              </Button>
                            )}

                            <Link
                              to="/shipments/$shipmentId"
                              params={{ shipmentId: s.id }}
                              className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-semibold transition-colors"
                            >
                              Details →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {filteredShipments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredShipments.length)} of{" "}
              {filteredShipments.length} shipments
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
              <span className="font-semibold text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 px-2.5 text-xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Dialog: Simulate Delay */}
        <Dialog open={delayOpen} onOpenChange={setDelayOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Simulate Shipment Delay Exception</DialogTitle>
              <DialogDescription>
                Simulate weather, mechanical, or checkpoint congestion delay for demo testing.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSimulateDelay} className="space-y-3.5 py-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="font-semibold text-foreground">
                  {selectedShipment?.trackingId}
                </span>
                <span className="text-muted-foreground"> → {selectedShipment?.destination}</span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reason">Delay Reason Description</Label>
                <Input
                  id="reason"
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
                  Apply Delay Exception
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
