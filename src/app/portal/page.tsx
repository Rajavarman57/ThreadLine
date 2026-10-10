import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBuyerOrders } from "@/services/tracking";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Package,
  Layers,
  ArrowRight,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BuyerPortalPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Buyer verification
  if (session.user.role !== "BUYER" || !session.user.buyerId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-xs text-slate-400">
            This portal is exclusively accessible to verified textile buyers.
          </p>
          <Link href="/">
            <Button size="sm" variant="outline" className="border-slate-800 text-slate-300">
              Return to Staff Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const orders = await getBuyerOrders(session.user.buyerId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              ETM
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">
                Everest Textile Mills
              </span>
              <span className="text-xs text-slate-400 block font-normal -mt-0.5">
                Buyer Client Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right hidden sm:block">
              <span className="font-semibold text-white block">
                {session.user.name || "Buyer Account"}
              </span>
              <span className="text-slate-400">{session.user.email}</span>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 text-slate-300 hover:text-white bg-slate-900 text-xs h-8"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Purchased Production Orders
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live manufacturing status, progress completion, and shipment manifests.
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <Package className="size-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Active Orders</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any active or historic production orders placed with Everest Textile Mills yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const isDone = order.status === "DISPATCHED";
              const isReady = order.status === "READY";

              return (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          {order.orderNo}
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          {order.fabricType}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">
                          Colour: {order.colour}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isDone
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : isReady
                            ? "bg-blue-950 text-blue-400 border border-blue-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Progress</span>
                        <span className="font-bold text-white font-mono">
                          {order.percentComplete}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDone
                              ? "bg-emerald-500"
                              : order.isAtRisk
                              ? "bg-amber-500"
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${order.percentComplete}%` }}
                        />
                      </div>
                    </div>

                    {/* Order Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-400 text-[11px]">Quantity</span>
                        <p className="font-semibold text-white">
                          {order.qtyMetres.toLocaleString()} m
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Est. Delivery</span>
                        <p className="font-semibold text-white">
                          {new Date(order.deadline).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {order.isAtRisk && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-[11px] text-amber-400 font-medium">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        <span>Fulfillment timeline flagged at risk</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800">
                    <Link
                      href={`/portal/orders/${order.orderNo}`}
                      className="inline-flex items-center justify-between w-full text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>View Live Stage & Dispatch Tracking</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
