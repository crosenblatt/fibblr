"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getGuestId, getSavedName, saveName } from "@/lib/guest";

function useSavedName() {
  return useSyncExternalStore(
    () => () => {},
    getSavedName,
    () => "",
  );
}

export default function HomePage() {
  return <HomeClient />;
}

function HomeClient() {
  const router = useRouter();
  const createRoom = useMutation(api.rooms.createRoom);
  const savedName = useSavedName();
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const displayName = name ?? savedName;

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      saveName(displayName);
      const { code } = await createRoom({ guestId: getGuestId(), name: displayName });
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a room.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm tracking-[0.2em] text-[#c8b48a] uppercase">
          Number tiles, Fibonacci words
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">Fibblr</h1>
        <p className="text-base leading-7 text-[#d7d1c4]">
          Play on a 15×15 Scrabble board with digits 0–9. A legal word is a
          Fibonacci sequence of 3 or more tiles, wrapping with modulo 10. A
          two-tile play is legal if the digits differ by exactly 1 (9 and 0
          wrap). Two blank
          tiles are wild (pick a digit when you play them; they score that
          digit). Create a room and send the link to a friend.
        </p>
      </div>
      <form onSubmit={onCreate} className="flex flex-col gap-3">
        <label className="text-sm text-[#c8b48a]" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          value={displayName}
          onChange={(event) => setName(event.target.value)}
          maxLength={24}
          required
          className="rounded-md border border-[#3d4a44] bg-[#121916] px-3 py-2 text-[#f4efe4] outline-none focus:border-[#c8b48a]"
          placeholder="Ada"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-[#c8b48a] px-4 py-2.5 font-medium text-[#1b2420] hover:bg-[#dcc59a] disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create room"}
        </button>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </form>
    </main>
  );
}
