import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("utils cn helper", () => {
  it("merges class names correctly", () => {
    const result = cn("px-2 py-1", "bg-red-500");
    expect(result).toBe("px-2 py-1 bg-red-500");
  });
});
