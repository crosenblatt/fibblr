import { BLANK, isBlankTile } from "@/lib/game";

type Props = {
  digit: number;
  blank?: boolean;
  size?: "rack" | "board";
  lastPlay?: boolean;
};

export function TileFace({ digit, blank, size = "board", lastPlay = false }: Props) {
  const isBlank = blank || isBlankTile(digit);
  const label = isBlankTile(digit) ? "" : String(digit);
  const rack = size === "rack";
  return (
    <span
      className={`pointer-events-none relative z-[1] flex items-center justify-center rounded-[3px] bg-[#f7edd2] font-semibold text-[#2a2418] shadow-sm ${
        rack ? "h-12 w-10 text-lg" : "h-[85%] w-[85%] text-[10px] sm:text-xs"
      } ${isBlank ? "ring-1 ring-inset ring-[#8a7a55]" : ""} ${
        lastPlay ? "last-play-tile" : ""
      }`}
    >
      {label}
      {isBlank ? (
        <span
          className={`absolute ${rack ? "bottom-0.5 text-[8px] tracking-wide" : "bottom-px text-[6px]"} font-medium uppercase text-[#8a7a55]`}
        >
          blank
        </span>
      ) : null}
    </span>
  );
}
