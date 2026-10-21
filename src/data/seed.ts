import type {
  ActivityEvent,
  AppAlert,
  DemoState,
  Product,
  Recommendation,
  RoutePlan,
  Shipment,
  StockMovement,
  StockRecord,
  VehicleType,
  Warehouse,
} from "@/types";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(9, 0, 0, 0);
  return d.toISOString();
}

function hoursFromNow(hours: number): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + hours);
  return d.toISOString();
}

export const WAREHOUSES: Warehouse[] = [
  { id: "wh-blr", name: "Bengaluru Central", code: "BLR", city: "Bengaluru", region: "South", capacity: 12000, mapX: 58, mapY: 70 },
  { id: "wh-del", name: "Delhi North Hub", code: "DEL", city: "New Delhi", region: "North", capacity: 15000, mapX: 56, mapY: 20 },
  { id: "wh-bom", name: "Mumbai West", code: "BOM", city: "Mumbai", region: "West", capacity: 13500, mapX: 20, mapY: 58 },
  { id: "wh-maa", name: "Chennai South", code: "MAA", city: "Chennai", region: "South", capacity: 9800, mapX: 76, mapY: 80 },
];

export interface DestinationPoint {
  name: string;
  x: number;
  y: number;
}

export const DESTINATIONS: DestinationPoint[] = [
  { name: "Hyderabad", x: 64, y: 66 },
  { name: "Pune", x: 30, y: 62 },
  { name: "Kolkata", x: 92, y: 44 },
  { name: "Ahmedabad", x: 30, y: 44 },
  { name: "Jaipur", x: 46, y: 27 },
  { name: "Nagpur", x: 57, y: 56 },
  { name: "Coimbatore", x: 58, y: 87 },
  { name: "Lucknow", x: 72, y: 29 },
  { name: "Indore", x: 42, y: 51 },
  { name: "Surat", x: 27, y: 51 },
  { name: "Visakhapatnam", x: 80, y: 62 },
  { name: "Mysuru", x: 54, y: 76 },
  { name: "Kochi", x: 64, y: 91 },
  { name: "Kanpur", x: 70, y: 25 },
  { name: "Bhopal", x: 49, y: 47 },
  { name: "Vijayawada", x: 76, y: 66 },
];

export const VEHICLES: Record<VehicleType, { label: string; emissionFactor: number; fuelPerKm: number; avgSpeedKmh: number }> = {
  van: { label: "Diesel Van", emissionFactor: 0.26, fuelPerKm: 0.09, avgSpeedKmh: 55 },
  truck: { label: "Heavy Truck", emissionFactor: 0.82, fuelPerKm: 0.28, avgSpeedKmh: 48 },
  ev_van: { label: "Electric Van", emissionFactor: 0.05, fuelPerKm: 0.02, avgSpeedKmh: 52 },
  reefer: { label: "Refrigerated Truck", emissionFactor: 0.41, fuelPerKm: 0.14, avgSpeedKmh: 50 },
};

export const FUEL_PRICE_PER_L = 1.65;
export const NEAR_EXPIRY_DAYS = 30;

