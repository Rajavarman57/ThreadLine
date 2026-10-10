export default function MasterPage() {
  return (
    <div className="space-y-4">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Master Data</h1>
        <p className="text-sm text-slate-400">Suppliers, buyers, machines, yarn types, and BOM configuration.</p>
      </div>
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
        Master data module ready for implementation (Person A ownership).
      </div>
    </div>
  );
}
