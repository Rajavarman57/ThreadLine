import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function BuyerPortalPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
              TL
            </div>
            <span className="font-bold text-white text-base">Threadline Buyer Portal</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-300">{session?.user?.name || session?.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:text-white">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="pb-4 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white">Welcome to your Buyer Portal</h1>
          <p className="text-sm text-slate-400">Track order fulfillment, roll inspection batches, and invoices in real time.</p>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
          Buyer Portal features ready for implementation (Person A ownership).
        </div>
      </main>
    </div>
  );
}
