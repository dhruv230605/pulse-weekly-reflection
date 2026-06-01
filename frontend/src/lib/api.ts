import type {
  DailyStat,
  Entry,
  EntryCreate,
  HeatmapDay,
  SharedDigest,
  ShareResponse,
  TagsResponse,
  WeeklyDigest,
  WeeklyStat,
} from "./types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  entries: {
    list: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      const qs = params.toString();
      return request<Entry[]>(`/entries${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<Entry>(`/entries/${id}`),
    create: (data: EntryCreate) =>
      request<Entry>("/entries", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/entries/${id}`, { method: "DELETE" }),
  },
  stats: {
    daily: () => request<DailyStat[]>("/stats/daily"),
    weekly: () => request<WeeklyStat[]>("/stats/weekly"),
    heatmap: () => request<HeatmapDay[]>("/stats/heatmap"),
  },
  tags: () => request<TagsResponse>("/tags"),
  digest: {
    weekly: (weekStart?: string) =>
      request<WeeklyDigest>(
        `/digest/weekly${weekStart ? `?week_start=${weekStart}` : ""}`
      ),
    share: (
      weekStart: string,
      opts?: {
        sender_name?: string;
        sender_note?: string;
        include_days?: string[];
        reflection?: { include: boolean; text?: string };
      }
    ) => {
      const params = new URLSearchParams({ week_start: weekStart });
      if (opts?.include_days && opts.include_days.length > 0) {
        params.set("include_days", opts.include_days.join(","));
      }
      const body: Record<string, unknown> = {
        sender_name: opts?.sender_name,
        sender_note: opts?.sender_note,
      };
      if (opts?.reflection?.include && opts.reflection.text) {
        body.include_reflection = true;
        body.reflection_text = opts.reflection.text;
      }
      return request<ShareResponse>(`/digest/weekly/share?${params.toString()}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    shared: (token: string) =>
      request<SharedDigest>(`/digest/shared/${token}`),
    revoke: (token: string) =>
      request<void>(`/digest/share/${token}`, { method: "DELETE" }),
  },
};
