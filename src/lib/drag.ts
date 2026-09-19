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

let activeDrag: TileDrag | null = null;

export function peekTileDrag(): TileDrag | null {
  return activeDrag;
}

export function clearTileDrag() {
  activeDrag = null;
}

function isTileDrag(value: unknown): value is TileDrag {
  if (!value || typeof value !== "object") return false;
  const parsed = value as TileDrag;
  return (
    (parsed.source === "rack" || parsed.source === "pending") &&
    Number.isInteger(parsed.rackIndex) &&
    Number.isInteger(parsed.digit)
  );
}

export function setTileDrag(event: React.DragEvent, payload: TileDrag) {
  activeDrag = payload;
  const encoded = JSON.stringify(payload);
  event.dataTransfer.setData(TILE_MIME, encoded);
  event.dataTransfer.setData("text/plain", encoded);
  event.dataTransfer.effectAllowed = "move";
}

export function readTileDrag(event: React.DragEvent): TileDrag | null {
  const raw =
    event.dataTransfer.getData(TILE_MIME) ||
    event.dataTransfer.getData("text/plain");
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isTileDrag(parsed)) return parsed;
    } catch {
      // Fall through to the in-memory payload. Some browsers empty dataTransfer.
    }
  }
  return activeDrag;
}
