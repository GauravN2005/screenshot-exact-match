import { describe, it, expect, beforeEach } from "vitest";
import { demoStore } from "@/services/demo-store";
import { stockStatus, daysUntilExpiry, computeRouteMetrics, isShipmentOnTime } from "@/lib/calc";
import { toCsv } from "@/lib/csv";
import type { Product, StockRecord, Shipment } from "@/types";

describe("EcoChain Business Logic & State", () => {
  beforeEach(() => {
    demoStore.resetDemoData();
  });

  describe("Stock Transfer Rules", () => {
    it("successfully transfers stock when quantity is valid and available", () => {
      const state = demoStore.getState();
      const product = state.products[0]!;
      const fromWh = "wh-blr";
      const toWh = "wh-del";

      // Set initial count
      demoStore.updateStock(product.id, fromWh, 100);
      demoStore.updateStock(product.id, toWh, 20);

      const res = demoStore.transferStock(product.id, fromWh, toWh, 40);
      expect(res.success).toBe(true);

      const updated = demoStore.getState();
      const updatedFrom = updated.stock.find(
        (s) => s.productId === product.id && s.warehouseId === fromWh,
      );
      const updatedTo = updated.stock.find(
        (s) => s.productId === product.id && s.warehouseId === toWh,
      );

      expect(updatedFrom?.quantity).toBe(60);
      expect(updatedTo?.quantity).toBe(60);
    });

    it("rejects transfer when requested quantity exceeds available stock", () => {
      const state = demoStore.getState();
      const product = state.products[0]!;
      demoStore.updateStock(product.id, "wh-blr", 10);

      const res = demoStore.transferStock(product.id, "wh-blr", "wh-del", 50);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Insufficient stock");
    });

    it("rejects transfer when source and destination warehouse are identical", () => {
      const state = demoStore.getState();
      const product = state.products[0]!;
      const res = demoStore.transferStock(product.id, "wh-blr", "wh-blr", 10);
      expect(res.success).toBe(false);
      expect(res.error).toContain("cannot be the same");
    });
  });

  describe("Stock Status Computations", () => {
    const dummyProduct: Product = {
      id: "PTEST",
      sku: "TEST-01",
      name: "Test Almond Milk",
      category: "Dairy",
      unit: "liters",
      unitCost: 10,
      reorderLevel: 25,
      expiryDate: null,
      supplier: "Test Corp",
    };

    it("evaluates out_of_stock when quantity is 0", () => {
      const rec: StockRecord = { productId: dummyProduct.id, warehouseId: "wh-blr", quantity: 0 };
      expect(stockStatus(rec, dummyProduct)).toBe("out_of_stock");
    });

    it("evaluates low_stock when quantity is below or equal to reorderLevel", () => {
      const rec: StockRecord = { productId: dummyProduct.id, warehouseId: "wh-blr", quantity: 20 };
      expect(stockStatus(rec, dummyProduct)).toBe("low_stock");
    });

    it("evaluates in_stock when quantity is comfortably above reorderLevel", () => {
      const rec: StockRecord = { productId: dummyProduct.id, warehouseId: "wh-blr", quantity: 150 };
      expect(stockStatus(rec, dummyProduct)).toBe("in_stock");
    });

    it("evaluates near_expiry when product expiry is within 30 days", () => {
      const nearFuture = new Date();
      nearFuture.setDate(nearFuture.getDate() + 15);
      const perishable: Product = { ...dummyProduct, expiryDate: nearFuture.toISOString() };
      const rec: StockRecord = { productId: dummyProduct.id, warehouseId: "wh-blr", quantity: 100 };
      expect(stockStatus(rec, perishable)).toBe("near_expiry");
    });
  });

  describe("Route Optimizer Metrics", () => {
    it("deterministically calculates suggested route with shorter distance than baseline", () => {
      const origin = { x: 58, y: 70 };
      const dest = { x: 64, y: 66 };
      const stops = [{ x: 57, y: 56 }];

      const { current, suggested } = computeRouteMetrics(origin, dest, stops, "truck", "standard");
      expect(current.distanceKm).toBeGreaterThan(0);
      expect(suggested.distanceKm).toBeLessThanOrEqual(current.distanceKm);
      expect(suggested.emissionsKg).toBeLessThanOrEqual(current.emissionsKg);
    });
  });

  describe("CSV Export Generator", () => {
    it("correctly escapes commas and double quotes per RFC 4180", () => {
      const rows = [{ Name: 'Product "Deluxe"', Notes: "Fragile, handle with care", Qty: 42 }];
      const csv = toCsv(rows);
      expect(csv).toContain('"Product ""Deluxe"""');
      expect(csv).toContain('"Fragile, handle with care"');
      expect(csv).toContain("42");
    });

    it("handles empty dataset without error", () => {
      expect(toCsv([])).toBe("");
    });
  });

  describe("Recommendation Decisions", () => {
    it("records acceptance and updates recommendation status", () => {
      const state = demoStore.getState();
      const rec = state.recommendations[0]!;
      demoStore.decideRecommendation(rec.id, "accepted", "Approved for demo");

      const updated = demoStore.getState();
      const updatedRec = updated.recommendations.find((r) => r.id === rec.id);
      expect(updatedRec?.status).toBe("accepted");
      expect(updatedRec?.decisionNote).toContain("Approved for demo");
      expect(updatedRec?.decidedAt).not.toBeNull();
    });
  });
});
