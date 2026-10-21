import React, { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import { daysUntilExpiry, formatMoney, formatNumber, isNearExpiry, stockStatus } from "@/lib/calc";
import { downloadCsv } from "@/lib/csv";
import { StockStatusBadge } from "@/components/StatusBadge";
import {
  Boxes,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  Plus,
  Download,
  Search,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Edit2,
  PackagePlus,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Product, StockRecord, StockStatus } from "@/types";

export const Route = createFileRoute("/inventory/")({
  component: InventoryPage,
});

function InventoryPage() {
  const { products, stock, warehouses, selectedWarehouseId } = useDemoStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Dialog states
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  // Selected item for modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustWarehouseId, setAdjustWarehouseId] = useState<string>("");
  const [adjustQty, setAdjustQty] = useState<number>(0);

  // Transfer form state
  const [transferProductId, setTransferProductId] = useState<string>("");
  const [transferFromWh, setTransferFromWh] = useState<string>("");
  const [transferToWh, setTransferToWh] = useState<string>("");
  const [transferQuantity, setTransferQuantity] = useState<number>(10);

  // Add product form state
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Ambient Groceries");
  const [newUnit, setNewUnit] = useState("units");
  const [newUnitCost, setNewUnitCost] = useState("12.50");
  const [newReorderLevel, setNewReorderLevel] = useState("50");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [newSupplier, setNewSupplier] = useState("EcoSupply Corp");
  const [newInitialQty, setNewInitialQty] = useState("100");
  const [newInitialWh, setNewInitialWh] = useState("wh-blr");

  // Filtered rows
  const inventoryRows = useMemo(() => {
    return products.map((product) => {
      // Find relevant stock records
      const whStock = stock.filter((s) => s.productId === product.id);
      const totalAvailable =
        selectedWarehouseId === "all"
          ? whStock.reduce((acc, s) => acc + s.quantity, 0)
          : (whStock.find((s) => s.warehouseId === selectedWarehouseId)?.quantity ?? 0);

      const record: StockRecord = {
        productId: product.id,
        warehouseId: selectedWarehouseId,
        quantity: totalAvailable,
      };

      const computedStatus = stockStatus(record, product);

      return {
        product,
        quantity: totalAvailable,
        status: computedStatus,
        stockByWh: whStock,
      };
    });
  }, [products, stock, selectedWarehouseId]);

  // Apply search and filters
  const filteredRows = useMemo(() => {
    return inventoryRows.filter(({ product, status }) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" ? true : status === statusFilter;

      const matchesCategory = categoryFilter === "all" ? true : product.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [inventoryRows, searchTerm, statusFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Summary Metrics
  const totalSkus = products.length;
  const lowStockCount = inventoryRows.filter(
    (r) => r.status === "low_stock" || r.status === "out_of_stock",
  ).length;
  const nearExpiryCount = inventoryRows.filter((r) => r.status === "near_expiry").length;
  const totalInventoryVal = inventoryRows.reduce(
    (acc, r) => acc + r.quantity * r.product.unitCost,
    0,
  );

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Handlers
  const handleExportCsv = () => {
    const csvData = filteredRows.map(({ product, quantity, status }) => ({
      SKU: product.sku,
      Name: product.name,
      Category: product.category,
      Unit: product.unit,
      UnitCostUSD: product.unitCost,
      AvailableQuantity: quantity,
      ReorderLevel: product.reorderLevel,
      ExpiryDate: product.expiryDate ?? "N/A",
      Status: status,
      TotalValueUSD: (quantity * product.unitCost).toFixed(2),
    }));
    downloadCsv(`ecochain-inventory-${new Date().toISOString().slice(0, 10)}.csv`, csvData);
    toast.success(`Exported ${csvData.length} inventory records to CSV`);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) {
      toast.error("Please provide both a Product SKU and Name.");
      return;
    }
    const cost = parseFloat(newUnitCost);
    const reorder = parseInt(newReorderLevel, 10);
    const initQty = parseInt(newInitialQty, 10);

    if (isNaN(cost) || cost <= 0) {
      toast.error("Valid positive unit cost is required.");
      return;
    }

    demoStore.addProduct(
      {
        sku: newSku.toUpperCase().trim(),
        name: newName.trim(),
        category: newCategory,
        unit: newUnit,
        unitCost: cost,
        reorderLevel: isNaN(reorder) ? 50 : reorder,
        expiryDate: newExpiryDate ? new Date(newExpiryDate).toISOString() : null,
        supplier: newSupplier.trim() || "Verified Supplier",
      },
      [{ warehouseId: newInitialWh, quantity: isNaN(initQty) ? 0 : initQty }],
    );

    toast.success(`Product ${newName} added successfully`);
    setAddProductOpen(false);
    // Reset form
    setNewSku("");
    setNewName("");
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustWarehouseId) return;
    demoStore.updateStock(
      selectedProduct.id,
      adjustWarehouseId,
      adjustQty,
      "Manual inventory recount",
    );
    toast.success(`Stock adjusted to ${adjustQty} for ${selectedProduct.name}`);
    setAdjustOpen(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || !transferFromWh || !transferToWh) {
      toast.error("Please fill all transfer fields");
      return;
    }
    const res = demoStore.transferStock(
      transferProductId,
      transferFromWh,
      transferToWh,
      transferQuantity,
      "Inter-warehouse replenishment",
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
      pageTitle="Inventory Management"
      breadcrumbs={[{ label: "EcoChain AI", href: "/overview" }, { label: "Inventory" }]}
    >
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Inventory Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Stock control, warehouse allocations, reorder triggers, and expiry monitoring.
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTransferProductId(products[0]?.id ?? "");
                setTransferFromWh(warehouses[0]?.id ?? "");
                setTransferToWh(warehouses[1]?.id ?? "");
                setTransferOpen(true);
              }}
              className="h-9 px-3 gap-2 text-xs border-border"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer Stock</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setAddProductOpen(true)}
              className="h-9 px-3 gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Catalog SKUs"
            value={formatNumber(totalSkus)}
            icon={Boxes}
            subtitle="Active managed articles"
          />
          <KpiCard
            title="Low-Stock Items"
            value={formatNumber(lowStockCount)}
            icon={AlertTriangle}
            trend={{
              value: lowStockCount > 0 ? -lowStockCount : 0,
              isPositiveGood: false,
              label: "below reorder",
            }}
            subtitle="Requires replenishment"
          />
          <KpiCard
            title="Near-Expiry Items"
            value={formatNumber(nearExpiryCount)}
            icon={Clock}
            subtitle="Expiring within 30 days"
          />
          <KpiCard
            title="Total Inventory Value"
            value={formatMoney(totalInventoryVal)}
            icon={Layers}
            subtitle="Valuation at current cost"
          />
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4 border-border bg-card">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search by product, SKU, category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="near_expiry">Near Expiry</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Inventory Data Table */}
        <Card className="border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">SKU</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Available Qty</th>
                  <th className="py-3 px-4 font-semibold">Reorder Level</th>
                  <th className="py-3 px-4 font-semibold">Expiry Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      No matching products found. Try adjusting your search or filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map(({ product, quantity, status, stockByWh }) => (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          to="/inventory/$productId"
                          params={{ productId: product.id }}
                          className="font-semibold text-foreground hover:text-primary transition-colors flex flex-col"
                        >
                          <span>{product.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Supplier: {product.supplier}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{product.sku}</td>
                      <td className="py-3 px-4 text-muted-foreground">{product.category}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-foreground text-sm">
                          {formatNumber(quantity)}
                        </span>{" "}
                        <span className="text-[11px] text-muted-foreground">{product.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {product.reorderLevel} {product.unit}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {product.expiryDate ? (
                          <span
                            className={
                              daysUntilExpiry(product) <= 30
                                ? "text-amber-600 dark:text-amber-400 font-semibold"
                                : ""
                            }
                          >
                            {new Date(product.expiryDate).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">Non-perishable</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StockStatusBadge status={status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              const targetWh =
                                selectedWarehouseId === "all"
                                  ? (warehouses[0]?.id ?? "")
                                  : selectedWarehouseId;
                              setAdjustWarehouseId(targetWh);
                              const curr =
                                stockByWh.find((s) => s.warehouseId === targetWh)?.quantity ?? 0;
                              setAdjustQty(curr);
                              setAdjustOpen(true);
                            }}
                            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                            title="Adjust quantity"
                          >
                            Adjust
                          </Button>
                          <Link
                            to="/inventory/$productId"
                            params={{ productId: product.id }}
                            className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-semibold transition-colors"
                          >
                            Details →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} items
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

        {/* Dialog: Add Product */}
        <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Register a new SKU and allocate starting stock to a warehouse.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-3.5 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="sku">SKU Code *</Label>
                  <Input
                    id="sku"
                    required
                    placeholder="e.g. BEV-ORG-90"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  required
                  placeholder="e.g. Organic Almond Milk 1L"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="cartons, bottles"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="unitCost">Unit Cost ($)</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reorder">Reorder Lvl</Label>
                  <Input
                    id="reorder"
                    type="number"
                    value={newReorderLevel}
                    onChange={(e) => setNewReorderLevel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="expiry">Expiry (Optional)</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2">
                <Label className="text-xs font-semibold">Initial Stock Allocation</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="initWh" className="text-[11px] text-muted-foreground">
                      Warehouse
                    </Label>
                    <Select value={newInitialWh} onValueChange={setNewInitialWh}>
                      <SelectTrigger id="initWh" className="h-8 text-xs">
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
                  <div>
                    <Label htmlFor="initQty" className="text-[11px] text-muted-foreground">
                      Quantity
                    </Label>
                    <Input
                      id="initQty"
                      type="number"
                      className="h-8 text-xs"
                      value={newInitialQty}
                      onChange={(e) => setNewInitialQty(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddProductOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                  Create Product
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
              <DialogDescription>
                Update on-hand count for {selectedProduct?.name}.
              </DialogDescription>
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
                <Label htmlFor="newQuantity">New Available Count ({selectedProduct?.unit})</Label>
                <Input
                  id="newQuantity"
                  type="number"
                  min="0"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                  className="h-9"
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
                Move available inventory between regional fulfillment hubs.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTransferSubmit} className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <Label>Product SKU</Label>
                <Select value={transferProductId} onValueChange={setTransferProductId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <Label htmlFor="transferQty">Transfer Quantity</Label>
                <Input
                  id="transferQty"
                  type="number"
                  min="1"
                  required
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(parseInt(e.target.value, 10) || 1)}
                  className="h-9"
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
                  Execute Transfer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
