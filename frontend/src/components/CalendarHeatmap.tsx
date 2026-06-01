import type { HeatmapDay } from "../lib/types";

interface Props {
  data: HeatmapDay[];
}

function moodColor(avg: number | null): string {
  if (avg === null) return "bg-gray-100";
  if (avg >= 4.5) return "bg-emerald-400";
  if (avg >= 3.5) return "bg-green-300";
  if (avg >= 2.5) return "bg-yellow-300";
  if (avg >= 1.5) return "bg-orange-300";
  return "bg-red-300";
}

function moodTooltip(day: HeatmapDay): string {
  const date = new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (day.avg_mood === null) return `${date}: No entries`;
  return `${date}: Mood ${day.avg_mood} (${day.count} entries)`;
}

export default function CalendarHeatmap({ data }: Props) {
  // Group by week (rows) and weekday (columns)
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  if (data.length > 0) {
    // Pad the first week with empty days
    const firstDay = new Date(data[0].date + "T00:00:00").getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: "", avg_mood: null, count: 0 });
    }
  }

  for (const day of data) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Mood Heatmap <span className="text-gray-400 font-normal">(last 90 days)</span>
      </h3>
      <div className="flex gap-4">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] text-[10px] text-gray-400 pt-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="h-[14px] flex items-center">
              {d}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-[14px] h-[14px] rounded-[3px] ${
                    day.date ? moodColor(day.avg_mood) : "bg-transparent"
                  }`}
                  title={day.date ? moodTooltip(day) : ""}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
        <span>Less</span>
        {["bg-red-300", "bg-orange-300", "bg-yellow-300", "bg-green-300", "bg-emerald-400"].map(
          (c) => (
            <div key={c} className={`w-[12px] h-[12px] rounded-[2px] ${c}`} />
          )
        )}
        <span>More</span>
      </div>
    </div>
  );
}
