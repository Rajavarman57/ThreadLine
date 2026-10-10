import { prisma } from "@/lib/db";
import { getAvailableStock } from "./inventory";
import {
  checkFeasibilitySchema,
  CheckFeasibilityInput,
} from "./schemas/orders";

export interface FeasibilityLine {
  yarnTypeId: string;
  yarnType: string;
  colour: string;
  unit: string;
  required: number;
  available: number;
  shortfall: number;
  feasible: boolean;
}

export interface FeasibilityResult {
  feasible: boolean;
  fabricType: string;
  qtyMetres: number;
  lines: FeasibilityLine[];
}

/**
 * Checks BOM yarn requirements against live available warehouse stock.
 * required = qtyMetres * BOM.yarnPerMetre per yarn component.
 * Returns { feasible: boolean, lines: [...] } with calculated shortfalls.
 */
export async function checkFeasibility(
  input: CheckFeasibilityInput
): Promise<FeasibilityResult> {
  const { fabricType, qtyMetres } = checkFeasibilitySchema.parse(input);

  const boms = await prisma.bOM.findMany({
    where: { fabricType },
    include: {
      yarnType: {
        select: { id: true, type: true, colour: true, unit: true },
      },
    },
  });

  if (boms.length === 0) {
    return {
      feasible: true,
      fabricType,
      qtyMetres,
      lines: [],
    };
  }

  const lines: FeasibilityLine[] = await Promise.all(
    boms.map(async (b) => {
      const required = Number((Number(b.yarnPerMetre) * qtyMetres).toFixed(4));
      const { available } = await getAvailableStock(b.yarnTypeId);
      const shortfall = Number(Math.max(0, required - available).toFixed(4));

      return {
        yarnTypeId: b.yarnTypeId,
        yarnType: b.yarnType.type,
        colour: b.yarnType.colour,
        unit: b.yarnType.unit,
        required,
        available,
        shortfall,
        feasible: shortfall === 0,
      };
    })
  );

  const overallFeasible = lines.every((l) => l.feasible);

  return {
    feasible: overallFeasible,
    fabricType,
    qtyMetres,
    lines,
  };
}
