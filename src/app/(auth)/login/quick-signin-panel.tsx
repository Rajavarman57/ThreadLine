"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Boxes,
  Cpu,
  CheckCircle2,
  ReceiptText,
  ShoppingBag,
  Building2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { quickSignIn } from "@/lib/auth/quick-signin";

interface RoleCardItem {
  key: string;
  name: string;
  email: string;
  description: string;
  icon: typeof ShieldCheck;
  color: string;
}

const ROLE_CARDS: RoleCardItem[] = [
  {
    key: "ADMIN",
    name: "Admin",
    email: "admin@everestmills.test",
    description: "Plant governance, master data catalogs, finances and user administration",
    icon: ShieldCheck,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/40",
  },
  {
    key: "STORE",
    name: "Store",
    email: "store@everestmills.test",
    description: "Yarn warehouse stock ledger, goods receipts (GRN) and material allocations",
    icon: Boxes,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20 group-hover:border-sky-500/40",
  },
  {
    key: "SUPERVISOR",
    name: "Supervisor",
    email: "supervisor@everestmills.test",
    description: "Machine scheduling, floor output logs, breakdown alerts and shift attendance",
    icon: Cpu,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40",
  },
  {
    key: "QC",
    name: "Quality",
    email: "qc@everestmills.test",
    description: "Roll inspection queue, 4-point defect grading, rework loops and roll trace",
    icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40",
  },
  {
    key: "ACCOUNTS",
    name: "Accounts",
    email: "accounts@everestmills.test",
    description: "Commercial invoices, payment receipts, wage registers, expenses and P&L",
    icon: ReceiptText,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40",
  },
  {
    key: "BUYER",
    name: "Buyer",
    email: "buyer1@buyers.test",
    description: "Live order tracking stepper, fabric roll status and official tax invoice PDFs",
    icon: ShoppingBag,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
  },
];

const BUYER_CARDS: RoleCardItem[] = [
  {
    key: "buyer1",
    name: "Raymond Lifestyle Apparel",
    email: "buyer1@buyers.test",
    description: "Track Raymond purchase orders, fabric roll inspections and billing",
    icon: Building2,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
  },
  {
    key: "buyer2",
    name: "Arvind Mills Garments Div",
    email: "buyer2@buyers.test",
    description: "Track Arvind purchase orders, fabric roll inspections and billing",
    icon: Building2,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
  },
  {
    key: "buyer3",
    name: "Madura Fashion & Brands (Aditya Birla)",
    email: "buyer3@buyers.test",
    description: "Track Madura purchase orders, fabric roll inspections and billing",
    icon: Building2,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
  },
  {
    key: "buyer4",
    name: "Page Industries (Jockey India)",
    email: "buyer4@buyers.test",
    description: "Track Page Industries purchase orders, fabric roll inspections and billing",
    icon: Building2,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
  },
  {
    key: "buyer5",
    name: "Zodiac Clothing Company",
    email: "buyer5@buyers.test",
    description: "Track Zodiac purchase orders, fabric roll inspections and billing",
    icon: Building2,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
  },
  {
    key: "buyer6",
    name: "Eastman Exports Global",
    email: "buyer6@buyers.test",
    description: "Track Eastman Exports purchase orders, fabric roll inspections and billing",
    icon: Building2,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
  },
];

export function QuickSignInPanel() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const handleRoleClick = async (roleKey: string) => {
    if (activeRole) return;
    setActiveRole(roleKey);

    try {
      const res = await quickSignIn(roleKey);
      if (res.ok && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      } else {
        toast.error(res.error || "Unable to sign in. Please try again.");
        setActiveRole(null);
      }
    } catch {
      toast.error("An unexpected error occurred during sign in.");
      setActiveRole(null);
    }
  };

  const renderCard = (card: RoleCardItem) => {
    const Icon = card.icon;
    const isLoading = activeRole === card.key;
    const isDisabled = activeRole !== null && !isLoading;

    return (
      <button
        key={card.key}
        type="button"
        disabled={activeRole !== null}
        onClick={() => handleRoleClick(card.key)}
        className={`group relative flex flex-col text-left p-3.5 rounded-xl border bg-slate-900/60 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
          isLoading
            ? "border-indigo-500 ring-1 ring-indigo-500 bg-slate-800/80 cursor-wait"
            : isDisabled
            ? "opacity-50 cursor-not-allowed border-slate-800"
            : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 cursor-pointer shadow-sm hover:shadow-md"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`size-7 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${card.color}`}
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin text-indigo-400" />
              ) : (
                <Icon className="size-3.5" />
              )}
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
              {card.name}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 truncate sm:text-right">
            {card.email}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400 font-normal">
          {card.description}
        </p>
      </button>
    );
  };

  return (
    <div className="w-full space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Quick sign-in</h3>
            <p className="text-xs text-slate-400">
              Select an internal role to access its dedicated operations portal
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLE_CARDS.map(renderCard)}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Buyers
            </h4>
            <p className="text-[11px] text-slate-400">
              Access the client portal for commercial customer accounts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUYER_CARDS.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
