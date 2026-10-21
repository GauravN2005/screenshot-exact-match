import type {
  DateRangePreset,
  RoutePlanMetrics,
  Shipment,
  StockRecord,
  VehicleType,
  Warehouse,
} from "@/types";
import { FUEL_PRICE_PER_L, VEHICLES } from "@/data/seed";
import type { Product } from "@/types";
import { NEAR_EXPIRY_DAYS } from "@/data/seed";
import type { StockStatus } from "@/types";

/** Days from today until the product's expiry date (large for non-perishables). */
export function daysUntilExpiry(product: Product): number {
  if (!product.expiryDate) return 9999;
  return Math.ceil((new Date(product.expiryDate).getTime() - Date.now()) / 86_400_000);
}

export function stockStatus(record: StockRecord, product: Product): StockStatus {
  if (record.quantity <= 0) return "out_of_stock";
  if (daysUntilExpiry(product) <= NEAR_EXPIRY_DAYS) return "near_expiry";
  if (record.quantity <= product.reorderLevel) return "low_stock";
  return "in_stock";
}

export function isNearExpiry(product: Product): boolean {
  return product.expiryDate !== null && daysUntilExpiry(product) <= NEAR_EXPIRY_DAYS;
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyPrecise(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatKm(value: number): string {
  return `${formatNumber(Math.round(value))} km`;
}

export function formatKg(value: number): string {
  return `${formatNumber(Math.round(value))} kg`;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

/** Deterministic PRNG (mulberry32) so demo series are stable per key. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DATE_RANGE_DAYS: Record<DateRangePreset, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function rangeStartDate(range: DateRangePreset): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - DATE_RANGE_DAYS[range]);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Deterministic daily series for trend charts. Base value varies smoothly with
 * a seeded wave plus weekly seasonality; identical inputs always produce the
 * identical series.
 */
export function dailySeries(
  key: string,
  range: DateRangePreset,
  base: number,
  variation = 0.18,
): { date: string; value: number }[] {
  const days = DATE_RANGE_DAYS[range];
  const rnd = seededRandom(key);
  const phase = rnd() * Math.PI * 2;
  const phase2 = rnd() * Math.PI * 2;
  const out: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const t = (days - i) / days;
    const wave =
      Math.sin(phase + t * Math.PI * 2) * variation +
      Math.sin(phase2 + t * Math.PI * 6) * variation * 0.4;
    const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6 ? -0.12 : 0;
    const value = Math.max(0, base * (1 + wave + weekend + (t - 0.5) * variation * 0.3));
    out.push({ date: d.toISOString().slice(0, 10), value });
  }
  return out;
}

export function isShipmentOnTime(shipment: Shipment): boolean {
  if (shipment.status !== "delivered") return false;
  const delivered = shipment.milestones.find((m) => m.label === "Delivered");
  if (!delivered?.timestamp) return false;
  return new Date(delivered.timestamp).getTime() <= new Date(shipment.estimatedArrival).getTime();
}

export interface RoutePoint {
  x: number;
  y: number;
}

/** Deterministic route metrics for the schematic planner. */
export function computeRouteMetrics(
  origin: RoutePoint,
  destination: RoutePoint,
  stops: RoutePoint[],
  vehicle: VehicleType,
  priority: "standard" | "express" | "economy",
): { current: RoutePlanMetrics; suggested: RoutePlanMetrics } {
  const legs = (points: RoutePoint[]): number =>
    points.slice(1).reduce((sum, p, i) => {
      const prev = points[i];
      if (!prev) return sum;
      const dx = (p.x - prev.x) * 22;
      const dy = (p.y - prev.y) * 22;
      return sum + Math.max(40, Math.sqrt(dx * dx + dy * dy));
    }, 0);

  const v = VEHICLES[vehicle];
  const rnd = seededRandom(
    `${origin.x},${origin.y}|${destination.x},${destination.y}|${stops.length}|${vehicle}|${priority}`,
  );

  const orderedCurrent = [origin, ...stops, destination];
  const currentDirect = legs([origin, destination]);
  const currentDistance = Math.round(legs(orderedCurrent) * (1 + 0.06 * rnd()));

  // The optimizer sequences stops along the direct corridor and smooths detours.
  const suggestedDistance = Math.round(
    Math.max(currentDirect, currentDistance * (0.78 + 0.08 * rnd())),
  );

  const speedFactor = priority === "express" ? 1.15 : priority === "economy" ? 0.9 : 1;
  const currentMinutes = Math.round((currentDistance / v.avgSpeedKmh) * 60 + 15 * stops.length);
  const suggestedMinutes = Math.round((suggestedDistance / v.avgSpeedKmh) * 60 + 12 * stops.length);

  const currentMetrics: RoutePlanMetrics = {
    distanceKm: currentDistance,
    travelMinutes: currentMinutes,
    fuelCost: Math.round(currentDistance * v.fuelPerKm * FUEL_PRICE_PER_L * 100) / 100,
    emissionsKg: Math.round(currentDistance * v.emissionFactor * 10) / 10,
  };
  const suggestedMetrics: RoutePlanMetrics = {
    distanceKm: suggestedDistance,
    travelMinutes: Math.round(suggestedMinutes * speedFactor),
    fuelCost: Math.round(suggestedDistance * v.fuelPerKm * FUEL_PRICE_PER_L * 100) / 100,
    emissionsKg: Math.round(suggestedDistance * v.emissionFactor * 10) / 10,
  };
  return { current: currentMetrics, suggested: suggestedMetrics };
}

export function summarizeRouteMetrics(metrics: RoutePlanMetrics) {
  return [
    { label: "Distance", value: formatKm(metrics.distanceKm) },
    { label: "Travel time", value: formatMinutes(metrics.travelMinutes) },
    { label: "Fuel cost", value: formatMoneyPrecise(metrics.fuelCost) },
    { label: "Emissions", value: formatKg(metrics.emissionsKg) },
  ];
}

export function routePointsFor(
  warehouses: Warehouse[],
  originWarehouseId: string,
  destinationPoint: RoutePoint,
  stops: string[],
): RoutePoint[] {
  const origin = warehouses.find((w) => w.id === originWarehouseId) ?? warehouses[0];
  const originX = origin ? origin.mapX : 50;
  const originY = origin ? origin.mapY : 50;
  const stopPoints = stops
    .map((id) => warehouses.find((w) => w.id === id))
    .filter((w): w is Warehouse => Boolean(w))
    .map((w) => ({ x: w.mapX, y: w.mapY }));
  return [{ x: originX, y: originY }, ...stopPoints, destinationPoint];
}
