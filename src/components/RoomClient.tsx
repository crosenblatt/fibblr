"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { api } from "../../convex/_generated/api";
import { Board } from "@/components/Board";
import { Rack } from "@/components/Rack";
import { getGuestId, getSavedName, saveName } from "@/lib/guest";
import { idx, isBlankTile, previewPlay, sortRackTiles, type Placement } from "@/lib/game";
import type { TileDrag } from "@/lib/drag";

type Pending = Placement & { rackIndex: number };

function emptySubscribe() {
  return () => {};
}

function useGuestId() {
  return useSyncExternalStore(emptySubscribe, getGuestId, () => null);
}

function useSavedName() {
  return useSyncExternalStore(emptySubscribe, getSavedName, () => "");
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function RoomClient({ code }: { code: string }) {
  const guestId = useGuestId();
  const savedName = useSavedName();
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const displayName = name ?? savedName;

  const joinRoom = useMutation(api.rooms.joinRoom);

  const room = useQuery(
    api.rooms.getRoom,
    guestId ? { code, guestId } : "skip",
  );

  async function onJoin(event: React.FormEvent) {
    event.preventDefault();
    if (!guestId) return;
    setError(null);
    try {
      saveName(displayName);
      await joinRoom({ code, guestId, name: displayName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join.");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (guestId === null || room === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        Loading room…
      </main>
    );
  }

  if (room === null) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center gap-3 px-6">
        <h1 className="text-2xl font-semibold">Room not found</h1>
        <p className="text-[#d7d1c4]">This room expired or the link is wrong.</p>
        <Link className="text-[#c8b48a] underline" href="/">
          Create a new game
        </Link>
      </main>
    );
  }

  if (room.status === "expired") {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center gap-3 px-6">
        <h1 className="text-2xl font-semibold">Room expired</h1>
        <p className="text-[#d7d1c4]">Sessions last 3 hours from creation.</p>
        <Link className="text-[#c8b48a] underline" href="/">
          Create a new game
        </Link>
      </main>
    );
  }

  return (
    <RoomView
      code={code}
      guestId={guestId}
      room={room}
      displayName={displayName}
      setName={setName}
      error={error}
      setError={setError}
      copied={copied}
      onJoin={onJoin}
      copyLink={copyLink}
    />
  );
}

type RoomData = NonNullable<ReturnType<typeof useQuery<typeof api.rooms.getRoom>>>;

function lastMoveText(room: RoomData, guestId: string): string | null {
  const move = room.lastMove;
  if (!move || room.status !== "active") return null;
  const actor = room.players.find((p) => p.guestId === move.guestId);
  const who = move.guestId === guestId ? "You" : (actor?.name ?? "Opponent");
  if (move.kind === "play") {
    const sequence = move.placements.map((p) => p.digit).join("-");
    const next =
      room.turnGuestId === guestId && move.guestId !== guestId
        ? " Your turn."
        : "";
    return `${who} scored ${move.score}${sequence ? ` (${sequence})` : ""}.${next}`;
  }
  if (move.kind === "pass") {
    const next = room.turnGuestId === guestId ? " Your turn." : "";
    return `${who} passed.${next}`;
  }
  const next = room.turnGuestId === guestId ? " Your turn." : "";
  return `${who} swapped tiles.${next}`;
}

