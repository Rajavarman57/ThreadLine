import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Package,
  Layers,
  Wrench,
  ShieldCheck,
  Truck,
  DollarSign,
  TrendingUp,
  UserCheck,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-static";

const ROLE_GUIDES = [
  {
    role: "Storekeeper (STORE)",
    description: "Responsible for receiving raw yarn shipments, monitoring stock levels, and supervising outbound roll loads.",
    icon: Package,
    color: "text-amber-500",
    actions: [
      { label: "Receive Raw Yarn Goods", href: "/inventory/receipts/new" },
      { label: "Review Stock Overview & Ledger", href: "/inventory" },
      { label: "Inspect Ready Finished Goods", href: "/dispatch" },
    ],
  },
  {
    role: "Production Supervisor (SUPERVISOR)",
    description: "Oversees daily mill floor machines, stages work orders, logs output metres, and records shift worker attendance.",
    icon: Wrench,
    color: "text-blue-500",
    actions: [
      { label: "Plan Stage Work Orders", href: "/production/plan" },
      { label: "Floor Machine Status Board", href: "/production" },
      { label: "Log Daily Worker Attendance", href: "/hr" },
    ],
  },
  {
    role: "Quality Inspector (QC)",
    description: "Performs physical roll inspections, evaluates defect checklists, assigns roll QR tags, and inspects analytics.",
    icon: ShieldCheck,
    color: "text-emerald-500",
    actions: [
      { label: "Inspect Pending Rolls Queue", href: "/quality" },
      { label: "Rolls Register & QR Labels", href: "/quality/rolls" },
      { label: "Defect & Pass Rate Analytics", href: "/quality/analytics" },
    ],
  },
  {
    role: "Accounts Executive (ACCOUNTS)",
    description: "Manages commercial tax billing, logs payment collections, finalises monthly payroll wages, and monitors expenses.",
    icon: DollarSign,
    color: "text-indigo-500",
    actions: [
      { label: "Invoices & Payment Records", href: "/dispatch/invoices" },
      { label: "Monthly Wages & Payroll Register", href: "/hr/wages" },
      { label: "Operational & Facility Expenses", href: "/expenses" },
    ],
  },
  {
    role: "Plant Director / Admin (ADMIN)",
    description: "Total factory oversight: profitability statement, order costing margins, master data setups, and operations.",
    icon: TrendingUp,
    color: "text-rose-500",
    actions: [
      { label: "Owner Financial Dashboard", href: "/finance" },
      { label: "Order Costing & Margin Report", href: "/finance/costing" },
      { label: "Monthly P&L Statement", href: "/finance/pnl" },
      { label: "Master Catalogs & BOM Editor", href: "/master" },
    ],
  },
  {
    role: "Textile Buyer (BUYER)",
    description: "Private external client portal to view purchase order progression, manufacturing stages, and download GST invoices.",
    icon: UserCheck,
    color: "text-violet-500",
    actions: [
      { label: "Purchased Orders Portal", href: "/portal" },
      { label: "Public Order Tracker", href: "/track" },
    ],
  },
];

export default async function HelpPage() {
  return (
    <div className="flex-1 space-y-8 p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Everest Textile Mills · System Role Guide"
        description="Comprehensive reference for factory personnel and textile buyers. Select your role below to learn your standard daily workflows."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROLE_GUIDES.map((guide) => {
          const Icon = guide.icon;
          return (
            <div
              key={guide.role}
              className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-border/80 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-muted/60 border border-border">
                    <Icon className={`size-5 ${guide.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {guide.role}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {guide.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Quick Actions:
                </span>
                <div className="space-y-1.5">
                  {guide.actions.map((act) => (
                    <Link
                      key={act.href}
                      href={act.href}
                      className="flex items-center justify-between text-xs font-medium text-foreground hover:text-primary p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
