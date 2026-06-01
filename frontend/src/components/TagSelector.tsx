interface Props {
  available: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
}

const TAG_ICONS: Record<string, string> = {
  sleep: "😴",
  exercise: "🏃",
  caffeine: "☕",
  meetings: "🗓️",
  commute: "🚌",
  social: "👥",
  outdoors: "🌳",
  "deep-work": "🎯",
  lunch: "🍽️",
  stress: "😰",
};

export default function TagSelector({ available, selected, onChange }: Props) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        What's influencing you? <span className="text-gray-400">(tap to toggle)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {available.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              selected.includes(tag)
                ? "bg-pulse-100 text-pulse-700 border-2 border-pulse-400"
                : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
            }`}
          >
            {TAG_ICONS[tag] && <span className="mr-1">{TAG_ICONS[tag]}</span>}
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
