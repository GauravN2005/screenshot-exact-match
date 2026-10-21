import React, { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import { daysUntilExpiry, formatMoney, formatNumber, isNearExpiry, stockStatus } from "@/lib/calc";
import { StockStatusBadge, SeverityBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  Calendar,
  Clock,
  Edit,
  History,
  Layers,
  Package,
  Plus,
  ShieldAlert,
  Tag,
  Truck,
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
import type { StockRecord } from "@/types";

export const Route = createFileRoute("/inventory/$productId")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = useParams({ from: "/inventory/$productId" });
  const { products, stock, warehouses, movements, alerts } = useDemoStore();

  const product = products.find((p) => p.id === productId);

  // Modal states
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState(product?.name ?? "");
  const [editCategory, setEditCategory] = useState(product?.category ?? "");
  const [editCost, setEditCost] = useState(String(product?.unitCost ?? 0));
  const [editReorder, setEditReorder] = useState(String(product?.reorderLevel ?? 0));
  const [editSupplier, setEditSupplier] = useState(product?.supplier ?? "");

  // Adjust stock fields
  const [adjustWarehouseId, setAdjustWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [adjustQty, setAdjustQty] = useState(0);

  // Transfer fields
  const [transferFromWh, setTransferFromWh] = useState(warehouses[0]?.id ?? "");
  const [transferToWh, setTransferToWh] = useState(warehouses[1]?.id ?? "");
  const [transferQuantity, setTransferQuantity] = useState(10);

  if (!product) {
    return (
      <AppShell pageTitle="Product Not Found">
        <div className="py-16 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Product with ID {productId} does not exist.
          </p>
          <Link to="/inventory">
            <Button variant="outline">Back to Inventory</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Stock allocations
  const whStock = stock.filter((s) => s.productId === product.id);
  const totalStock = whStock.reduce((acc, s) => acc + s.quantity, 0);

  // Aggregate stock status
  const aggregateRecord: StockRecord = {
    productId: product.id,
    warehouseId: "all",
    quantity: totalStock,
  };
  const currentStatus = stockStatus(aggregateRecord, product);

  // Product movements
  const productMovements = movements.filter((m) => m.productId === product.id);

  // Related alerts
  const productAlerts = alerts.filter(
    (a) => a.refType === "product" && a.refId === product.id && !a.resolved,
  );

  // Handlers
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(editCost);
    const reorder = parseInt(editReorder, 10);
    demoStore.updateProduct(product.id, {
      name: editName,
      category: editCategory,
      unitCost: isNaN(cost) ? product.unitCost : cost,
      reorderLevel: isNaN(reorder) ? product.reorderLevel : reorder,
      supplier: editSupplier,
    });
    toast.success("Product details updated");
    setEditOpen(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    demoStore.updateStock(product.id, adjustWarehouseId, adjustQty, "Manual inventory recount");
    toast.success(`Stock updated at ${warehouses.find((w) => w.id === adjustWarehouseId)?.name}`);
    setAdjustOpen(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = demoStore.transferStock(
      product.id,
      transferFromWh,
      transferToWh,
      transferQuantity,
      "Inter-warehouse rebalance",
    );
    if (res.success) {
      toast.success(`Transferred ${transferQuantity} units successfully`);
      setTransferOpen(false);
    } else {
      toast.error(res.error ?? "Transfer failed");
    }
  };

  return (
    <AppShell
      pageTitle={product.name}
      breadcrumbs={[
        { label: "EcoChain AI", href: "/overview" },
        { label: "Inventory", href: "/inventory" },
        { label: product.sku },
      ]}
    >
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Inventory
            </Link>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{product.name}</h2>
              <StockStatusBadge status={currentStatus} />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              SKU: {product.sku} • Category: {product.category}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(product.name);
                setEditCategory(product.category);
                setEditCost(String(product.unitCost));
                setEditReorder(String(product.reorderLevel));
                setEditSupplier(product.supplier);
                setEditOpen(true);
              }}
              className="h-9 px-3 gap-1.5 text-xs border-border"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const wh = warehouses[0]?.id ?? "";
                setAdjustWarehouseId(wh);
                setAdjustQty(whStock.find((s) => s.warehouseId === wh)?.quantity ?? 0);
                setAdjustOpen(true);
              }}
              className="h-9 px-3 gap-1.5 text-xs border-border"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Adjust Stock</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setTransferFromWh(warehouses[0]?.id ?? "");
                setTransferToWh(warehouses[1]?.id ?? "");
                setTransferOpen(true);
              }}
              className="h-9 px-3 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer Stock</span>
            </Button>
          </div>
        </div>

        {/* Product Attributes Bento Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-border bg-card">
            <div className="text-xs text-muted-foreground">Network Total Stock</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {formatNumber(totalStock)}{" "}
              <span className="text-xs font-normal text-muted-foreground">{product.unit}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Across 4 facilities</div>
          </Card>

          <Card className="p-4 border-border bg-card">
            <div className="text-xs text-muted-foreground">Unit Acquisition Cost</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {formatMoney(product.unitCost)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Valuation: {formatMoney(totalStock * product.unitCost)}
            </div>
          </Card>

          <Card className="p-4 border-border bg-card">
            <div className="text-xs text-muted-foreground">Reorder Threshold</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {product.reorderLevel}{" "}
              <span className="text-xs font-normal text-muted-foreground">{product.unit}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {totalStock <= product.reorderLevel ? (
                <span className="text-rose-600 font-semibold">Below minimum</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Healthy buffer</span>
              )}
            </div>
          </Card>

          <Card className="p-4 border-border bg-card">
            <div className="text-xs text-muted-foreground">Batch Expiration</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {product.expiryDate ? (
                <span
                  className={
                    daysUntilExpiry(product) <= 30
                      ? "text-amber-600 text-lg sm:text-2xl"
                      : "text-lg sm:text-2xl"
                  }
                >
                  {new Date(product.expiryDate).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              ) : (
                <span className="text-base text-muted-foreground font-normal">Non-perishable</span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {product.expiryDate
                ? `${daysUntilExpiry(product)} days remaining`
                : "Indefinite shelf life"}
            </div>
          </Card>
        </div>

        {/* Active Alerts for this Product */}
        {productAlerts.length > 0 && (
          <Card className="border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Active Operational Attention Required
                </h4>
                {productAlerts.map((a) => (
                  <p key={a.id} className="text-xs text-amber-800 dark:text-amber-300">
                    {a.message}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Warehouse Stock Allocations */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground">
              Regional Warehouse Stock Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Inventory distribution and safety thresholds across all nodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map((wh) => {
                const whRecord = whStock.find((s) => s.warehouseId === wh.id);
                const qty = whRecord?.quantity ?? 0;
                const percentage = totalStock > 0 ? Math.round((qty / totalStock) * 100) : 0;

                return (
                  <div
                    key={wh.id}
                    className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold text-foreground">{wh.name}</span>
                        <span className="text-[10px] text-muted-foreground">({wh.code})</span>
                      </div>
                      <span className="font-bold text-foreground">
                        {formatNumber(qty)} {product.unit}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>{percentage}% of network pool</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustWarehouseId(wh.id);
                          setAdjustQty(qty);
                          setAdjustOpen(true);
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        Adjust count →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stock Movement History Timeline */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground">
              Stock Movement & Intake Audit Log
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Chronological log of transfers, adjustments, and supplier receipts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productMovements.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No recorded stock movements yet for this product.
              </p>
            ) : (
              <div className="space-y-3">
                {productMovements.map((m) => {
                  const wh = warehouses.find((w) => w.id === m.warehouseId);
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg border border-border/60 bg-muted/10 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border">
                            {m.type.replace("_", " ")}
                          </span>
                          <span className="font-medium text-foreground">{m.note}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Facility: {wh?.name ?? m.warehouseId} • Quantity:{" "}
                          <strong>
                            {m.quantity} {product.unit}
                          </strong>
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(m.timestamp).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog: Edit Product */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Product Details</DialogTitle>
              <DialogDescription>Update attributes for {product.sku}.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="editName">Product Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editCat">Category</Label>
                  <Input
                    id="editCat"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editSup">Supplier</Label>
                  <Input
                    id="editSup"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editCost">Unit Cost ($)</Label>
                  <Input
                    id="editCost"
                    type="number"
                    step="0.01"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editReorder">Reorder Threshold</Label>
                  <Input
                    id="editReorder"
                    type="number"
                    value={editReorder}
                    onChange={(e) => setEditReorder(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Adjust Stock */}
        <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Adjust Stock Quantity</DialogTitle>
              <DialogDescription>Update on-hand count for {product.name}.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <Label>Warehouse Facility</Label>
                <Select value={adjustWarehouseId} onValueChange={setAdjustWarehouseId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="qtyVal">New Available Count ({product.unit})</Label>
                <Input
                  id="qtyVal"
                  type="number"
                  min="0"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                  Save Count
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Transfer Stock */}
        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Transfer Stock Between Warehouses</DialogTitle>
              <DialogDescription>
                Move available units of {product.name} between nodes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTransferSubmit} className="space-y-3.5 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Source Hub</Label>
                  <Select value={transferFromWh} onValueChange={setTransferFromWh}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Destination Hub</Label>
                  <Select value={transferToWh} onValueChange={setTransferToWh}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="transCount">Transfer Quantity ({product.unit})</Label>
                <Input
                  id="transCount"
                  type="number"
                  min="1"
                  required
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTransferOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                  Confirm Transfer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
