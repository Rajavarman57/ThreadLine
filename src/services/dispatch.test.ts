import { describe, it, expect, vi, beforeAll } from "vitest";
import { prisma } from "@/lib/db";
import { QCStatus, Role } from "@prisma/client";

let testUserId: string | undefined;

vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn().mockImplementation(async () => {
    return {
      id: testUserId,
      email: "admin@everestmills.test",
      role: Role.ADMIN,
      name: "Plant Director",
    };
  }),
}));

import { createDispatch } from "@/services/dispatch";

describe("P12 Dispatch Concurrency & Race-Safe Tests", () => {
  const hasDb = Boolean(process.env.DATABASE_URL);

  beforeAll(async () => {
    if (hasDb) {
      const admin = await prisma.user.findFirst({
        where: { role: Role.ADMIN },
        select: { id: true },
      });
      testUserId = admin?.id;
    }
  });

  it.skipIf(!hasDb)(
    "fires two simultaneous createDispatch calls for the same roll and asserts exactly one succeeds",
    async () => {
      // 1. Locate an existing active order with at least 1 undispatched PASSED roll,
      // or create a test roll for an existing order.
      const order = await prisma.order.findFirst({
        include: {
          rolls: {
            where: { qcStatus: QCStatus.PASSED, dispatchId: null },
            take: 1,
          },
        },
      });

      if (!order) {
        console.warn("No order found in test DB, skipping test.");
        return;
      }

      let testRoll = order.rolls[0];

      // If no undispatched passed roll exists on this order, create a dedicated test roll
      if (!testRoll) {
        testRoll = await prisma.roll.create({
          data: {
            rollNo: `TEST-RACE-${Date.now()}`,
            orderId: order.id,
            lengthM: 100,
            qcStatus: QCStatus.PASSED,
          },
        });
      }

      const rollIds = [testRoll.id];

      // 2. Fire two simultaneous createDispatch calls
      const promise1 = createDispatch(
        order.id,
        rollIds,
        "TN 38 RACE 01",
        "Driver A"
      );

      const promise2 = createDispatch(
        order.id,
        rollIds,
        "TN 38 RACE 02",
        "Driver B"
      );

      const results = await Promise.allSettled([promise1, promise2]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      if (rejected.length > 0) {
        console.log("Rejected errors:", rejected.map((r: any) => r.reason?.message || r.reason));
      }

      // Exactly ONE must succeed, and exactly ONE must fail with already dispatched error
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      if (rejected[0].status === "rejected") {
        expect(rejected[0].reason?.message).toMatch(/already been dispatched/i);
      }
    },
    30000
  );
});
