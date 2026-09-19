import { BOARD_SIZE, idx, premiumAt, type Placement } from "@/lib/game";

const premiumClass: Record<string, string> = {
  none: "bg-[var(--board)]",
  dl: "bg-[var(--dl)]",
  tl: "bg-[var(--tl)] text-white",
  dw: "bg-[var(--dw)]",
  tw: "bg-[var(--tw)] text-white",
  center: "bg-[var(--center)]",
};

const premiumLabel: Record<string, string> = {
  none: "",
  dl: "2L",
  tl: "3L",
  dw: "2W",
  tw: "3W",
  center: "★",
};

type Props = {
  board: (number | null)[];
  pending: Placement[];
  lastPlacements: Placement[];
  canPlace: boolean;
  onPlace: (row: number, col: number) => void;
  onRemovePending: (row: number, col: number) => void;
};

export function Board({
  board,
  pending,
  lastPlacements,
  canPlace,
  onPlace,
  onRemovePending,
}: Props) {
  const pendingAt = new Map(pending.map((p) => [`${p.row},${p.col}`, p.digit]));
  const lastAt = new Set(lastPlacements.map((p) => `${p.row},${p.col}`));

  return (
    <div
      className="inline-grid gap-px rounded-md bg-[#7a6240] p-1"
      style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
    >
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        const premium = premiumAt(row, col);
        const committed = board[idx(row, col)];
        const ghost = pendingAt.get(`${row},${col}`);
        const digit = ghost ?? committed;
        const isLast = lastAt.has(`${row},${col}`);
        return (
          <button
            key={i}
            type="button"
            disabled={!canPlace && ghost === undefined}
            onClick={() => {
              if (ghost !== undefined) onRemovePending(row, col);
              else if (committed === null) onPlace(row, col);
            }}
            className={`relative flex h-[min(6vw,2.15rem)] w-[min(6vw,2.15rem)] items-center justify-center text-[10px] font-semibold sm:text-xs ${premiumClass[premium]} ${
              ghost !== undefined ? "ring-2 ring-[#1b2420] ring-inset" : ""
            } ${isLast ? "outline outline-2 outline-[#5c7a3a]" : ""}`}
            aria-label={`Row ${row + 1} column ${col + 1}`}
          >
            {digit !== null && digit !== undefined ? (
              <span className="flex h-[85%] w-[85%] items-center justify-center rounded-[3px] bg-[#f7edd2] text-[#2a2418] shadow-sm">
                {digit}
              </span>
            ) : (
              <span className="opacity-80">{premiumLabel[premium]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
