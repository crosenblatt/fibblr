import { describe, expect, it } from "vitest";
import { premiumAt } from "./board";
import { CENTER } from "./types";

describe("premiumAt", () => {
  it("marks the official center as a double-word star", () => {
    expect(premiumAt(CENTER, CENTER)).toBe("center");
  });

  it("places triple words in the corners", () => {
    expect(premiumAt(0, 0)).toBe("tw");
    expect(premiumAt(14, 14)).toBe("tw");
  });

  it("places double-letter and triple-letter squares", () => {
    expect(premiumAt(0, 3)).toBe("dl");
    expect(premiumAt(1, 5)).toBe("tl");
  });
});
