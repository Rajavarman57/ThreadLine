import Link from "next/link";
import { 
  Boxes, 
  ClipboardList, 
  Cpu, 
  CheckCircle2, 
  Truck, 
  ReceiptText, 
  ArrowRight,
  ShieldCheck,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const modules = [
  { name: "Raw Material & Procurement", icon: Boxes, desc: "Supplier management, yarn lot reception, and barcode-tracked warehouse storage." },
  { name: "Orders & Production Planning", icon: ClipboardList, desc: "Customer orders, BOM feasibility calculations, and work order scheduling." },
  { name: "Production Floor", icon: Cpu, desc: "Spinning, weaving, and dyeing machines output and roll batch tracking." },
  { name: "Quality Control", icon: CheckCircle2, desc: "Defect logging and roll inspection gating. Roll.qcStatus = PASSED required for dispatch." },
  { name: "Dispatch & Logistics", icon: Truck, desc: "Roll allocation, transport manifests, vehicle assignments, and delivery tracking." },
  { name: "Costing & Invoicing", icon: ReceiptText, desc: "Real-time production costing, accounts reconciliation, buyer invoicing, and P&L." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-white text-lg">
              TL
            </div>
            <div>
              <span className="font-bold tracking-tight text-lg text-white">Threadline</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Everest Textile Mills
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/portal">
              <Button variant="ghost" className="text-slate-300 hover:text-white text-sm">
                Buyer Portal
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/25">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium mb-8">
          <Building2 className="size-3.5 text-indigo-400" />
          <span>Everest Textile Mills Operations System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
          Threadline
        </h1>

        <p className="mt-4 text-xl sm:text-2xl font-medium text-indigo-400 max-w-2xl">
          Operations platform for Everest Textile Mills
        </p>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Integrated operations platform covering raw material procurement, floor production, quality control, dispatch, invoicing, workforce, and costing.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white h-11 px-8 shadow-lg shadow-indigo-600/30 gap-2">
              Sign in <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/track/TL-ORD-1001">
            <Button size="lg" variant="outline" className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 h-11 px-6">
              Track Order
            </Button>
          </Link>
        </div>

        {/* Operational Modules */}
        <section className="mt-24 w-full text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Enterprise Operational Modules</h2>
              <p className="text-sm text-slate-400 mt-1">End-to-end textile mill workflow and custody management</p>
            </div>
            <div className="mt-3 sm:mt-0 flex items-center gap-2 text-xs text-emerald-400/90 bg-emerald-400/10 px-3 py-1 rounded-md border border-emerald-400/20">
              <ShieldCheck className="size-3.5" />
              <span>Strict QC Gates & Stock Movement Auditing</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div 
                  key={mod.name} 
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/70 hover:border-indigo-500/40 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-500">0{idx + 1}</span>
                  </div>
                  <h3 className="font-semibold text-white text-base">{mod.name}</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-snug">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>Threadline • Operations platform for Everest Textile Mills</p>
      </footer>
    </div>
  );
}
