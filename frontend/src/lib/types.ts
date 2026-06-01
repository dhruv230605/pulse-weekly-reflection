export interface Entry {
  id: string;
  mood: number;
  energy: number;
  note: string | null;
  tags: string[];
  timestamp: string;
}

export interface EntryCreate {
  mood: number;
  energy: number;
  note?: string;
  tags: string[];
}

export interface DailyStat {
  date: string;
  avg_mood: number | null;
  avg_energy: number | null;
  count: number;
}

export interface WeeklyStat {
  week_start: string;
  avg_mood: number | null;
  avg_energy: number | null;
  count: number;
}

export interface HeatmapDay {
  date: string;
  avg_mood: number | null;
  count: number;
}

export interface TagsResponse {
  predefined: string[];
  custom: string[];
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: "😢",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export const MOOD_LABELS: Record<number, string> = {
  1: "Awful",
  2: "Bad",
  3: "Okay",
  4: "Good",
  5: "Great",
};

// ---------------------------------------------------------------------------
// Weekly Reflection digest
// ---------------------------------------------------------------------------

export type WeekQuality = "great" | "mixed" | "rough";
export type DigestBucket = "empty" | "sparse" | "partial" | "full";
export type MoodTrend = "improving" | "flat" | "declining" | null;

export interface TagCount {
  tag: string;
  count: number;
}

export interface DayBreakdownItem {
  date: string;
  weekday: string;
  avg_mood: number | null;
  avg_energy: number | null;
  entry_count: number;
  top_tags: TagCount[];
  comment: string;
}

export interface DayHighlight {
  date: string;
  weekday: string;
  avg_mood: number;
  avg_energy: number;
}

export interface WeekOverWeek {
  direction: "up" | "down" | "flat";
  delta_pct: number;
  phrase: string;
  this_avg: number;
  last_avg: number;
}

export interface WeeklyDigest {
  week_start: string;
  week_end: string;
  entry_count: number;
  bucket: DigestBucket;
  week_quality: WeekQuality;
  stats: {
    avg_mood: number | null;
    avg_energy: number | null;
    mood_trend: MoodTrend;
    trend_slope: number | null;
  };
  best_day: DayHighlight | null;
  worst_day: DayHighlight | null;
  highlight_signal: "mood" | "energy";
  top_tags: TagCount[];
  day_breakdown: DayBreakdownItem[];
  narrative: string;
  narrative_source?: string;
  reflection_prompt: string;
  shareable: boolean;
  // Retention enrichments (present on the live weekly endpoint).
  streak?: number;
  week_over_week?: WeekOverWeek | null;
}

export interface SharedDigest extends WeeklyDigest {
  sender_name: string | null;
  sender_note: string | null;
  reflection: string | null;
  shared_days: string[] | null;
  shared_at: string;
  expires_at: string;
}

export interface ShareResponse {
  token: string;
  url: string;
}
