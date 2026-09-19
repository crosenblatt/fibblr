type Tile = { index: number; digit: number };

type Props = {
  tiles: Tile[];
  selected: Set<number>;
  disabled: boolean;
  onToggle: (index: number) => void;
};

export function Rack({ tiles, selected, disabled, onToggle }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {tiles.map((tile) => (
        <button
          key={tile.index}
          type="button"
          disabled={disabled}
          onClick={() => onToggle(tile.index)}
          className={`flex h-12 w-10 items-center justify-center rounded-sm bg-[#f7edd2] text-lg font-semibold text-[#2a2418] shadow ${
            selected.has(tile.index) ? "-translate-y-1 ring-2 ring-[#c8b48a]" : ""
          } disabled:opacity-40`}
        >
          {tile.digit}
        </button>
      ))}
    </div>
  );
}
