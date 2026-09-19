type HistoryEntry = {
  guestId: string;
  name: string;
  kind: "play" | "pass" | "swap";
  placements: { digit: number }[];
  score: number;
  at: number;
};

function lineFor(entry: HistoryEntry): string {
  if (entry.kind === "pass") return "passed";
  if (entry.kind === "swap") return "swapped tiles";
  const sequence = entry.placements.map((p) => p.digit).join("-");
  return sequence ? `scored ${entry.score} (${sequence})` : `scored ${entry.score}`;
}

export function ScoreHistory({
  history,
  guestId,
}: {
  history: HistoryEntry[];
  guestId: string;
}) {
  return (
    <section className="flex max-h-64 min-h-40 flex-col rounded-md border border-[#3d4a44] bg-[#121916]">
      <h2 className="border-b border-[#3d4a44] px-3 py-2 text-sm font-medium text-[#c8b48a]">
        Scoring history
      </h2>
      <ol className="flex-1 overflow-y-auto px-3 py-2 text-sm">
        {history.length === 0 ? (
          <li className="text-[#d7d1c4]">No plays yet.</li>
        ) : (
          history.map((entry, i) => (
            <li key={`${entry.at}-${entry.guestId}-${i}`} className="py-0.5">
              <span className="text-[#c8b48a]">
                {entry.guestId === guestId ? "You" : entry.name}
              </span>
              {` ${lineFor(entry)}`}
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
