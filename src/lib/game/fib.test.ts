import { describe, expect, it } from "vitest";
import { isFibSequence } from "./fib";

describe("isFibSequence", () => {
  it("accepts connectors shorter than 3", () => {
    expect(isFibSequence([])).toBe(true);
    expect(isFibSequence([4])).toBe(true);
    expect(isFibSequence([8, 3])).toBe(true);
  });

  it("accepts classic Fibonacci modulo 10", () => {
    expect(isFibSequence([1, 1, 2, 3, 5, 8, 3])).toBe(true);
  });

  it("accepts wraparound 8,3,1", () => {
    expect(isFibSequence([8, 3, 1])).toBe(true);
  });

  it("rejects a break in the recurrence", () => {
    expect(isFibSequence([1, 1, 3])).toBe(false);
    expect(isFibSequence([1, 1, 2, 4])).toBe(false);
  });

  it("accepts 1,2,3", () => {
    expect(isFibSequence([1, 2, 3])).toBe(true);
  });
});
