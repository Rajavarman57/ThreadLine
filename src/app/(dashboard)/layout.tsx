import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { getLowStockCount } = await import("@/services/inventory");
  const lowStockCount = await getLowStockCount().catch(() => 0);

  return (
    <DashboardShell user={user} lowStockCount={lowStockCount}>
      {children}
    </DashboardShell>
  );
}