export const PRODUCTS: Product[] = [
  { id: "P001", sku: "ECH-1001", name: "Organic Basmati Rice 5kg", category: "Dry Goods", unit: "bag", unitCost: 8.5, reorderLevel: 120, expiryDate: null, supplier: "GreenValley Foods" },
  { id: "P002", sku: "ECH-1002", name: "Cold-Pressed Olive Oil 1L", category: "Pantry", unit: "bottle", unitCost: 6.2, reorderLevel: 80, expiryDate: daysFromNow(210), supplier: "Olivara Estates" },
  { id: "P003", sku: "ECH-1003", name: "Fresh Milk 1L", category: "Dairy", unit: "carton", unitCost: 1.1, reorderLevel: 200, expiryDate: daysFromNow(6), supplier: "Meadow Dairies" },
  { id: "P004", sku: "ECH-1004", name: "Greek Yogurt 500g", category: "Dairy", unit: "tub", unitCost: 1.8, reorderLevel: 150, expiryDate: daysFromNow(12), supplier: "Meadow Dairies" },
  { id: "P005", sku: "ECH-1005", name: "Whole Wheat Flour 10kg", category: "Dry Goods", unit: "sack", unitCost: 7.4, reorderLevel: 90, expiryDate: null, supplier: "Harvest Mill Co." },
  { id: "P006", sku: "ECH-1006", name: "Brown Eggs (tray of 30)", category: "Dairy", unit: "tray", unitCost: 3.9, reorderLevel: 100, expiryDate: daysFromNow(10), supplier: "FreeRange Farms" },
  { id: "P007", sku: "ECH-1007", name: "Cheddar Cheese 1kg", category: "Dairy", unit: "block", unitCost: 9.8, reorderLevel: 60, expiryDate: daysFromNow(24), supplier: "Alpine Cultures" },
  { id: "P008", sku: "ECH-1008", name: "Mineral Water 500ml (24pk)", category: "Beverages", unit: "case", unitCost: 3.2, reorderLevel: 250, expiryDate: null, supplier: "ClearSpring" },
  { id: "P009", sku: "ECH-1009", name: "Sparkling Water 750ml", category: "Beverages", unit: "bottle", unitCost: 1.4, reorderLevel: 180, expiryDate: null, supplier: "ClearSpring" },
  { id: "P010", sku: "ECH-1010", name: "Oat Milk 1L", category: "Beverages", unit: "carton", unitCost: 2.1, reorderLevel: 140, expiryDate: daysFromNow(38), supplier: "Oatly Fields" },
  { id: "P011", sku: "ECH-1011", name: "Dish Soap 750ml", category: "Household", unit: "bottle", unitCost: 2.3, reorderLevel: 110, expiryDate: null, supplier: "PureHome" },
  { id: "P012", sku: "ECH-1012", name: "Laundry Detergent 3kg", category: "Household", unit: "box", unitCost: 8.9, reorderLevel: 70, expiryDate: null, supplier: "PureHome" },
  { id: "P013", sku: "ECH-1013", name: "Shampoo 400ml", category: "Personal Care", unit: "bottle", unitCost: 3.6, reorderLevel: 90, expiryDate: null, supplier: "Botanica Care" },
  { id: "P014", sku: "ECH-1014", name: "Toothpaste 150g", category: "Personal Care", unit: "tube", unitCost: 1.9, reorderLevel: 130, expiryDate: null, supplier: "Botanica Care" },
  { id: "P015", sku: "ECH-1015", name: "Recycled Paper Towels (6pk)", category: "Packaging", unit: "pack", unitCost: 4.1, reorderLevel: 100, expiryDate: null, supplier: "EcoWrap Industries" },
  { id: "P016", sku: "ECH-1016", name: "Corrugated Boxes (bundle)", category: "Packaging", unit: "bundle", unitCost: 12.5, reorderLevel: 40, expiryDate: null, supplier: "EcoWrap Industries" },
];

const S = (productId: string, warehouseId: string, quantity: number): StockRecord => ({ productId, warehouseId, quantity });

export const STOCK: StockRecord[] = [
  S("P001", "wh-blr", 340), S("P001", "wh-del", 280), S("P001", "wh-bom", 210), S("P001", "wh-maa", 95),
  S("P002", "wh-blr", 150), S("P002", "wh-del", 120), S("P002", "wh-bom", 64),
  S("P003", "wh-blr", 260), S("P003", "wh-del", 180), S("P003", "wh-maa", 55), S("P003", "wh-bom", 0),
  S("P004", "wh-blr", 190), S("P004", "wh-del", 140), S("P004", "wh-maa", 88),
  S("P005", "wh-blr", 175), S("P005", "wh-del", 210), S("P005", "wh-bom", 60), S("P005", "wh-maa", 42),
  S("P006", "wh-blr", 130), S("P006", "wh-del", 96), S("P006", "wh-maa", 110),
  S("P007", "wh-blr", 74), S("P007", "wh-del", 48), S("P007", "wh-bom", 30), S("P007", "wh-maa", 12),
  S("P008", "wh-blr", 420), S("P008", "wh-del", 380), S("P008", "wh-bom", 260), S("P008", "wh-maa", 310),
  S("P009", "wh-blr", 205), S("P009", "wh-del", 150), S("P009", "wh-bom", 95),
  S("P010", "wh-blr", 165), S("P010", "wh-del", 130), S("P010", "wh-maa", 60),
  S("P011", "wh-blr", 145), S("P011", "wh-del", 120), S("P011", "wh-bom", 88),
  S("P012", "wh-blr", 92), S("P012", "wh-del", 78), S("P012", "wh-bom", 44),
  S("P013", "wh-blr", 110), S("P013", "wh-del", 84), S("P013", "wh-maa", 66),
  S("P014", "wh-blr", 155), S("P014", "wh-del", 140), S("P014", "wh-bom", 70),
  S("P015", "wh-blr", 128), S("P015", "wh-del", 105), S("P015", "wh-maa", 52),
  S("P016", "wh-blr", 58), S("P016", "wh-del", 44), S("P016", "wh-bom", 18), S("P016", "wh-maa", 0),
];

