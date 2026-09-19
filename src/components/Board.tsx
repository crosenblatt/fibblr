import { BOARD_SIZE, idx, premiumAt } from "@/lib/game";
import { clearTileDrag, peekTileDrag, readTileDrag, setTileDrag, type TileDrag } from "@/lib/drag";
import { TileFace } from "@/components/TileFace";
import { useEffect, useRef, useState } from "react";

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
  tl: "bg-[var(--tl)]",
  dw: "bg-[var(--dw)]",
  tw: "bg-[var(--tw)]",
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
  const [dropAt, setDropAt] = useState<string | null>(null);

  useEffect(() => {
    function onEnd() {
      setDropAt(null);
      window.setTimeout(() => clearTileDrag(), 50);
    }
    window.addEventListener("dragend", onEnd);
    return () => window.removeEventListener("dragend", onEnd);
  }, []);

  return (
    <div
      className="inline-grid gap-px rounded-md bg-[#7a6240] p-1"
      style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
      onDragOver={(event) => {
        if (!canDrop || !peekTileDrag()) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
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
        const spent = committed !== null;
        const visualPremium = spent ? "none" : premium;
        const isLast = lastAt.has(`${row},${col}`);
        const empty = committed === null && ghost === undefined;
        const acceptsDrop = canDrop && (empty || ghost !== undefined);
        const cellKey = `${row},${col}`;
        const isDropTarget = acceptsDrop && dropAt === cellKey;

        return (
          <div
            key={i}
            role="gridcell"
            draggable={Boolean(ghost) && canDrop}
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              if (ghost !== undefined) onRemovePending(row, col);
              else if (committed === null && canPlace) onPlace(row, col);
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
            onDragEnter={(event) => {
              if (!acceptsDrop) return;
              event.preventDefault();
              setDropAt(cellKey);
            }}
            onDragOver={(event) => {
              if (!acceptsDrop) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dropAt !== cellKey) setDropAt(cellKey);
            }}
            onDragLeave={(event) => {
              const next = event.relatedTarget as Node | null;
              if (next && event.currentTarget.contains(next)) return;
              setDropAt((current) => (current === cellKey ? null : current));
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDropAt(null);
              if (!acceptsDrop) return;
              const payload = readTileDrag(event);
              clearTileDrag();
              if (!payload) return;
              onDropTile(row, col, payload);
            }}
            className={`relative flex h-[min(6vw,2.15rem)] w-[min(6vw,2.15rem)] cursor-pointer items-center justify-center text-[10px] font-semibold sm:text-xs ${premiumClass[visualPremium]} ${
              ghost !== undefined ? "ring-2 ring-[#1b2420] ring-inset" : ""
            } ${isDropTarget ? "drop-target-cell" : ""}`}
            aria-label={`Row ${row + 1} column ${col + 1}${isLast ? ", last play" : ""}`}
          >
            {digit !== null && digit !== undefined ? (
              <TileFace digit={digit} blank={isBlank} lastPlay={isLast && ghost === undefined} />
            ) : (
              <span className="pointer-events-none opacity-80">
                {premiumLabel[premium]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
