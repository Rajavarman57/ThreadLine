import { TrackSearchClient } from "./track-search-client";
import { Package, ShieldCheck, Clock, Factory } from "lucide-react";

export const dynamic = "force-static";

export default function TrackPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs">
              ETM
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Everest Textile Mills</h1>
              <p className="text-[11px] text-slate-400">Public Production Tracker</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl w-full mx-auto p-6 space-y-8 my-auto">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Track Textile Production
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Enter your Everest order confirmation number to view manufacturing stages, spinning progress, quality verification, and dispatch milestones.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <TrackSearchClient />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center pt-6">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5">
            <Factory className="size-5 text-indigo-400 mx-auto" />
            <h4 className="text-xs font-semibold text-white">Live Floor Stages</h4>
            <p className="text-[11px] text-slate-400">
              Spinning, weaving, and dyeing progress reported directly from mill machines.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5">
            <ShieldCheck className="size-5 text-emerald-400 mx-auto" />
            <h4 className="text-xs font-semibold text-white">Quality Inspection</h4>
            <p className="text-[11px] text-slate-400">
              Every roll graded against strict yarn and fabric defect checklists.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5">
            <Clock className="size-5 text-blue-400 mx-auto" />
            <h4 className="text-xs font-semibold text-white">Dynamic Delivery ETA</h4>
            <p className="text-[11px] text-slate-400">
              Proactive timeline tracking and delivery schedule visibility.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-6 border-t border-slate-900 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Everest Textile Mills · ISO 9001 Certified Quality
      </footer>
    </div>
  );
}