function mv(id: string, productId: string, warehouseId: string, type: StockMovement["type"], quantity: number, daysAgo: number, note: string): StockMovement {
  return { id, productId, warehouseId, type, quantity, timestamp: daysFromNow(-daysAgo), note };
}

export const MOVEMENTS: StockMovement[] = [
  mv("M001", "P003", "wh-bom", "stock_out", 120, 14, "Daily route restock — Mumbai retail"),
  mv("M002", "P008", "wh-del", "stock_in", 300, 13, "PO-8812 received from ClearSpring"),
  mv("M003", "P016", "wh-maa", "shipped", 40, 12, "Dispatched with ECH-TRK-4821"),
  mv("M004", "P001", "wh-blr", "stock_in", 200, 11, "PO-8795 received from GreenValley"),
  mv("M005", "P007", "wh-maa", "stock_out", 30, 10, "Wholesale order fulfilled"),
  mv("M006", "P004", "wh-blr", "transfer_in", 60, 9, "Transfer from Delhi North Hub"),
  mv("M007", "P004", "wh-del", "transfer_out", 60, 9, "Transfer to Bengaluru Central"),
  mv("M008", "P012", "wh-bom", "adjustment", -6, 8, "Cycle count variance — damaged units"),
  mv("M009", "P014", "wh-del", "stock_in", 150, 7, "PO-8841 received from Botanica Care"),
  mv("M010", "P006", "wh-maa", "stock_out", 45, 6, "Supermarket chain delivery"),
  mv("M011", "P010", "wh-blr", "stock_in", 90, 5, "PO-8853 received from Oatly Fields"),
  mv("M012", "P009", "wh-bom", "stock_out", 70, 4, "Monthly beverage contract"),
  mv("M013", "P015", "wh-maa", "shipped", 35, 3, "Dispatched with ECH-TRK-4833"),
  mv("M014", "P002", "wh-blr", "stock_in", 80, 2, "PO-8860 received from Olivara"),
];

function shipment(
  id: string, trackingId: string, orderRef: string, originWarehouseId: string, destination: DestinationPoint,
  carrier: string, vehicle: VehicleType, dispatchOffset: number, transitDays: number, status: Shipment["status"],
  delayReason: string | null, deliveredOnTime: boolean,
): Shipment {
  const dispatchDate = daysFromNow(dispatchOffset);
  const estimatedArrival = daysFromNow(dispatchOffset + transitDays);
  const milestones: Shipment["milestones"] = [
    { label: "Order prepared", timestamp: dispatchDate, done: true },
    { label: "Dispatched from origin", timestamp: dispatchDate, done: true },
    { label: "In transit", timestamp: dispatchOffset + transitDays <= 0 || status !== "preparing" ? hoursFromNow(-Math.min(48, transitDays * 24)) : null, done: status !== "preparing" },
    { label: "Arrived at destination hub", timestamp: status === "delivered" || (status === "delayed" && transitDays <= 0) ? estimatedArrival : null, done: status === "delivered" },
    { label: "Delivered", timestamp: status === "delivered" ? estimatedArrival : null, done: status === "delivered" },
  ];
  if (status === "delivered" && !deliveredOnTime) {
    const last = milestones[milestones.length - 1];
    if (last) last.timestamp = daysFromNow(dispatchOffset + transitDays + 2);
  }
  return {
    id,
    trackingId,
    orderRef,
    originWarehouseId,
    destination: destination.name,
    destX: destination.x,
    destY: destination.y,
    carrier,
    vehicle,
    distanceKm: Math.round(routeDistanceFor(originWarehouseId, destination) * (1 + 0.12)),
    dispatchDate,
    estimatedArrival,
    status,
    delayReason,
    resolutionNote: null,
    milestones,
  };
}

function dest(index: number): DestinationPoint {
  const d = DESTINATIONS[index];
  if (!d) throw new Error(`Unknown destination index ${index}`);
  return d;
}

