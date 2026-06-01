import { useEffect, useState } from "react";
import {
  loadReflectionAnswer,
  saveReflectionAnswer,
  REFLECTION_MAX_LEN,
} from "../lib/reflectionAnswer";
import type {
  DayBreakdownItem,
  WeekQuality,
  WeeklyDigest,
} from "../lib/types";
import { MOOD_EMOJIS, MOOD_LABELS } from "../lib/types";

interface Props {
  digest: WeeklyDigest;
  /** Recipient-facing view: shows the prompt statically, no input. */
  publicView?: boolean;
}

const QUALITY_STYLES: Record<
  WeekQuality,
  { ring: string; chip: string; label: string; icon: string }
> = {
  great: {
    ring: "ring-emerald-200 bg-emerald-50/40",
    chip: "bg-emerald-100 text-emerald-700",
    label: "A bright week",
    icon: "🌟",
  },
  mixed: {
    ring: "ring-pulse-200 bg-pulse-50/40",
    chip: "bg-pulse-100 text-pulse-700",
    label: "A mixed week",
    icon: "⛅",
  },
  rough: {
    ring: "ring-amber-200 bg-amber-50/40",
    chip: "bg-amber-100 text-amber-800",
    label: "A heavier week",
    icon: "🌧️",
  },
};

const TREND_LABEL: Record<string, string> = {
  improving: "↗ Improving",
  flat: "→ Steady",
  declining: "↘ Gentler",
};

