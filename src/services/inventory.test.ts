import { describe, it, expect } from "vitest";
import { calculateStockBalances } from "./inventory-math";
import { StockMovementReason } from "@prisma/client";

describe("calculateStockBalances (Stock ledger rules)", () => {
  it("calculates onHand correctly from receipts and issues", () => {
    const summary = [
      { reason: StockMovementReason.RECEIPT, _sum: { qty: 1000 } },
      { reason: StockMovementReason.ISSUE, _sum: { qty: -300 } },
    ];

    const result = calculateStockBalances(summary);
    expect(result.onHand).toBe(700);
    expect(result.reserved).toBe(0);
    expect(result.available).toBe(700);
  });

  it("handles ADJUST signed movements correctly", () => {
    const summary = [
      { reason: StockMovementReason.RECEIPT, _sum: { qty: 500 } },
      { reason: StockMovementReason.ADJUST, _sum: { qty: -50 } }, // stock write-down
    ];

    const result = calculateStockBalances(summary);
    expect(result.onHand).toBe(450);
    expect(result.available).toBe(450);
  });

  it("calculates reserved and available with RESERVE and RELEASE", () => {
    const summary = [
      { reason: StockMovementReason.RECEIPT, _sum: { qty: 1200 } },
      { reason: StockMovementReason.ISSUE, _sum: { qty: -200 } },
      { reason: StockMovementReason.RESERVE, _sum: { qty: 400 } },
      { reason: StockMovementReason.RELEASE, _sum: { qty: 150 } },
    ];

    const result = calculateStockBalances(summary);
    expect(result.onHand).toBe(1000); // 1200 - 200
    expect(result.reserved).toBe(250); // 400 - 150
    expect(result.available).toBe(750); // 1000 - 250
  });

  it("ensures reserved does not drop below zero if releases exceed reservations", () => {
    const summary = [
      { reason: StockMovementReason.RECEIPT, _sum: { qty: 500 } },
      { reason: StockMovementReason.RESERVE, _sum: { qty: 100 } },
      { reason: StockMovementReason.RELEASE, _sum: { qty: 120 } },
    ];

    const result = calculateStockBalances(summary);
    expect(result.onHand).toBe(500);
    expect(result.reserved).toBe(0);
    expect(result.available).toBe(500);
  });
});
