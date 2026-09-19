import { describe, expect, it } from "vitest";
import { createBag, isBlankTile, sortRackTiles } from "./tiles";
import { BLANK, BLANK_COUNT } from "./types";

describe("bag and rack helpers", () => {
  it("includes two blank wildcards", () => {
    const bag = createBag(() => 0.5);
    expect(bag.filter(isBlankTile)).toHaveLength(BLANK_COUNT);
    expect(bag).toHaveLength(102);
  });

  it("sorts digits then blanks", () => {
    const sorted = sortRackTiles([
      { digit: 9, i: 0 },
      { digit: BLANK, i: 1 },
      { digit: 2, i: 2 },
      { digit: 2, i: 3 },
    ]);
    expect(sorted.map((t) => t.digit)).toEqual([2, 2, 9, BLANK]);
  });
});