function RoomView({
  code,
  guestId,
  room,
  displayName,
  setName,
  error,
  setError,
  copied,
  onJoin,
  copyLink,
}: {
  code: string;
  guestId: string;
  room: RoomData;
  displayName: string;
  setName: (value: string) => void;
  error: string | null;
  setError: (value: string | null) => void;
  copied: boolean;
  onJoin: (event: React.FormEvent) => void;
  copyLink: () => void;
}) {
  const now = useNow();
  const remainingMin = Math.max(0, Math.ceil((room.expiresAt - now) / 60000));
  const you = room.you ?? null;
  const isPlayer = Boolean(you);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-[#c8b48a]">
            Fibblr
          </Link>
          <h1 className="text-2xl font-semibold">Room</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#d7d1c4]">
          <span>Expires in {remainingMin} min</span>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-md border border-[#3d4a44] px-3 py-1.5 hover:bg-[#121916]"
          >
            {copied ? "Copied" : "Copy invite link"}
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {room.players.map((player) => (
          <div
            key={player.guestId}
            className={`rounded-md border px-3 py-2 ${
              player.guestId === room.turnGuestId
                ? "border-[#c8b48a]"
                : "border-[#3d4a44]"
            }`}
          >
            <p className="font-medium">
              {player.name}
              {player.isYou ? " (you)" : ""}
            </p>
            <p className="text-sm text-[#d7d1c4]">
              Score {player.score} · {player.rackCount} tiles
              {room.lastMove?.guestId === player.guestId && room.lastMove.kind === "play"
                ? ` · +${room.lastMove.score}`
                : ""}
            </p>
          </div>
        ))}
        {room.players.length < 2 ? (
          <div className="rounded-md border border-dashed border-[#3d4a44] px-3 py-2 text-sm text-[#d7d1c4]">
            Waiting for opponent…
          </div>
        ) : null}
      </section>

      {room.status === "lobby" && !isPlayer ? (
        <form onSubmit={onJoin} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={displayName}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={24}
            className="flex-1 rounded-md border border-[#3d4a44] bg-[#121916] px-3 py-2"
            placeholder="Your name"
          />
          <button
            type="submit"
            className="rounded-md bg-[#c8b48a] px-4 py-2 font-medium text-[#1b2420]"
          >
            Join game
          </button>
        </form>
      ) : null}

      {room.status === "lobby" && isPlayer ? (
        <p className="text-sm text-[#d7d1c4]">
          Share the invite link. The game starts when a second player joins.
        </p>
      ) : null}

      {room.status === "finished" ? (
        <p className="rounded-md bg-[#121916] px-3 py-2">
          Game over.{" "}
          {room.winnerGuestId
            ? `${room.players.find((p) => p.guestId === room.winnerGuestId)?.name ?? "A player"} wins.`
            : "It's a draw."}
        </p>
      ) : null}

      {room.status === "active" ? (
        <p className="text-sm text-[#d7d1c4]">
          {room.turnGuestId === guestId
            ? "Your turn. Sequences of 3+ must be Fibonacci mod 10. Two tiles are legal if they differ by 0 or 1. Enter submits. Blanks are wild and score 0."
            : `Waiting for ${room.players.find((p) => p.guestId === room.turnGuestId)?.name ?? "opponent"}.`}{" "}
          Bag: {room.bagCount} tiles.
        </p>
      ) : null}

      {room.lastMove && room.status === "active" ? (
        <p
          key={`${room.lastMove.guestId}-${room.lastMove.kind}-${room.lastMove.score}-${room.turnGuestId}`}
          className="turn-banner rounded-md border border-[#c8b48a] bg-[#121916] px-3 py-2 text-sm"
        >
          {lastMoveText(room, guestId)}
        </p>
      ) : null}

      <PlayArea
        key={`${room.turnGuestId}-${room.lastMove?.kind ?? "none"}-${room.lastMove?.score ?? 0}`}
        code={code}
        guestId={guestId}
        room={room}
        error={error}
        setError={setError}
      />
    </main>
  );
}

function PlayArea({
  code,
  guestId,
  room,
  error,
  setError,
}: {
  code: string;
  guestId: string;
  room: RoomData;
  error: string | null;
  setError: (value: string | null) => void;
}) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [selectedRack, setSelectedRack] = useState<number | null>(null);
  const [swapSelected, setSwapSelected] = useState<Set<number>>(new Set());
  const [swapMode, setSwapMode] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [assignBlank, setAssignBlank] = useState<{
    row: number;
    col: number;
    rackIndex: number;
  } | null>(null);
  const submitMove = useMutation(api.rooms.submitMove);
  const pass = useMutation(api.rooms.pass);
  const swapTiles = useMutation(api.rooms.swapTiles);

  const you = room.you ?? null;
  const isPlayer = Boolean(you);
  const yourTurn = room.status === "active" && room.turnGuestId === guestId;
  const usedRack = new Set(pending.map((p) => p.rackIndex));
  const rackTiles = useMemo(() => {
    const tiles =
      you?.rack
        .map((digit, index) => ({ index, digit }))
        .filter((tile) => !usedRack.has(tile.index)) ?? [];
    return sorted ? sortRackTiles(tiles) : tiles;
  }, [you?.rack, usedRack, sorted]);

  const preview = useMemo(() => {
    if (pending.length === 0) return null;
    return previewPlay(
      room.board,
      pending.map(({ row, col, digit, blank }) => ({ row, col, digit, blank })),
      room.blanks,
    );
  }, [room.board, room.blanks, pending]);

  function toggleRack(index: number) {
    if (swapMode) {
      setSwapSelected((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
      return;
    }
    setSelectedRack((current) => (current === index ? null : index));
  }

  function placeTile(row: number, col: number, rackIndex: number, assigned?: number) {
    if (!yourTurn || swapMode || !you) return;
    if (room.board[idx(row, col)] !== null) return;
    const rackDigit = you.rack[rackIndex];
    if (rackDigit === undefined) return;
    if (pending.some((p) => p.rackIndex === rackIndex || (p.row === row && p.col === col))) {
      return;
    }
    if (isBlankTile(rackDigit) && assigned === undefined) {
      setAssignBlank({ row, col, rackIndex });
      setSelectedRack(null);
      return;
    }
    const digit = assigned ?? rackDigit;
    setPending((current) => [
      ...current,
      { row, col, digit, rackIndex, blank: isBlankTile(rackDigit) },
    ]);
    setSelectedRack(null);
    setAssignBlank(null);
    setError(null);
  }

  function placeOnBoard(row: number, col: number) {
    if (selectedRack === null) return;
    placeTile(row, col, selectedRack);
  }

  function dropOnBoard(row: number, col: number, payload: TileDrag) {
    if (!yourTurn || swapMode || !you) return;
    if (room.board[idx(row, col)] !== null) return;
    if (payload.source === "pending") {
      if (payload.fromRow === row && payload.fromCol === col) return;
      setPending((current) =>
        current.map((p) => {
          if (p.row === payload.fromRow && p.col === payload.fromCol) {
            return { ...p, row, col };
          }
          if (p.row === row && p.col === col) {
            return { ...p, row: payload.fromRow, col: payload.fromCol };
          }
          return p;
        }),
      );
      setError(null);
      return;
    }
    if (isBlankTile(payload.digit) && !payload.blank) {
      setAssignBlank({ row, col, rackIndex: payload.rackIndex });
      setPending((current) =>
        current.filter(
          (p) => p.rackIndex !== payload.rackIndex && !(p.row === row && p.col === col),
        ),
      );
      setSelectedRack(null);
      setError(null);
      return;
    }
    setPending((current) => {
      const next = current.filter(
        (p) => p.rackIndex !== payload.rackIndex && !(p.row === row && p.col === col),
      );
      return [
        ...next,
        {
          row,
          col,
          digit: payload.digit,
          rackIndex: payload.rackIndex,
          blank: payload.blank,
        },
      ];
    });
    setSelectedRack(null);
    setError(null);
  }

  function removePending(row: number, col: number) {
    setPending((current) => current.filter((p) => !(p.row === row && p.col === col)));
  }

  function undoPlacements() {
    setPending([]);
    setAssignBlank(null);
    setSelectedRack(null);
    setError(null);
  }

  function canSubmit() {
    return (
      yourTurn &&
      !swapMode &&
      !assignBlank &&
      pending.length > 0 &&
      preview !== null &&
      preview.ok
    );
  }

  async function onSubmit() {
    if (!canSubmit()) return;
    setError(null);
    try {
      await submitMove({
        code,
        guestId,
        placements: pending.map(({ row, col, digit, blank }) => ({
          row,
          col,
          digit,
          blank,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move rejected.");
    }
  }

  async function onPass() {
    setError(null);
    try {
      await pass({ code, guestId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pass.");
    }
  }

  async function onSwap() {
    if (!you) return;
    const digits = [...swapSelected].map((i) => you.rack[i]!);
    setError(null);
    try {
      await swapTiles({ code, guestId, digits });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not swap.");
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (!canSubmit()) return;
      event.preventDefault();
      void onSubmit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div className="flex justify-center overflow-x-auto">
        <Board
          board={room.board}
          blanks={room.blanks ?? []}
          pending={pending}
          lastPlacements={room.lastMove?.placements ?? []}
          canPlace={yourTurn && !swapMode && selectedRack !== null}
          canDrop={yourTurn && !swapMode}
          onPlace={placeOnBoard}
          onDropTile={dropOnBoard}
          onRemovePending={removePending}
        />
      </div>

      {isPlayer && room.status === "active" ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Rack
              tiles={rackTiles}
              selected={swapMode ? swapSelected : selectedRack !== null ? new Set([selectedRack]) : new Set()}
              disabled={!yourTurn}
              draggableTiles={yourTurn && !swapMode}
              onToggle={toggleRack}
              onDropPending={(payload) => removePending(payload.fromRow, payload.fromCol)}
            />
            <button
              type="button"
              disabled={!yourTurn || rackTiles.length < 2}
              onClick={() => setSorted((value) => !value)}
              className="rounded-md border border-[#3d4a44] px-3 py-2 text-sm disabled:opacity-40"
            >
              {sorted ? "Unsort" : "Sort rack"}
            </button>
          </div>
          {pending.length > 0 ? (
            <div className="flex w-full max-w-md flex-col items-center gap-1">
              <p className="rounded-md bg-[#121916] px-3 py-2 text-base font-medium text-[#c8b48a]">
                Current score: {preview?.ok ? preview.score : "—"}
              </p>
              {preview && !preview.ok ? (
                <p className="text-sm text-red-300">{preview.error}</p>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={!canSubmit()}
              onClick={onSubmit}
              className="rounded-md bg-[#c8b48a] px-4 py-2 font-medium text-[#1b2420] disabled:opacity-40"
            >
              Submit
              {preview?.ok ? ` +${preview.score}` : ""}
              <span className="ml-2 text-xs font-normal opacity-70">Enter</span>
            </button>
            <button
              type="button"
              disabled={!yourTurn || (pending.length === 0 && !assignBlank)}
              onClick={undoPlacements}
              className="rounded-md border border-[#3d4a44] px-4 py-2 disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              disabled={!yourTurn || pending.length > 0}
              onClick={onPass}
              className="rounded-md border border-[#3d4a44] px-4 py-2 disabled:opacity-40"
            >
              Pass
            </button>
            <button
              type="button"
              disabled={!yourTurn || pending.length > 0 || room.bagCount === 0}
              onClick={() => {
                setSwapMode((m) => !m);
                setSwapSelected(new Set());
                setSelectedRack(null);
              }}
              className="rounded-md border border-[#3d4a44] px-4 py-2 disabled:opacity-40"
            >
              {swapMode ? "Cancel swap" : "Swap"}
            </button>
            {swapMode ? (
              <button
                type="button"
                disabled={swapSelected.size === 0}
                onClick={onSwap}
                className="rounded-md bg-[#c8b48a] px-4 py-2 font-medium text-[#1b2420] disabled:opacity-40"
              >
                Confirm swap ({swapSelected.size})
              </button>
            ) : null}
          </div>
        </div>
      ) : isPlayer ? (
        <Rack
          tiles={(you?.rack ?? []).map((digit, index) => ({ index, digit }))}
          selected={new Set()}
          disabled
          onToggle={() => {}}
        />
      ) : room.status === "active" ? (
        <p className="text-center text-sm text-[#d7d1c4]">This room is full.</p>
      ) : null}

      {assignBlank ? (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xs rounded-md border border-[#3d4a44] bg-[#1b2420] p-4">
            <p className="mb-3 text-sm text-[#d7d1c4]">Choose a digit for this blank.</p>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => placeTile(assignBlank.row, assignBlank.col, assignBlank.rackIndex, digit)}
                  className="rounded-md bg-[#f7edd2] py-2 font-semibold text-[#2a2418]"
                >
                  {digit}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAssignBlank(null)}
              className="mt-3 w-full rounded-md border border-[#3d4a44] px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-center text-sm text-red-300">{error}</p> : null}
    </>
  );
}
