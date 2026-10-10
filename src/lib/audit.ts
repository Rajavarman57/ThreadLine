import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface LogActionParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
}

/**
 * Persists an event record into AuditLog.
 */
export async function logAction({
  userId,
  action,
  entity,
  entityId,
  meta,
}: LogActionParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        entity,
        entityId: entityId ?? undefined,
        meta: meta ?? undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write to AuditLog:", error);
  }
}