function routeDistanceFor(warehouseId: string, destination: DestinationPoint): number {
  const w = WAREHOUSES.find((x) => x.id === warehouseId) ?? WAREHOUSES[0]!;
  const dx = (destination.x - w.mapX) * 22;
  const dy = (destination.y - w.mapY) * 22;
  return Math.max(60, Math.sqrt(dx * dx + dy * dy));
}

export { routeDistanceFor };

export const SHIPMENTS: Shipment[] = [
  shipment("S001", "ECH-TRK-4801", "ORD-77120", "wh-blr", dest(0), "GreenLine Logistics", "reefer", -6, 3, "delivered", null, true),
  shipment("S002", "ECH-TRK-4802", "ORD-77126", "wh-del", dest(4), "SwiftMove Freight", "truck", -5, 2, "delivered", null, true),
  shipment("S003", "ECH-TRK-4803", "ORD-77133", "wh-bom", dest(2), "MetroHaul", "truck", -9, 4, "delivered", null, false),
  shipment("S004", "ECH-TRK-4804", "ORD-77140", "wh-maa", dest(12), "EcoExpress", "ev_van", -4, 2, "delivered", null, true),
  shipment("S005", "ECH-TRK-4805", "ORD-77148", "wh-blr", dest(11), "GreenLine Logistics", "van", -3, 2, "in_transit", null, true),
  shipment("S006", "ECH-TRK-4806", "ORD-77155", "wh-del", dest(14), "SwiftMove Freight", "truck", -2, 3, "in_transit", null, true),
  shipment("S007", "ECH-TRK-4807", "ORD-77161", "wh-bom", dest(9), "MetroHaul", "van", -2, 1, "in_transit", null, true),
  shipment("S008", "ECH-TRK-4808", "ORD-77164", "wh-maa", dest(10), "EcoExpress", "reefer", -1, 2, "in_transit", null, true),
  shipment("S009", "ECH-TRK-4809", "ORD-77169", "wh-blr", dest(12), "EcoExpress", "reefer", -4, 1, "delayed", "Heavy rainfall on the Coastal Highway caused a 30-hour hold at the Salem depot.", true),
  shipment("S010", "ECH-TRK-4810", "ORD-77171", "wh-del", dest(15), "SwiftMove Freight", "van", -6, 2, "delayed", "Carrier vehicle breakdown near Kanpur; replacement truck arranged.", false),
  shipment("S011", "ECH-TRK-4811", "ORD-77180", "wh-bom", dest(1), "GreenLine Logistics", "van", 0, 1, "preparing", null, true),
  shipment("S012", "ECH-TRK-4812", "ORD-77183", "wh-del", dest(7), "MetroHaul", "truck", 0, 2, "preparing", null, true),
  shipment("S013", "ECH-TRK-4813", "ORD-77185", "wh-maa", dest(6), "EcoExpress", "ev_van", 1, 1, "preparing", null, true),
  shipment("S014", "ECH-TRK-4814", "ORD-77188", "wh-blr", dest(13), "GreenLine Logistics", "van", -1, 2, "in_transit", null, true),
];

