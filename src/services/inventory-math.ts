import { StockMovementReason } from "@prisma/client";

export interface MovementSummaryRow {
  reason: StockMovementReason;
  _sum: {
    qty: number | null;
  };
}

export interface StockBalances {
  onHand: number;
  reserved: number;
  available: number;
}

/**
 * Pure calculation helper for stock balances based on aggregated movements.
 *
 * Stock rules:
 * - StockMovement.qty is signed:
 *     RECEIPT: positive (+)
 *     ISSUE: negative (-)
 *     ADJUST: signed (+ or -)
 *     RESERVE: positive (+)
 *     RELEASE: positive (+)
 * - onHand = sum(RECEIPT) + sum(ISSUE) + sum(ADJUST)
 * - reserved = sum(RESERVE) - sum(RELEASE)
 * - available = onHand - reserved
 */
export function calculateStockBalances(movements: MovementSummaryRow[]): StockBalances {
  let onHand = 0;
  let reserveTotal = 0;
  let releaseTotal = 0;

  for (const m of movements) {
    const qty = m._sum.qty ?? 0;
    switch (m.reason) {
      case StockMovementReason.RECEIPT:
      case StockMovementReason.ISSUE:
      case StockMovementReason.ADJUST:
        onHand += qty;
        break;
      case StockMovementReason.RESERVE:
        reserveTotal += qty;
        break;
      case StockMovementReason.RELEASE:
        releaseTotal += qty;
        break;
    }
  }

  const reserved = Math.max(0, reserveTotal - releaseTotal);
  const available = onHand - reserved;

  return {
    onHand: Number(onHand.toFixed(4)),
    reserved: Number(reserved.toFixed(4)),
    available: Number(available.toFixed(4)),
  };
}
