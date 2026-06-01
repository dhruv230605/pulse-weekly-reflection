import { MOOD_EMOJIS, MOOD_LABELS } from "../lib/types";

interface Props {
  value: number;
  onChange: (mood: number) => void;
}

export default function MoodSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        How are you feeling?
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
              value === level
                ? "border-pulse-500 bg-pulse-50 scale-110 shadow-md"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className="text-3xl">{MOOD_EMOJIS[level]}</span>
            <span className="text-xs text-gray-500">{MOOD_LABELS[level]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
