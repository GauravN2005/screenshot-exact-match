export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "near_expiry";

export type ShipmentStatus = "preparing" | "in_transit" | "delayed" | "delivered";

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertType = "low_stock" | "near_expiry" | "excess_inventory" | "shipment_delay";

export type Priority = "critical" | "high" | "medium" | "low";

export type RecommendationCategory =
  | "low_stock_risk"
  | "excess_inventory"
  | "demand_forecast"
  | "shipment_delay_risk"
  | "stock_transfer";

export type RecommendationStatus = "open" | "accepted" | "rejected" | "review";

export type MovementType =
  | "stock_in"
  | "stock_out"
  | "adjustment"
  | "transfer_out"
  | "transfer_in"
  | "shipped";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  region: string;
  capacity: number;
  /** Normalized coordinates (0-100) used for the schematic route map. */
  mapX: number;
  mapY: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  reorderLevel: number;
  /** ISO date or null for non-perishable products. */
  expiryDate: string | null;
  supplier: string;
}

export interface StockRecord {
  productId: string;
  warehouseId: string;
  quantity: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: MovementType;
  quantity: number;
  timestamp: string;
  note: string;
}

export interface ShipmentMilestone {
  label: string;
  timestamp: string | null;
  done: boolean;
}

export interface Shipment {
  id: string;
  trackingId: string;
  orderRef: string;
  originWarehouseId: string;
  destination: string;
  /** Normalized destination coordinates (0-100) for the schematic map. */
  destX: number;
  destY: number;
  carrier: string;
  vehicle: VehicleType;
  distanceKm: number;
  dispatchDate: string;
  estimatedArrival: string;
  status: ShipmentStatus;
  delayReason: string | null;
  resolutionNote: string | null;
  milestones: ShipmentMilestone[];
}

export type VehicleType = "van" | "truck" | "ev_van" | "reefer";

export interface AppAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  refType: "product" | "shipment";
  refId: string;
  createdAt: string;
  resolved: boolean;
}

export interface RecommendationSupportDatum {
  label: string;
  value: string;
}

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  priority: Priority;
  status: RecommendationStatus;
  refType: "product" | "shipment" | "warehouse";
  refId: string;
  refLabel: string;
  reason: string;
  supportingData: RecommendationSupportDatum[];
  suggestedAction: string;
  impact: string;
  impactAssumptions: string;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: "stock" | "shipment" | "insight" | "route" | "system";
  message: string;
  linkTo?: string;
}

export interface RoutePlanMetrics {
  distanceKm: number;
  travelMinutes: number;
  fuelCost: number;
  emissionsKg: number;
}

export interface RoutePlan {
  id: string;
  originWarehouseId: string;
  destination: string;
  destinationPoint: { x: number; y: number };
  stops: string[];
  vehicle: VehicleType;
  priority: "standard" | "express" | "economy";
  createdAt: string;
  status: "draft" | "approved";
  current: RoutePlanMetrics;
  suggested: RoutePlanMetrics;
}

export interface DemoProfile {
  name: string;
  email: string;
  role: string;
}

export interface DisplayPreferences {
  compactTables: boolean;
  showTrendArrows: boolean;
}

export interface NotificationPreferences {
  lowStockAlerts: boolean;
  shipmentAlerts: boolean;
  dailyBriefing: boolean;
}

export type DateRangePreset = "7d" | "30d" | "90d";

export interface DemoState {
  warehouses: Warehouse[];
  products: Product[];
  stock: StockRecord[];
  movements: StockMovement[];
  shipments: Shipment[];
  alerts: AppAlert[];
  recommendations: Recommendation[];
  activity: ActivityEvent[];
  routePlans: RoutePlan[];
  profile: DemoProfile;
  selectedWarehouseId: string; // "all" or warehouse id
  defaultWarehouseId: string;
  display: DisplayPreferences;
  notifications: NotificationPreferences;
  lastRefreshedAt: string;
}
