import { readTileDrag, setTileDrag, type TileDrag } from "@/lib/drag";
import { TileFace } from "@/components/TileFace";

type Tile = { index: number; digit: number };

type Props = {
  tiles: Tile[];
  selected: Set<number>;
  disabled: boolean;
  draggableTiles?: boolean;
  onToggle: (index: number) => void;
  onDropPending?: (payload: Extract<TileDrag, { source: "pending" }>) => void;
};

export function Rack({
  tiles,
  selected,
  disabled,
  draggableTiles = false,
  onToggle,
  onDropPending,
}: Props) {
  return (
    <div
      className="flex min-h-16 flex-wrap justify-center gap-2 rounded-md border border-dashed border-[#3d4a44] px-4 py-3"
      onDragOver={(event) => {
        if (!onDropPending) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        if (!onDropPending) return;
        event.preventDefault();
        const parsed = readTileDrag(event);
        if (parsed?.source === "pending") onDropPending(parsed);
      }}
    >
      {tiles.map((tile) => (
        <button
          key={tile.index}
          type="button"
          disabled={disabled}
          draggable={draggableTiles && !disabled}
          onClick={() => onToggle(tile.index)}
          onDragStart={(event) => {
            if (!draggableTiles || disabled) return;
            setTileDrag(event, {
              source: "rack",
              rackIndex: tile.index,
              digit: tile.digit,
            });
          }}
          className={`cursor-grab rounded-sm active:cursor-grabbing ${
            selected.has(tile.index) ? "-translate-y-1 ring-2 ring-[#c8b48a]" : ""
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <TileFace digit={tile.digit} size="rack" />
        </button>
      ))}
    </div>
  );
}
