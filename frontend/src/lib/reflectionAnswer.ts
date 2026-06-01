/**
 * Local persistence for the user's answer to the weekly reflection prompt.
 *
 * Keyed by week_start (YYYY-MM-DD), stored in localStorage as:
 *   pulse:reflection-answer:<week_start> -> { text, savedAt }
 *
 * Answers stay client-side only — they are never sent to the backend or
 * included in a shared digest unless the user explicitly opts in at share time.
 */

const PREFIX = "pulse:reflection-answer:";
const MAX_LEN = 1000;

export interface ReflectionAnswer {
  text: string;
  savedAt: string; // ISO timestamp
}

export function loadReflectionAnswer(weekStart: string): ReflectionAnswer | null {
  try {
    const raw = localStorage.getItem(PREFIX + weekStart);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.text !== "string" ||
      typeof parsed?.savedAt !== "string"
    ) {
      return null;
    }
    return { text: parsed.text, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function saveReflectionAnswer(
  weekStart: string,
  text: string
): ReflectionAnswer {
  const record: ReflectionAnswer = {
    text: text.slice(0, MAX_LEN),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(PREFIX + weekStart, JSON.stringify(record));
  return record;
}

export function clearReflectionAnswer(weekStart: string): void {
  localStorage.removeItem(PREFIX + weekStart);
}

export const REFLECTION_MAX_LEN = MAX_LEN;