export const ALERTS: AppAlert[] = [
  { id: "A001", type: "low_stock", severity: "critical", title: "Out of stock: Fresh Milk 1L", message: "Fresh Milk 1L is out of stock at Mumbai West. Reorder level is 200 cartons.", refType: "product", refId: "P003", createdAt: daysFromNow(-1), resolved: false },
  { id: "A002", type: "low_stock", severity: "warning", title: "Low stock: Cheddar Cheese 1kg", message: "Cheddar Cheese 1kg has fallen to 12 blocks at Chennai South, below the reorder level of 60.", refType: "product", refId: "P007", createdAt: daysFromNow(-2), resolved: false },
  { id: "A003", type: "shipment_delay", severity: "critical", title: "Shipment delayed: ECH-TRK-4809", message: "ECH-TRK-4809 (Bengaluru Central → Kochi) is delayed by heavy rainfall at the Salem depot.", refType: "shipment", refId: "S009", createdAt: daysFromNow(-2), resolved: false },
  { id: "A004", type: "shipment_delay", severity: "warning", title: "Shipment delayed: ECH-TRK-4810", message: "ECH-TRK-4810 (Delhi North Hub → Vijayawada) had a carrier vehicle breakdown near Kanpur.", refType: "shipment", refId: "S010", createdAt: daysFromNow(-4), resolved: false },
  { id: "A005", type: "near_expiry", severity: "warning", title: "Near expiry: Fresh Milk 1L", message: "55 cartons of Fresh Milk 1L at Chennai South expire within 6 days. Prioritize dispatch or discount.", refType: "product", refId: "P003", createdAt: daysFromNow(-1), resolved: false },
  { id: "A006", type: "excess_inventory", severity: "info", title: "Excess inventory: Mineral Water 500ml", message: "Mineral Water 500ml stock at Delhi North Hub is 2.4x the 30-day sales pace. Consider redistribution.", refType: "product", refId: "P008", createdAt: daysFromNow(-3), resolved: false },
  { id: "A007", type: "low_stock", severity: "warning", title: "Out of stock: Corrugated Boxes (bundle)", message: "Corrugated Boxes are out of stock at Chennai South. Packaging supply may block outbound dispatches.", refType: "product", refId: "P016", createdAt: daysFromNow(-1), resolved: false },
  { id: "A008", type: "near_expiry", severity: "info", title: "Near expiry: Greek Yogurt 500g", message: "Greek Yogurt 500g at Bengaluru Central expires within 12 days — 190 tubs on hand.", refType: "product", refId: "P004", createdAt: daysFromNow(-2), resolved: false },
];

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "R001", category: "stock_transfer", title: "Transfer 90 blocks of Cheddar Cheese to Chennai South",
    priority: "high", status: "open", refType: "product", refId: "P007", refLabel: "Cheddar Cheese 1kg",
    reason: "Chennai South is at 12 blocks versus a reorder level of 60, while Bengaluru Central holds 74 blocks — 25% above its 30-day sales pace. A transfer rebalances stock without a new purchase order.",
    supportingData: [
      { label: "Chennai South stock", value: "12 blocks" },
      { label: "Bengaluru Central stock", value: "74 blocks" },
      { label: "Reorder level", value: "60 blocks" },
      { label: "Lead time saved", value: "~5 days vs supplier" },
    ],
    suggestedAction: "Transfer 90 blocks of Cheddar Cheese 1kg from Bengaluru Central to Chennai South.",
    impact: "Avoids an estimated $1,960 in lost wholesale revenue and a stockout within 6 days.",
    impactAssumptions: "Assumes the last 30-day Chennai sales pace of ~10 blocks/week continues and no new wholesale orders.",
    createdAt: daysFromNow(-1), decidedAt: null, decisionNote: null,
  },
  {
    id: "R002", category: "low_stock_risk", title: "Reorder Fresh Milk 1L for Mumbai West",
    priority: "critical", status: "open", refType: "product", refId: "P003", refLabel: "Fresh Milk 1L",
    reason: "Mumbai West is out of stock while daily sales average 42 cartons. The next supplier delivery is 3 days out; emergency replenishment from Bengaluru Central covers the gap.",
    supportingData: [
      { label: "Mumbai West stock", value: "0 cartons" },
      { label: "Daily sales pace", value: "~42 cartons/day" },
      { label: "Reorder level", value: "200 cartons" },
      { label: "Supplier lead time", value: "3 days" },
    ],
    suggestedAction: "Raise an emergency replenishment of 250 cartons to Mumbai West (supplier: Meadow Dairies).",
    impact: "Prevents roughly $1,900 of lost dairy revenue over 3 days.",
    impactAssumptions: "Assumes current sales pace holds and the emergency PO is confirmed within 24 hours.",
    createdAt: daysFromNow(-1), decidedAt: null, decisionNote: null,
  },
  {
    id: "R003", category: "excess_inventory", title: "Redistribute Mineral Water from Delhi North Hub",
    priority: "medium", status: "open", refType: "product", refId: "P008", refLabel: "Mineral Water 500ml (24pk)",
    reason: "Delhi North Hub holds 380 cases against a 30-day sales pace of ~160 cases. Chennai South is trending toward low stock within 3 weeks.",
    supportingData: [
      { label: "Delhi North Hub stock", value: "380 cases" },
      { label: "30-day sales pace", value: "~160 cases" },
      { label: "Excess", value: "~220 cases" },
      { label: "Holding cost", value: "$0.06/case/day" },
    ],
    suggestedAction: "Transfer 150 cases of Mineral Water from Delhi North Hub to Chennai South on the next consolidated truck.",
    impact: "Reduces holding cost by ~$540 over the next 60 days and avoids a Chennai stockout.",
    impactAssumptions: "Assumes holding cost of $0.06 per case per day and unchanged sales pace.",
    createdAt: daysFromNow(-3), decidedAt: null, decisionNote: null,
  },
  {
    id: "R004", category: "demand_forecast", title: "Oat Milk demand expected to rise 22% next month",
    priority: "medium", status: "open", refType: "product", refId: "P010", refLabel: "Oat Milk 1L",
    reason: "Sales across Bengaluru and Chennai have grown ~8% week over week for 4 straight weeks, ahead of the seasonal pattern. Current stock covers only 19 days at the projected pace.",
    supportingData: [
      { label: "Projected demand (next 30d)", value: "~310 cartons" },
      { label: "Current network stock", value: "355 cartons" },
      { label: "Week-over-week growth", value: "+8%" },
      { label: "Coverage at current pace", value: "19 days" },
    ],
    suggestedAction: "Increase the next Oatly Fields purchase order by 120 cartons for delivery before the 1st.",
    impact: "Prevents an estimated $780 in lost sales and keeps service level above 95%.",
    impactAssumptions: "Assumes 8% weekly growth tapers to 3% after two weeks.",
    createdAt: daysFromNow(-2), decidedAt: null, decisionNote: null,
  },
  {
    id: "R005", category: "shipment_delay_risk", title: "ECH-TRK-4806 likely to arrive 1 day late",
    priority: "high", status: "open", refType: "shipment", refId: "S006", refLabel: "ECH-TRK-4806 · Delhi → Bhopal",
    reason: "The carrier's history on this lane shows delays on 3 of the last 5 runs, and the truck departed 4 hours behind schedule.",
    supportingData: [
      { label: "Lane on-time rate", value: "40% (last 5 runs)" },
      { label: "Departure delay", value: "4 hours" },
      { label: "ETA", value: "in 2 days" },
    ],
    suggestedAction: "Notify the Bhopal customer of a possible 1-day slip and hold a same-day backup carrier slot.",
    impact: "Avoids an estimated $350 expedite fee if the customer agrees to standard delivery.",
    impactAssumptions: "Assumes historical carrier performance on this lane is representative.",
    createdAt: daysFromNow(-1), decidedAt: null, decisionNote: null,
  },
  {
    id: "R006", category: "low_stock_risk", title: "Reorder Corrugated Boxes before dispatch backlog",
    priority: "high", status: "open", refType: "product", refId: "P016", refLabel: "Corrugated Boxes (bundle)",
    reason: "Network stock is 120 bundles against a reorder level of 160, and Chennai South is out of stock. Outbound dispatches consume ~50 bundles per week.",
    supportingData: [
      { label: "Network stock", value: "120 bundles" },
      { label: "Weekly consumption", value: "~50 bundles" },
      { label: "Reorder level", value: "160 bundles" },
      { label: "Supplier lead time", value: "4 days" },
    ],
    suggestedAction: "Raise a purchase order for 200 bundles from EcoWrap Industries.",
    impact: "Prevents dispatch delays affecting ~$4,200 of pending orders.",
    impactAssumptions: "Assumes pending order volume stays at the current 2-week average.",
    createdAt: daysFromNow(-2), decidedAt: null, decisionNote: null,
  },
  {
    id: "R007", category: "excess_inventory", title: "Whole Wheat Flour stock exceeds 60-day pace at Mumbai West",
    priority: "low", status: "open", refType: "product", refId: "P005", refLabel: "Whole Wheat Flour 10kg",
    reason: "Mumbai West holds 60 sacks, 2.1x its 30-day sales pace. The product is non-perishable, so the risk is working capital rather than waste.",
    supportingData: [
      { label: "Mumbai West stock", value: "60 sacks" },
      { label: "30-day sales pace", value: "~28 sacks" },
      { label: "Tied-up capital", value: "$444" },
    ],
    suggestedAction: "Hold new purchase orders for 45 days and monitor the sales pace.",
    impact: "Frees ~$444 of working capital over the next quarter.",
    impactAssumptions: "Assumes sales pace remains within ±20% of the 30-day average.",
    createdAt: daysFromNow(-4), decidedAt: null, decisionNote: null,
  },
  {
    id: "R008", category: "demand_forecast", title: "Prepare Dairy buffer for festival-week demand",
    priority: "medium", status: "review", refType: "product", refId: "P004", refLabel: "Greek Yogurt 500g",
    reason: "Festival week historically lifts dairy demand 30–40%. Bengaluru Central stock covers 12 days at the normal pace, only 8 days at festival pace.",
    supportingData: [
      { label: "Festival uplift", value: "+30–40%" },
      { label: "Bengaluru stock", value: "190 tubs" },
      { label: "Coverage at festival pace", value: "8 days" },
    ],
    suggestedAction: "Add 120 tubs to the next Meadow Dairies order, split between Bengaluru Central and Chennai South.",
    impact: "Protects ~$610 of festival-week dairy sales.",
    impactAssumptions: "Assumes last year's festival uplift repeats within ±10%.",
    createdAt: daysFromNow(-5), decidedAt: null, decisionNote: null,
  },
];

