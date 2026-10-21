import { buildSeedState } from "@/data/seed";
import type {
  ActivityEvent,
  AppAlert,
  DemoProfile,
  DemoState,
  DisplayPreferences,
  NotificationPreferences,
  Product,
  Recommendation,
  RoutePlan,
  Shipment,
  ShipmentStatus,
  StockMovement,
  StockRecord,
} from "@/types";

const STORAGE_KEY = "ecochain_demo_state_v1";

type Listener = () => void;

class DemoStore {
  private state: DemoState;
  private listeners = new Set<Listener>();
  private initialized = false;

  constructor() {
    this.state = buildSeedState();
  }

  /**
   * Initializes state from localStorage on client mount if available.
   * Keeps server rendering and initial client render hydration-identical.
   */
  public initClient(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DemoState;
        // Merge with seed to ensure any missing fields exist
        this.state = {
          ...buildSeedState(),
          ...parsed,
          lastRefreshedAt: new Date().toISOString(),
        };
        this.emit();
      }
    } catch (e) {
      console.warn("Failed to parse saved EcoChain demo state, using fresh seed data.", e);
    }
  }

  public getState(): DemoState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn("Failed to persist EcoChain demo state to localStorage", e);
      }
    }
    for (const listener of this.listeners) {
      listener();
    }
  }

  // --- ACTIONS ---

  public setSelectedWarehouse(warehouseId: string): void {
    this.state = { ...this.state, selectedWarehouseId: warehouseId };
    this.emit();
  }

  public refresh(): void {
    this.state = {
      ...this.state,
      lastRefreshedAt: new Date().toISOString(),
    };
    this.emit();
  }

  public addProduct(
    productData: Omit<Product, "id">,
    initialStockByWarehouse: { warehouseId: string; quantity: number }[],
  ): Product {
    const newId = `P${String(this.state.products.length + 1).padStart(3, "0")}`;
    const newProduct: Product = { ...productData, id: newId };

    const newStock: StockRecord[] = [...this.state.stock];
    const newMovements: StockMovement[] = [...this.state.movements];

    for (const alloc of initialStockByWarehouse) {
      if (alloc.quantity > 0) {
        newStock.push({
          productId: newId,
          warehouseId: alloc.warehouseId,
          quantity: alloc.quantity,
        });
        newMovements.unshift({
          id: `M${Date.now()}-${alloc.warehouseId}`,
          productId: newId,
          warehouseId: alloc.warehouseId,
          type: "stock_in",
          quantity: alloc.quantity,
          timestamp: new Date().toISOString(),
          note: "Initial product intake",
        });
      }
    }

    const activityItem: ActivityEvent = {
      id: `V${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "stock",
      message: `Added new product: ${newProduct.name} (${newProduct.sku})`,
      linkTo: `/inventory/${newId}`,
    };

    this.state = {
      ...this.state,
      products: [newProduct, ...this.state.products],
      stock: newStock,
      movements: newMovements,
      activity: [activityItem, ...this.state.activity],
    };
    this.emit();
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Product>): void {
    this.state = {
      ...this.state,
      products: this.state.products.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
    };
    this.emit();
  }

  public updateStock(
    productId: string,
    warehouseId: string,
    newQuantity: number,
    note = "Manual stock adjustment",
  ): void {
    const existingIndex = this.state.stock.findIndex(
      (s) => s.productId === productId && s.warehouseId === warehouseId,
    );
    const existingQty = existingIndex >= 0 ? (this.state.stock[existingIndex]?.quantity ?? 0) : 0;
    const diff = newQuantity - existingQty;

    let updatedStock = [...this.state.stock];
    if (existingIndex >= 0) {
      updatedStock = updatedStock.map((s, idx) =>
        idx === existingIndex ? { ...s, quantity: Math.max(0, newQuantity) } : s,
      );
    } else {
      updatedStock.push({ productId, warehouseId, quantity: Math.max(0, newQuantity) });
    }

    const movement: StockMovement = {
      id: `M${Date.now()}`,
      productId,
      warehouseId,
      type: "adjustment",
      quantity: Math.abs(diff),
      timestamp: new Date().toISOString(),
      note: `${note} (${diff >= 0 ? "+" : ""}${diff})`,
    };

    const product = this.state.products.find((p) => p.id === productId);
    const warehouse = this.state.warehouses.find((w) => w.id === warehouseId);
    const activityItem: ActivityEvent = {
      id: `V${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "stock",
      message: `Adjusted stock for ${product?.name ?? productId} at ${warehouse?.name ?? warehouseId} to ${newQuantity}`,
      linkTo: `/inventory/${productId}`,
    };

    this.state = {
      ...this.state,
      stock: updatedStock,
      movements: [movement, ...this.state.movements],
      activity: [activityItem, ...this.state.activity],
    };
    this.emit();
  }

  public transferStock(
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    note = "Warehouse transfer",
  ): { success: boolean; error?: string } {
    if (quantity <= 0) {
      return { success: false, error: "Transfer quantity must be greater than 0." };
    }
    if (fromWarehouseId === toWarehouseId) {
      return { success: false, error: "Source and destination warehouses cannot be the same." };
    }

    const fromRecord = this.state.stock.find(
      (s) => s.productId === productId && s.warehouseId === fromWarehouseId,
    );
    const available = fromRecord?.quantity ?? 0;
    if (available < quantity) {
      return {
        success: false,
        error: `Insufficient stock at source warehouse. Available: ${available}, requested: ${quantity}.`,
      };
    }

    // Deduct from source
    let newStock = this.state.stock.map((s) => {
      if (s.productId === productId && s.warehouseId === fromWarehouseId) {
        return { ...s, quantity: s.quantity - quantity };
      }
      return s;
    });

    // Add to destination
    const toExists = newStock.some(
      (s) => s.productId === productId && s.warehouseId === toWarehouseId,
    );
    if (toExists) {
      newStock = newStock.map((s) => {
        if (s.productId === productId && s.warehouseId === toWarehouseId) {
          return { ...s, quantity: s.quantity + quantity };
        }
        return s;
      });
    } else {
      newStock.push({ productId, warehouseId: toWarehouseId, quantity });
    }

    const timestamp = new Date().toISOString();
    const movements: StockMovement[] = [
      {
        id: `M${Date.now()}-out`,
        productId,
        warehouseId: fromWarehouseId,
        type: "transfer_out",
        quantity,
        timestamp,
        note: `Transferred to ${this.state.warehouses.find((w) => w.id === toWarehouseId)?.name ?? toWarehouseId}: ${note}`,
      },
      {
        id: `M${Date.now()}-in`,
        productId,
        warehouseId: toWarehouseId,
        type: "transfer_in",
        quantity,
        timestamp,
        note: `Transferred from ${this.state.warehouses.find((w) => w.id === fromWarehouseId)?.name ?? fromWarehouseId}: ${note}`,
      },
    ];

    const prod = this.state.products.find((p) => p.id === productId);
    const fromW = this.state.warehouses.find((w) => w.id === fromWarehouseId);
    const toW = this.state.warehouses.find((w) => w.id === toWarehouseId);

    const activityItem: ActivityEvent = {
      id: `V${Date.now()}`,
      timestamp,
      type: "stock",
      message: `Transferred ${quantity} units of ${prod?.name ?? productId} from ${fromW?.name ?? fromWarehouseId} to ${toW?.name ?? toWarehouseId}`,
      linkTo: `/inventory/${productId}`,
    };

    this.state = {
      ...this.state,
      stock: newStock,
      movements: [...movements, ...this.state.movements],
      activity: [activityItem, ...this.state.activity],
    };
    this.emit();
    return { success: true };
  }

  public updateShipmentStatus(shipmentId: string, status: ShipmentStatus, note?: string): void {
    const timestamp = new Date().toISOString();
    const current = this.state.shipments.find((s) => s.id === shipmentId);
    if (!current) return;

    const updatedMilestones = current.milestones.map((m) => {
      if (status === "delivered" && m.label === "Delivered") {
        return { ...m, done: true, timestamp };
      }
      if (status === "in_transit" && (m.label === "Dispatched" || m.label === "In Transit")) {
        return { ...m, done: true, timestamp: m.timestamp ?? timestamp };
      }
      return m;
    });

    const updatedShipments = this.state.shipments.map((s) => {
      if (s.id === shipmentId) {
        return {
          ...s,
          status,
          milestones: updatedMilestones,
          resolutionNote: note ? note : s.resolutionNote,
        };
      }
      return s;
    });

    const activityItem: ActivityEvent = {
      id: `V${Date.now()}`,
      timestamp,
      type: "shipment",
      message: `Shipment ${current.trackingId} status updated to "${status.replace("_", " ")}"`,
      linkTo: `/shipments/${shipmentId}`,
    };

    this.state = {
      ...this.state,
      shipments: updatedShipments,
      activity: [activityItem, ...this.state.activity],
    };
    this.emit();
  }

  public simulateShipmentDelay(shipmentId: string, delayReason: string): void {
    const timestamp = new Date().toISOString();
    const current = this.state.shipments.find((s) => s.id === shipmentId);
    if (!current) return;

    const newEstimated = new Date(
      new Date(current.estimatedArrival).getTime() + 86400000 * 2,
    ).toISOString();

    const updatedShipments = this.state.shipments.map((s) => {
      if (s.id === shipmentId) {
        return {
          ...s,
          status: "delayed" as ShipmentStatus,
          delayReason,
          estimatedArrival: newEstimated,
        };
      }
      return s;
    });

    // Add alert
    const newAlert: AppAlert = {
      id: `A${Date.now()}`,
      type: "shipment_delay",
      severity: "warning",
      title: `Shipment Delayed: ${current.trackingId}`,
      message: `Delay reported: ${delayReason}. New ETA: ${newEstimated.slice(0, 10)}`,
      refType: "shipment",
      refId: shipmentId,
      createdAt: timestamp,
      resolved: false,
    };

    const activityItem: ActivityEvent = {
      id: `V${Date.now()}`,
      timestamp,
      type: "shipment",
      message: `Delay simulated for shipment ${current.trackingId}: ${delayReason}`,
      linkTo: `/shipments/${shipmentId}`,
    };

    this.state = {
      ...this.state,
      shipments: updatedShipments,
      alerts: [newAlert, ...this.state.alerts],
      activity: [activityItem, ...this.state.activity],
    };
    this.emit();
  }

  public recordShipmentResolution(shipmentId: string, resolutionNote: string): void {
    const current = this.state.shipments.find((s) => s.id === shipmentId);
    if (!current) return;

    this.state = {
      ...this.state,
      shipments: this.state.shipments.map((s) =>
        s.id === shipmentId
          ? { ...s, resolutionNote, status: s.status === "delayed" ? "in_transit" : s.status }
          : s,
      ),
      alerts: this.state.alerts.map((a) =>
        a.refType === "shipment" && a.refId === shipmentId ? { ...a, resolved: true } : a,
      ),
      activity: [
        {
          id: `V${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "shipment",
          message: `Resolution recorded for ${current.trackingId}: "${resolutionNote}"`,
          linkTo: `/shipments/${shipmentId}`,
        },
        ...this.state.activity,
      ],
    };
    this.emit();
  }

  public decideRecommendation(
    recommendationId: string,
    decision: "accepted" | "rejected" | "review",
    decisionNote = "",
  ): void {
    const target = this.state.recommendations.find((r) => r.id === recommendationId);
    if (!target) return;

    const timestamp = new Date().toISOString();

    // Auto-apply logic if safe and requested
    if (decision === "accepted") {
      if (target.category === "stock_transfer" && target.refType === "product") {
        // Find warehouse transfer context if applicable
        // E.g. transfer 40 Cheddar Cheese from Bengaluru to Chennai South
        if (target.refId === "P003") {
          this.transferStock(
            "P003",
            "wh-blr",
            "wh-maa",
            40,
            "Automated action from accepted recommendation R001",
          );
        }
      } else if (target.category === "low_stock_risk" && target.refType === "product") {
        // Replenish product by +50 units
        this.updateStock(
          target.refId,
          "wh-del",
          (this.state.stock.find((s) => s.productId === target.refId && s.warehouseId === "wh-del")
            ?.quantity ?? 0) + 50,
          `Automated replenishment from recommendation ${target.id}`,
        );
      }
    }

    const updatedRecommendations = this.state.recommendations.map((r) =>
      r.id === recommendationId
        ? {
            ...r,
            status: decision,
            decidedAt: timestamp,
            decisionNote:
              decisionNote || `Marked as ${decision} on ${new Date().toLocaleDateString()}`,
          }
        : r,
    );

    const activityItem: ActivityEvent = {
      id: `V${Date.now()}`,
      timestamp,
      type: "insight",
      message: `Recommendation "${target.title}" was ${decision}`,
      linkTo: `/ai-insights`,
    };

    this.state = {
      ...this.state,
      recommendations: updatedRecommendations,
      activity: [activityItem, ...this.state.activity],
    };
    this.emit();
  }

  public approveRoutePlan(routePlan: RoutePlan): void {
    const timestamp = new Date().toISOString();
    const existingIndex = this.state.routePlans.findIndex((rp) => rp.id === routePlan.id);

    const updatedPlans = [...this.state.routePlans];
    if (existingIndex >= 0) {
      updatedPlans[existingIndex] = { ...routePlan, status: "approved" };
    } else {
      updatedPlans.unshift({ ...routePlan, status: "approved" });
    }

    const originW = this.state.warehouses.find((w) => w.id === routePlan.originWarehouseId);
    const activityItem: ActivityEvent = {
      id: `V${Date.now()}`,
      timestamp,
      type: "route",
      message: `Route plan approved: ${originW?.name ?? routePlan.originWarehouseId} → ${routePlan.destination}`,
      linkTo: `/route-planner`,
    };

    this.state = {
      ...this.state,
      routePlans: updatedPlans,
      activity: [activityItem, ...this.state.activity],
    };
    this.emit();
  }

  public dismissAlert(alertId: string): void {
    this.state = {
      ...this.state,
      alerts: this.state.alerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)),
    };
    this.emit();
  }

  public updateProfile(profile: Partial<DemoProfile>): void {
    this.state = {
      ...this.state,
      profile: { ...this.state.profile, ...profile },
    };
    this.emit();
  }

  public updateDisplay(display: Partial<DisplayPreferences>): void {
    this.state = {
      ...this.state,
      display: { ...this.state.display, ...display },
    };
    this.emit();
  }

  public updateNotifications(notifications: Partial<NotificationPreferences>): void {
    this.state = {
      ...this.state,
      notifications: { ...this.state.notifications, ...notifications },
    };
    this.emit();
  }

  public resetDemoData(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn("Error clearing localStorage", e);
      }
    }
    this.state = buildSeedState();
    this.emit();
  }
}

export const demoStore = new DemoStore();
