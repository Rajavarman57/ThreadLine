import {
  getPlanningEligibleOrders,
  getIdleMachines,
} from "@/services/production";
import { getSessionUser } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { PlanProductionClient } from "./plan-client";

export const dynamic = "force-dynamic";

export default async function ProductionPlanPage() {
  const user = await getSessionUser();
  if (
    !user ||
    (user.role !== Role.ADMIN && user.role !== Role.SUPERVISOR)
  ) {
    redirect("/production");
  }

  const [orders, idleMachines] = await Promise.all([
    getPlanningEligibleOrders(),
    getIdleMachines(),
  ]);

  return <PlanProductionClient orders={orders} idleMachines={idleMachines} />;
}
