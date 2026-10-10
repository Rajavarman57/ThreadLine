import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/orders", label: "Orders" },
  { href: "/inventory", label: "Inventory" },
  { href: "/production", label: "Production" },
  { href: "/quality", label: "Quality" },
  { href: "/dispatch", label: "Dispatch" },
  { href: "/finance", label: "Finance" },
  { href: "/hr", label: "HR" },
  { href: "/master", label: "Master" },
  { href: "/expenses", label: "Expenses" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Dashboard Topbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/orders" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
                TL
              </div>
              <span className="font-bold text-white text-base">Threadline</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {session?.user && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-medium text-slate-200">{session.user.name || session.user.email}</span>
                <span className="text-xs text-indigo-400 font-mono">{session.user.role}</span>
              </div>
            )}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
