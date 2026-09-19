import { readTileDrag, setTileDrag, type TileDrag } from "@/lib/drag";
import { TileFace } from "@/components/TileFace";
import { isBlankTile } from "@/lib/game";

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

export function Rack({
  tiles,
  selected,
  disabled,
  draggableTiles = false,
  onToggle,
  onDropPending,
  onReorder,
}: Props) {
  const canDrag = draggableTiles;

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
      className="flex min-h-16 flex-wrap justify-center gap-2 rounded-md border border-dashed border-[#3d4a44] px-4 py-3"
      onDragOver={(event) => {
        if (!onDropPending && !onReorder) return;
        acceptDrop(event);
      }}
      onDrop={(event) => handleDrop(event, null)}
    >
      {tiles.map((tile) => (
        <button
          key={tile.index}
          type="button"
          disabled={disabled && !canDrag}
          draggable={canDrag}
          onClick={() => {
            if (disabled) return;
            onToggle(tile.index);
          }}
          onDragStart={(event) => {
            if (!canDrag) return;
            setTileDrag(event, {
              source: "rack",
              rackIndex: tile.index,
              digit: tile.digit,
              blank: isBlankTile(tile.digit) || undefined,
            });
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
          className={`cursor-grab rounded-sm active:cursor-grabbing ${
            selected.has(tile.index) ? "-translate-y-1 ring-2 ring-[#c8b48a]" : ""
          }`}
        >
          <TileFace digit={tile.digit} size="rack" />
        </button>
      ))}
    </div>
  );
}
