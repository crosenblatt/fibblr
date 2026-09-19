import { readTileDrag, setTileDrag, type TileDrag } from "@/lib/drag";
import { TileFace } from "@/components/TileFace";
import { useLayoutEffect, useRef } from "react";

type Tile = { index: number; digit: number };

type Props = {
  tiles: Tile[];
  selected: Set<number>;
  disabled: boolean;
  draggableTiles?: boolean;
  onToggle: (index: number) => void;
  onDropPending?: (payload: Extract<TileDrag, { source: "pending" }>) => void;
  onReorder?: (fromIndex: number, beforeIndex: number | null) => void;
};

const FLIP_MS = 320;

export function Rack({
  tiles,
  selected,
  disabled,
  draggableTiles = false,
  onToggle,
  onDropPending,
  onReorder,
}: Props) {
  const canDrag = draggableTiles && !disabled;
  const containerRef = useRef<HTMLDivElement>(null);
  const prevRects = useRef(new Map<number, DOMRect>());
  const layoutKey = tiles.map((tile) => tile.index).join(",");

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-rack-tile]")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextRects = new Map<number, DOMRect>();
    const firstLayout = prevRects.current.size === 0;

    for (const node of nodes) {
      const id = Number(node.dataset.rackTile);
      if (Number.isNaN(id)) continue;
      const last = node.getBoundingClientRect();
      nextRects.set(id, last);
      if (firstLayout || reduced) continue;

      const first = prevRects.current.get(id);
      node.getAnimations().forEach((animation) => animation.cancel());
      if (!first) {
        node.animate(
          [
            { transform: "scale(0.86)", opacity: 0.35 },
            { transform: "scale(1)", opacity: 1 },
          ],
          { duration: FLIP_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
        continue;
      }
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      node.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        { duration: FLIP_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }

    prevRects.current = nextRects;
  }, [layoutKey]);

  function acceptDrop(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: React.DragEvent, beforeIndex: number | null) {
    event.preventDefault();
    const parsed = readTileDrag(event);
    if (!parsed) return;
    if (parsed.source === "pending") {
      onDropPending?.(parsed);
      return;
    }
    if (parsed.source === "rack") {
      onReorder?.(parsed.rackIndex, beforeIndex);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-16 flex-wrap justify-center gap-2 rounded-md border border-dashed border-[#3d4a44] px-4 py-3"
      onDragOver={(event) => {
        if (!onDropPending && !onReorder) return;
        acceptDrop(event);
      }}
      onDrop={(event) => handleDrop(event, null)}
    >
      {tiles.map((tile) => (
        <div key={tile.index} data-rack-tile={tile.index}>
          <button
            type="button"
            disabled={disabled}
            draggable={canDrag}
            onClick={() => {
              if (disabled) return;
              onToggle(tile.index);
            }}
            onDragStart={(event) => {
              if (!canDrag) {
                event.preventDefault();
                return;
              }
              setTileDrag(event, {
                source: "rack",
                rackIndex: tile.index,
                digit: tile.digit,
              });
              const ghost = event.currentTarget;
              event.dataTransfer.setDragImage(
                ghost,
                ghost.offsetWidth / 2,
                ghost.offsetHeight / 2,
              );
            }}
            onDragOver={(event) => {
              if (!canDrag && !onDropPending) return;
              event.stopPropagation();
              acceptDrop(event);
            }}
            onDrop={(event) => {
              event.stopPropagation();
              handleDrop(event, tile.index);
            }}
            className={`rounded-sm disabled:opacity-100 ${
              canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"
            } ${selected.has(tile.index) ? "-translate-y-1 ring-2 ring-[#c8b48a]" : ""}`}
          >
            <TileFace digit={tile.digit} size="rack" muted={disabled} />
          </button>
        </div>
      ))}
    </div>
  );
}
