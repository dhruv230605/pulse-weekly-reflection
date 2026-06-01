import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyStat } from "../lib/types";

interface Props {
  data: DailyStat[];
  title: string;
}

export default function TimelineChart({ data, title }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            width={30}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          />
          <Line
            type="monotone"
            dataKey="avg_mood"
            stroke="#0b7deb"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Mood (1-5)"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="avg_energy"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Energy (1-10)"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
