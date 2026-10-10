import { auth } from "./index";
import { Role } from "@prisma/client";

export class UnauthorizedError extends Error {
  code = "UNAUTHORIZED";
  status = 401;

  constructor(message = "Authentication required. Please sign in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  code = "FORBIDDEN";
  status = 403;

  constructor(
    currentRole?: Role,
    allowedRoles?: Role[],
    message = "You do not have permission to perform this action."
  ) {
    const detail = currentRole && allowedRoles ? ` (Your role: ${currentRole}, required: [${allowedRoles.join(", ")}])` : "";
    super(`${message}${detail}`);
    this.name = "ForbiddenError";
  }
}

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  buyerId?: string | null;
}

/**
 * Returns current authenticated user or null. Does not throw.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    buyerId: session.user.buyerId,
  };
}

/**
 * Ensures user is authenticated and returns the user object, or throws UnauthorizedError.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

/**
 * Enforces role-based access for Server Actions and Route Handlers.
 * Throws UnauthorizedError if unauthenticated, or ForbiddenError if user role is not allowed.
 */
export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(user.role, allowedRoles);
  }

  return user;
}
