import { useEffect, useState } from "react";
import EntryCard from "../components/EntryCard";
import { api } from "../lib/api";
import type { Entry } from "../lib/types";

export default function History() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    api.entries
      .list()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await api.entries.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Group entries by date
  const grouped = entries.reduce<Record<string, Entry[]>>((acc, entry) => {
    const date = entry.timestamp.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  // Filter
  const allTags = [...new Set(entries.flatMap((e) => e.tags))].sort();
  const filteredGrouped =
    filter === "all"
      ? grouped
      : Object.fromEntries(
          Object.entries(grouped)
            .map(([date, items]) => [
              date,
              items.filter((e) => e.tags.includes(filter)),
            ])
            .filter(([, items]) => (items as Entry[]).length > 0)
        );

  const sortedDates = Object.keys(filteredGrouped).sort(
    (a, b) => b.localeCompare(a)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading history...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <p className="text-sm text-gray-500 mt-1">
            {entries.length} total entries
          </p>
        </div>
        {/* Tag filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5
                     focus:outline-none focus:ring-2 focus:ring-pulse-400"
        >
          <option value="all">All tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {sortedDates.length === 0 ? (
        <p className="text-gray-400 text-sm">No entries found.</p>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <div className="space-y-2">
                {filteredGrouped[date].map((entry: Entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
