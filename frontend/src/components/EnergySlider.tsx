interface Props {
  value: number;
  onChange: (energy: number) => void;
}

const ENERGY_COLORS: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-red-400",
  3: "bg-orange-400",
  4: "bg-orange-300",
  5: "bg-yellow-400",
  6: "bg-yellow-300",
  7: "bg-lime-400",
  8: "bg-green-400",
  9: "bg-green-500",
  10: "bg-emerald-500",
};

export default function EnergySlider({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Energy level: <span className="font-bold text-lg">{value}</span>
        <span className="text-gray-400">/10</span>
      </label>
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`h-10 flex-1 rounded-md transition-all cursor-pointer ${
              level <= value
                ? `${ENERGY_COLORS[level]} shadow-sm`
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            title={`Energy: ${level}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>Drained</span>
        <span>Supercharged</span>
      </div>
    </div>
  );
}
