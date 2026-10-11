"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

/**
 * Fixed server-side allow-list of quick sign-in roles and their fixed emails and landing routes.
 * An arbitrary email or password from the client is strictly forbidden.
 */
const QUICK_SIGNIN_ROLES = {
  ADMIN: {
    roleKey: "ADMIN",
    roleName: "Admin",
    email: "admin@everestmills.test",
    description: "Plant governance, master data catalogs, finances and user administration",
    redirectTo: "/orders",
  },
  STORE: {
    roleKey: "STORE",
    roleName: "Store",
    email: "store@everestmills.test",
    description: "Yarn warehouse stock ledger, goods receipts (GRN) and material allocations",
    redirectTo: "/inventory",
  },
  SUPERVISOR: {
    roleKey: "SUPERVISOR",
    roleName: "Supervisor",
    email: "supervisor@everestmills.test",
    description: "Machine scheduling, floor output logs, breakdown alerts and shift attendance",
    redirectTo: "/production",
  },
  QC: {
    roleKey: "QC",
    roleName: "Quality",
    email: "qc@everestmills.test",
    description: "Roll inspection queue, 4-point defect grading, rework loops and roll trace",
    redirectTo: "/quality",
  },
  ACCOUNTS: {
    roleKey: "ACCOUNTS",
    roleName: "Accounts",
    email: "accounts@everestmills.test",
    description: "Commercial invoices, payment receipts, wage registers, expenses and P&L",
    redirectTo: "/dispatch/invoices",
  },
  BUYER: {
    roleKey: "BUYER",
    roleName: "Buyer",
    email: "buyer1@buyers.test",
    description: "Live order tracking stepper, fabric roll status and official tax invoice PDFs",
    redirectTo: "/portal",
  },
} as const;

type QuickSignInRoleKey = keyof typeof QUICK_SIGNIN_ROLES;

export interface QuickSignInResponse {
  ok: boolean;
  redirectTo?: string;
  error?: string;
}

/**
 * Signs in a user using a pre-configured role key.
 * Gated by QUICK_SIGNIN_ENABLED === "true".
 * Reads credentials securely on the server and invokes the standard credentials flow.
 */
export async function quickSignIn(roleKey: string): Promise<QuickSignInResponse> {
  if (process.env.QUICK_SIGNIN_ENABLED !== "true") {
    return {
      ok: false,
      error: "Quick sign-in is currently disabled.",
    };
  }

  const roleConfig = QUICK_SIGNIN_ROLES[roleKey as QuickSignInRoleKey];
  if (!roleConfig) {
    return {
      ok: false,
      error: "Invalid role selection.",
    };
  }

  const password = process.env.QUICK_SIGNIN_PASSWORD;
  if (!password) {
    return {
      ok: false,
      error: "Quick sign-in password is not configured on the server.",
    };
  }

  try {
    // Calls standard Credentials signIn flow on the server.
    // Sets session cookies and adheres to rate limiting and audit logging.
    await signIn("credentials", {
      email: roleConfig.email,
      password,
      redirect: false,
    });

    return {
      ok: true,
      redirectTo: roleConfig.redirectTo,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            ok: false,
            error: "Authentication failed. Please verify account status.",
          };
        default:
          return {
            ok: false,
            error: error.message || "An authentication error occurred.",
          };
      }
    }

    const message = error instanceof Error ? error.message : "Unable to sign in. Please try again.";
    return {
      ok: false,
      error: message,
    };
  }
}
