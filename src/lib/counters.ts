import { prisma } from "./db";
import { Prisma } from "@prisma/client";

/**
 * Atomically generates the next sequential number for a given counter key.
 * Uses atomic upsert-increment inside a transaction to guarantee uniqueness
 * across concurrent requests.
 *
 * @param key Unique counter identifier (e.g. 'orderNo', 'rollNo', 'invoiceNo', 'dispatchNo', 'poNo')
 * @param prefix Optional string prefix (e.g. 'ORD-', 'ROLL-', 'INV-')
 * @param padLength Optional padding length for numeric sequence (default: 6)
 * @param tx Optional Prisma transaction or client
 * @returns Formatted sequence string (e.g. 'ORD-000001')
 */
export async function nextNumber(
  key: string,
  prefix = "",
  padLength = 6,
  tx?: Prisma.TransactionClient
): Promise<string> {
  let counter;
  if (tx) {
    counter = await tx.counter.upsert({
      where: { key },
      create: { key, value: 1 },
      update: { value: { increment: 1 } },
    });
  } else {
    counter = await prisma.$transaction(async (client) => {
      return client.counter.upsert({
        where: { key },
        create: { key, value: 1 },
        update: { value: { increment: 1 } },
      });
    });
  }

  const formattedValue = String(counter.value).padStart(padLength, "0");
  return `${prefix}${formattedValue}`;
}
