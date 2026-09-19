import { describe, expect, it } from "vitest";
import { isFibSequence, isValidSequence } from "./fib";

describe("isValidSequence", () => {
  it("accepts length 0–1", () => {
    expect(isValidSequence([])).toBe(true);
    expect(isValidSequence([4])).toBe(true);
  });

  it("accepts two tiles that differ by exactly 1, wrapping 9–0", () => {
    expect(isValidSequence([8, 7])).toBe(true);
    expect(isValidSequence([8, 9])).toBe(true);
    expect(isValidSequence([0, 1])).toBe(true);
    expect(isValidSequence([9, 0])).toBe(true);
    expect(isValidSequence([0, 9])).toBe(true);
  });

  it("rejects two tiles that are the same or farther than 1", () => {
    expect(isValidSequence([8, 8])).toBe(false);
    expect(isValidSequence([8, 3])).toBe(false);
    expect(isValidSequence([1, 9])).toBe(false);
  });
});

describe("isFibSequence", () => {
  it("requires at least 3 tiles", () => {
    expect(isFibSequence([8, 3])).toBe(false);
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
