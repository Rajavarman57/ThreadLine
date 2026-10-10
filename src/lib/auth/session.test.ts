import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRole, UnauthorizedError, ForbiddenError } from "./session";
import * as authIndex from "./index";
import { Role } from "@prisma/client";

import type { Session } from "next-auth";
import type { Mock } from "vitest";

vi.mock("./index", () => ({
  auth: vi.fn(),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const mockAuth = authIndex.auth as unknown as Mock;

describe("requireRole guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when user role matches permitted roles", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_admin",
        name: "Admin User",
        email: "admin@everestmills.test",
        role: Role.ADMIN,
      },
      expires: "2099-01-01",
    } as unknown as Session);

    const user = await requireRole([Role.ADMIN, Role.SUPERVISOR]);
    expect(user).toBeDefined();
    expect(user.id).toBe("usr_admin");
    expect(user.role).toBe(Role.ADMIN);
  });

  it("throws ForbiddenError when user has an unauthorized role", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr_buyer",
        name: "Buyer User",
        email: "buyer@test.com",
        role: Role.BUYER,
      },
      expires: "2099-01-01",
    } as unknown as Session);

    await expect(requireRole([Role.ADMIN, Role.STORE])).rejects.toThrow(ForbiddenError);
  });

  it("throws UnauthorizedError when session is not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    await expect(requireRole([Role.ADMIN])).rejects.toThrow(UnauthorizedError);
  });
});
