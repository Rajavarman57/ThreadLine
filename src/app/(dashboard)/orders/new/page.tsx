import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { NewOrderClient } from "./new-order-client";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const user = await getSessionUser();
  if (!user || (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTS)) {
    redirect("/orders");
  }

  const [buyers, distinctBOMs] = await Promise.all([
    prisma.buyer.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.bOM.findMany({
      select: { fabricType: true },
      distinct: ["fabricType"],
      orderBy: { fabricType: "asc" },
    }),
  ]);

  const fabricTypes = distinctBOMs.map((b) => b.fabricType);

  return <NewOrderClient buyers={buyers} fabricTypes={fabricTypes} />;
}
