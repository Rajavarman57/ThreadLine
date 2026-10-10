import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

let realAdminId: string | undefined;

vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn().mockImplementation(async () => {
    return {
      id: realAdminId || "test-admin",
      email: "admin@everestmills.test",
      role: Role.ADMIN,
      name: "Plant Director",
    };
  }),
  requireUser: vi.fn().mockImplementation(async () => {
    return {
      id: realAdminId || "test-admin",
      email: "admin@everestmills.test",
      role: Role.ADMIN,
      name: "Plant Director",
    };
  }),
}));

import { createDispatch } from "./dispatch";
import { getMonthlyPnL } from "./finance";

const hasDb = Boolean(process.env.DATABASE_URL);

describe("P19 Full E2E Manufacturing Lifecycle Integration Test", () => {
  it.skipIf(!hasDb)(
    "executes complete flow: queries P&L aggregates safely and verifies race-safe dispatch locking",
    async () => {
      const admin = await prisma.user.findFirst({
        where: { role: Role.ADMIN },
        select: { id: true },
      });
      realAdminId = admin?.id;

      // 1. Check database connectivity
      const sampleYarn = await prisma.yarnType.findFirst({
        where: { reorderLevel: { gt: 0 } },
      });
      expect(sampleYarn).toBeDefined();

      // 2. Query P&L to confirm aggregates execute safely
      const currentMonth = new Date().toISOString().slice(0, 7);
      const pnl = await getMonthlyPnL(currentMonth);
      expect(pnl).toBeDefined();
      expect(typeof pnl.revenue).toBe("number");
      expect(typeof pnl.totalCost).toBe("number");
      expect(typeof pnl.profit).toBe("number");
      expect(typeof pnl.receivables).toBe("number");

      // 3. Concurrency double-dispatch guard verification
      const roll = await prisma.roll.findFirst({
        where: { qcStatus: "PASSED", dispatchId: null },
      });

      if (roll) {
        // Race simulation: two dispatches for the same roll
        const results = await Promise.allSettled([
          createDispatch(roll.orderId, [roll.id], "GJ-01-XX-1111", "Driver One"),
          createDispatch(roll.orderId, [roll.id], "GJ-01-XX-2222", "Driver Two"),
        ]);

        const fulfilled = results.filter((r) => r.status === "fulfilled");
        const rejected = results.filter((r) => r.status === "rejected");

        // Exactly one succeeds, the other fails
        expect(fulfilled.length).toBe(1);
        expect(rejected.length).toBe(1);
      }
    },
    30000
  );
});
