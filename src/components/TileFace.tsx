import { BLANK, isBlankTile } from "@/lib/game";

type Props = {
  digit: number;
  blank?: boolean;
  size?: "rack" | "board";
  lastPlay?: boolean;
  muted?: boolean;
};

export function TileFace({
  digit,
  blank,
  size = "board",
  lastPlay = false,
  muted = false,
}: Props) {
  const isBlank = blank || isBlankTile(digit);
  const label = isBlankTile(digit) ? "" : String(digit);
  const rack = size === "rack";
  return (
    <span
      className={`pointer-events-none relative z-[1] flex items-center justify-center rounded-[3px] font-semibold shadow-sm ${
        muted
          ? "bg-[#8d877c] text-[#2f2c28] grayscale shadow-sm"
          : "bg-[#fffaf0] text-[#1a1612] shadow-[0_0_0_1px_rgba(63,52,36,0.4),0_1px_0_#efe4cc,0_2px_4px_rgba(40,28,8,0.4)]"
      } ${rack ? "h-12 w-10 text-lg" : "h-[85%] w-[85%] text-[10px] sm:text-xs"} ${
        isBlank ? "ring-1 ring-inset ring-[#8a7a55]" : ""
      } ${lastPlay ? "last-play-tile" : ""}`}
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
