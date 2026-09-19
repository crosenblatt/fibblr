export const TILE_MIME = "application/x-fibblr-tile";

export type RackDrag = {
  source: "rack";
  rackIndex: number;
  digit: number;
  blank?: boolean;
};

export type PendingDrag = {
  source: "pending";
  rackIndex: number;
  digit: number;
  blank?: boolean;
  fromRow: number;
  fromCol: number;
};

export type TileDrag = RackDrag | PendingDrag;

export function setTileDrag(event: React.DragEvent, payload: TileDrag) {
  event.dataTransfer.setData(TILE_MIME, JSON.stringify(payload));
  event.dataTransfer.setData("text/plain", JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "move";
}

export function readTileDrag(event: React.DragEvent): TileDrag | null {
  const raw =
    event.dataTransfer.getData(TILE_MIME) ||
    event.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TileDrag;
    if (
      (parsed.source === "rack" || parsed.source === "pending") &&
      Number.isInteger(parsed.rackIndex) &&
      Number.isInteger(parsed.digit)
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}