function formatRange(start: string, end: string): string {
  const fmt = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function DigestCard({ digest, publicView = false }: Props) {
  const q = QUALITY_STYLES[digest.week_quality];
  const isEmpty = digest.bucket === "empty";
  const isSparse = digest.bucket === "sparse";

  return (
    <article
      className={`rounded-2xl ring-1 ${q.ring} p-6 md:p-8 shadow-sm`}
      data-testid="digest-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Weekly Reflection
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">
            {formatRange(digest.week_start, digest.week_end)}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {digest.streak ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
              <span aria-hidden>🔥</span>
              <span>{digest.streak}-day streak</span>
            </span>
          ) : null}
          <span
            className={`inline-flex items-center gap-1.5 ${q.chip} text-xs font-semibold px-3 py-1 rounded-full`}
          >
            <span aria-hidden>{q.icon}</span>
            <span>{q.label}</span>
          </span>
        </div>
      </div>

      {/* Week-over-week momentum */}
      {digest.week_over_week && (
        <p
          className={`mt-3 text-sm font-medium ${
            digest.week_over_week.direction === "up"
              ? "text-emerald-600"
              : digest.week_over_week.direction === "down"
                ? "text-slate-500"
                : "text-gray-500"
          }`}
        >
          {digest.week_over_week.phrase}
        </p>
      )}

      {/* Narrative */}
      <p className="mt-4 text-gray-800 text-base leading-relaxed">
        {digest.narrative}
      </p>

      {/* Stats */}
      {!isEmpty && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Stat label="Avg Mood">
            {digest.stats.avg_mood !== null ? (
              <>
                <span className="mr-1">
                  {MOOD_EMOJIS[Math.round(digest.stats.avg_mood)]}
                </span>
                {digest.stats.avg_mood.toFixed(1)}
              </>
            ) : (
              "—"
            )}
          </Stat>
          <Stat label="Avg Energy" accent="text-emerald-600">
            {digest.stats.avg_energy !== null ? (
              <>
                {digest.stats.avg_energy.toFixed(1)}
                <span className="text-sm font-normal text-gray-400">/10</span>
              </>
            ) : (
              "—"
            )}
          </Stat>
          <Stat label="Trend">
            {digest.stats.mood_trend
              ? TREND_LABEL[digest.stats.mood_trend]
              : "—"}
          </Stat>
          <Stat label="Entries">{digest.entry_count}</Stat>
        </div>
      )}

      {/* Best / worst day (worst suppressed on rough weeks, per sensitivity rules) */}
      {(digest.best_day || digest.worst_day) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {digest.best_day && (
            <DayHighlightCard
              kind="best"
              signal={digest.highlight_signal}
              weekday={digest.best_day.weekday}
              avgMood={digest.best_day.avg_mood}
              avgEnergy={digest.best_day.avg_energy}
            />
          )}
          {digest.worst_day && digest.week_quality !== "rough" && (
            <DayHighlightCard
              kind="lowest"
              signal={digest.highlight_signal}
              weekday={digest.worst_day.weekday}
              avgMood={digest.worst_day.avg_mood}
              avgEnergy={digest.worst_day.avg_energy}
            />
          )}
        </div>
      )}

      {/* Top tags */}
      {digest.top_tags.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Top tags
          </p>
          <div className="flex flex-wrap gap-2">
            {digest.top_tags.map((t) => (
              <span
                key={t.tag}
                className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                <span>#{t.tag}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Day by day */}
      {digest.day_breakdown.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {isSparse ? "What you logged" : "Day by day"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {digest.day_breakdown
              .filter((d) => (isSparse ? d.entry_count > 0 : true))
              .map((d) => (
                <DayRow key={d.date} day={d} />
              ))}
          </div>
        </div>
      )}

      {/* Reflection prompt */}
      <div className="mt-6 bg-white/70 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Reflect
        </p>
        {publicView ? (
          <p className="text-gray-800 mt-1 italic">
            “{digest.reflection_prompt}”
          </p>
        ) : (
          <ReflectionAnswerInput
            weekStart={digest.week_start}
            prompt={digest.reflection_prompt}
          />
        )}
      </div>
    </article>
  );
}

function ReflectionAnswerInput({
  weekStart,
  prompt,
}: {
  weekStart: string;
  prompt: string;
}) {
  const [text, setText] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadReflectionAnswer(weekStart);
    setText(existing?.text ?? "");
    setSavedAt(existing?.savedAt ?? null);
  }, [weekStart]);

  const save = () => {
    const rec = saveReflectionAnswer(weekStart, text);
    setSavedAt(rec.savedAt);
  };

  return (
    <div className="mt-1">
      <p className="text-gray-800 italic">“{prompt}”</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={REFLECTION_MAX_LEN}
        rows={3}
        placeholder="Write a few words for yourself…"
        className="mt-2 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pulse-300"
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-gray-400">
          {savedAt
            ? `Saved ${new Date(savedAt).toLocaleString()} · stays on this device`
            : "Stays on this device — never shared unless you choose to."}
        </span>
        <button
          onClick={save}
          className="text-sm font-medium bg-pulse-600 text-white px-3 py-1.5 rounded-md hover:bg-pulse-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-white/80 border border-gray-200 rounded-xl p-3 text-center">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-lg font-semibold mt-1 ${accent ?? "text-gray-800"}`}>
        {children}
      </p>
    </div>
  );
}

function DayHighlightCard({
  kind,
  signal,
  weekday,
  avgMood,
  avgEnergy,
}: {
  kind: "best" | "lowest";
  signal: "mood" | "energy";
  weekday: string;
  avgMood: number;
  avgEnergy: number;
}) {
  const label =
    kind === "best"
      ? signal === "energy"
        ? "Most energized day"
        : "Best day"
      : signal === "energy"
        ? "Lowest energy day"
        : "Quietest day";
  const icon = kind === "best" ? "✨" : "🌙";
  const primary =
    signal === "energy"
      ? `Energy ${avgEnergy}/10 · Mood ${avgMood}`
      : `Mood ${avgMood} · Energy ${avgEnergy}/10`;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <span aria-hidden>{icon}</span>
        <span>{label}</span>
      </p>
      <p className="text-base font-semibold text-gray-900 mt-1">{weekday}</p>
      <p className="text-xs text-gray-500 mt-0.5">{primary}</p>
    </div>
  );
}

const DAY_TONE: Record<number, string> = {
  0: "border-gray-100 bg-gray-50/50",
  1: "border-amber-200 bg-amber-50/50",
  2: "border-amber-100 bg-amber-50/30",
  3: "border-gray-200 bg-white",
  4: "border-pulse-200 bg-pulse-50/40",
  5: "border-emerald-200 bg-emerald-50/50",
};

function DayRow({ day }: { day: DayBreakdownItem }) {
  const hasData = day.avg_mood !== null;
  const band = hasData ? Math.max(1, Math.min(5, Math.round(day.avg_mood!))) : 0;
  const moodLabel = hasData ? MOOD_LABELS[band] : "No entry";

  return (
    <div
      className={`flex items-start gap-3 border rounded-xl px-3 py-2.5 ${DAY_TONE[band]}`}
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg"
        aria-hidden
      >
        {hasData ? MOOD_EMOJIS[band] : "·"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800">{day.weekday}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-400">
            {moodLabel}
            {hasData && day.avg_energy !== null && (
              <span className="ml-1 text-gray-400">· E {day.avg_energy}</span>
            )}
          </p>
        </div>
        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{day.comment}</p>
      </div>
    </div>
  );
}
