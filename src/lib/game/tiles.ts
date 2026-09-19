import { BAG_PER_DIGIT, BLANK, BLANK_COUNT, RACK_SIZE } from "./types";

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

export function createBag(rng: Rng = Math.random): number[] {
  const bag: number[] = [];
  for (let digit = 0; digit <= 9; digit++) {
    for (let i = 0; i < BAG_PER_DIGIT; i++) {
      bag.push(digit);
    }
  }
  for (let i = 0; i < BLANK_COUNT; i++) {
    bag.push(BLANK);
  }
  return shuffle(bag, rng);
}

export function isBlankTile(tile: number): boolean {
  return tile === BLANK;
}

export function sortRackTiles<T extends { digit: number }>(tiles: T[]): T[] {
  return tiles.slice().sort((a, b) => {
    if (isBlankTile(a.digit) && !isBlankTile(b.digit)) return 1;
    if (!isBlankTile(a.digit) && isBlankTile(b.digit)) return -1;
    return a.digit - b.digit;
  });
}

export function drawTiles(
  bag: number[],
  count: number,
): { drawn: number[]; bag: number[] } {
  const drawn = bag.slice(0, count);
  return { drawn, bag: bag.slice(count) };
}

export function fillRack(
  rack: number[],
  bag: number[],
): { rack: number[]; bag: number[] } {
  const need = RACK_SIZE - rack.length;
  if (need <= 0) return { rack, bag };
  const { drawn, bag: nextBag } = drawTiles(bag, need);
  return { rack: [...rack, ...drawn], bag: nextBag };
}

export function removeFromRack(
  rack: number[],
  digits: number[],
): number[] | null {
  const next = rack.slice();
  for (const digit of digits) {
    const i = next.indexOf(digit);
    if (i === -1) return null;
    next.splice(i, 1);
  }
  return next;
}

export function rackSum(rack: number[]): number {
  return rack.reduce((sum, digit) => (digit === BLANK ? sum : sum + digit), 0);
}
