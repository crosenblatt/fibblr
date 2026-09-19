import { BOARD_SIZE, idx, premiumAt } from "@/lib/game";
import { readTileDrag, setTileDrag, type TileDrag } from "@/lib/drag";
import { TileFace } from "@/components/TileFace";
import { useRef } from "react";

type PendingCell = {
  row: number;
  col: number;
  digit: number;
  rackIndex: number;
  blank?: boolean;
};

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
  blanks: boolean[];
  pending: PendingCell[];
  lastPlacements: { row: number; col: number }[];
  canPlace: boolean;
  canDrop: boolean;
  onPlace: (row: number, col: number) => void;
  onDropTile: (row: number, col: number, payload: TileDrag) => void;
  onRemovePending: (row: number, col: number) => void;
};

export function Board({
  board,
  blanks,
  pending,
  lastPlacements,
  canPlace,
  canDrop,
  onPlace,
  onDropTile,
  onRemovePending,
}: Props) {
  const pendingAt = new Map(
    pending.map((p) => [`${p.row},${p.col}`, p] as const),
  );
  const lastAt = new Set(lastPlacements.map((p) => `${p.row},${p.col}`));
  const dragged = useRef(false);

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
        const digit = ghost?.digit ?? committed;
        const isBlank =
          ghost !== undefined ? Boolean(ghost.blank) : blanks[idx(row, col)] === true;
        const isLast = lastAt.has(`${row},${col}`);
        const empty = committed === null && ghost === undefined;
        const acceptsDrop = canDrop && (empty || ghost !== undefined);

        return (
          <button
            key={i}
            type="button"
            disabled={!canPlace && ghost === undefined && !canDrop}
            draggable={Boolean(ghost) && canDrop}
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              if (ghost !== undefined) onRemovePending(row, col);
              else if (committed === null) onPlace(row, col);
            }}
            onDragStart={(event) => {
              if (!ghost) return;
              dragged.current = true;
              setTileDrag(event, {
                source: "pending",
                rackIndex: ghost.rackIndex,
                digit: ghost.digit,
                blank: ghost.blank,
                fromRow: row,
                fromCol: col,
              });
            }}
            onDragOver={(event) => {
              if (!acceptsDrop) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              if (!acceptsDrop) return;
              event.preventDefault();
              const payload = readTileDrag(event);
              if (!payload) return;
              onDropTile(row, col, payload);
            }}
            className={`relative flex h-[min(6vw,2.15rem)] w-[min(6vw,2.15rem)] items-center justify-center text-[10px] font-semibold sm:text-xs ${premiumClass[premium]} ${
              ghost !== undefined ? "ring-2 ring-[#1b2420] ring-inset" : ""
            } ${isLast ? "outline outline-2 outline-[#5c7a3a]" : ""}`}
            aria-label={`Row ${row + 1} column ${col + 1}`}
          >
            {digit !== null && digit !== undefined ? (
              <TileFace digit={digit} blank={isBlank} />
            ) : (
              <span className="pointer-events-none opacity-80">
                {premiumLabel[premium]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
