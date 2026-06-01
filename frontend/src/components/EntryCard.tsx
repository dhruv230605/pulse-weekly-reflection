import type { Entry } from "../lib/types";
import { MOOD_EMOJIS } from "../lib/types";

interface Props {
  entry: Entry;
  onDelete?: (id: string) => void;
}

export default function EntryCard({ entry, onDelete }: Props) {
  const time = new Date(entry.timestamp).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{MOOD_EMOJIS[entry.mood]}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">
                Mood: {entry.mood}/5
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-sm font-semibold text-emerald-600">
                Energy: {entry.energy}/10
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{time}</p>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="text-gray-300 hover:text-red-400 transition-colors text-sm cursor-pointer"
            title="Delete entry"
          >
            ✕
          </button>
        )}
      </div>
      {entry.note && (
        <p className="text-sm text-gray-600 mt-3 pl-12">{entry.note}</p>
      )}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pl-12">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
