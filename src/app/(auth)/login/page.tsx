import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "./login-form";
import { QuickSignInPanel } from "./quick-signin-panel";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const isQuickSignInEnabled = process.env.QUICK_SIGNIN_ENABLED === "true";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500 selection:text-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-8">
        <div className="inline-flex size-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-white text-2xl mb-4">
          TL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Threadline</h1>
        <p className="mt-2 text-sm font-medium text-indigo-400">
          Operations platform for Everest Textile Mills
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full sm:max-w-xl space-y-6">
        <Suspense
          fallback={
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <Loader2 className="size-6 animate-spin mx-auto text-indigo-400" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {isQuickSignInEnabled && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-950 px-3 text-slate-500 font-medium">
                or sign in with email
              </span>
            </div>
          </div>
        )}

        {isQuickSignInEnabled && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <QuickSignInPanel />
          </div>
        )}
      </div>
    </div>
  );
}