export const ROUTE_PLANS: RoutePlan[] = [
  {
    id: "RP001", originWarehouseId: "wh-blr", destination: "Hyderabad", destinationPoint: DESTINATIONS[0],
    stops: ["Nagpur"], vehicle: "reefer", priority: "standard", createdAt: daysFromNow(-2), status: "approved",
    current: { distanceKm: 760, travelMinutes: 640, fuelCost: 189, emissionsKg: 296 },
    suggested: { distanceKm: 596, travelMinutes: 520, fuelCost: 148, emissionsKg: 232 },
  },
  {
    id: "RP002", originWarehouseId: "wh-del", destination: "Jaipur", destinationPoint: DESTINATIONS[4],
    stops: [], vehicle: "truck", priority: "economy", createdAt: daysFromNow(-1), status: "draft",
    current: { distanceKm: 262, travelMinutes: 330, fuelCost: 120, emissionsKg: 351 },
    suggested: { distanceKm: 262, travelMinutes: 330, fuelCost: 120, emissionsKg: 351 },
  },
];

export const ACTIVITY: ActivityEvent[] = [
  { id: "V001", timestamp: hoursFromNow(-2), type: "shipment", message: "ECH-TRK-4805 departed Bengaluru Central for Mysuru", linkTo: "/shipments/S005" },
  { id: "V002", timestamp: hoursFromNow(-5), type: "stock", message: "Received 80 bottles of Olive Oil at Bengaluru Central (PO-8860)" },
  { id: "V003", timestamp: hoursFromNow(-8), type: "insight", message: "New high-priority recommendation: transfer Cheddar Cheese to Chennai South", linkTo: "/ai-insights" },
  { id: "V004", timestamp: hoursFromNow(-22), type: "shipment", message: "ECH-TRK-4809 delayed at Salem depot — rainfall alert raised", linkTo: "/shipments/S009" },
  { id: "V005", timestamp: hoursFromNow(-26), type: "stock", message: "Cycle count adjustment of -6 for Laundry Detergent at Mumbai West" },
  { id: "V006", timestamp: hoursFromNow(-30), type: "shipment", message: "ECH-TRK-4804 delivered to Kochi on time", linkTo: "/shipments/S004" },
  { id: "V007", timestamp: hoursFromNow(-47), type: "route", message: "Route plan RP001 (Bengaluru → Hyderabad via Nagpur) approved" },
  { id: "V008", timestamp: hoursFromNow(-52), type: "stock", message: "Received 300 cases of Mineral Water at Delhi North Hub (PO-8812)" },
  { id: "V009", timestamp: hoursFromNow(-60), type: "system", message: "Daily operations briefing generated" },
  { id: "V010", timestamp: hoursFromNow(-70), type: "stock", message: "Wholesale order fulfilled: 30 blocks of Cheddar Cheese from Chennai South" },
];

export function buildSeedState(): DemoState {
  return {
    warehouses: WAREHOUSES,
    products: PRODUCTS,
    stock: STOCK,
    movements: MOVEMENTS,
    shipments: SHIPMENTS,
    alerts: ALERTS,
    recommendations: RECOMMENDATIONS,
    activity: ACTIVITY,
    routePlans: ROUTE_PLANS,
    profile: { name: "Aarav Sharma", email: "aarav.sharma@ecochain.example", role: "Operations Manager" },
    selectedWarehouseId: "all",
    defaultWarehouseId: "wh-blr",
    display: { compactTables: false, showTrendArrows: true },
    notifications: { lowStockAlerts: true, shipmentAlerts: true, dailyBriefing: true },
    lastRefreshedAt: new Date().toISOString(),
  };
}
