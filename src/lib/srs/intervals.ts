import type { IntervalOption, IntervalOptionId, ReviewStatus } from "@/types/word";

/**
 * Spec-aligned interval buttons shown after each review.
 * Values are wall-clock delays until the card re-enters the due queue.
 */
export const INTERVAL_OPTIONS: IntervalOption[] = [
  { id: "30m", label: "30분 뒤", milliseconds: 30 * 60 * 1000 },
  { id: "1h", label: "1시간 뒤", milliseconds: 60 * 60 * 1000 },
  { id: "1d", label: "1일 뒤", milliseconds: 24 * 60 * 60 * 1000 },
  { id: "3d", label: "3일 뒤", milliseconds: 3 * 24 * 60 * 60 * 1000 },
  { id: "7d", label: "7일 뒤", milliseconds: 7 * 24 * 60 * 60 * 1000 },
];

export function getIntervalOption(id: IntervalOptionId): IntervalOption {
  const found = INTERVAL_OPTIONS.find((option) => option.id === id);
  if (!found) {
    throw new Error(`Unknown interval: ${id}`);
  }
  return found;
}

/**
 * Map chosen interval → learning status.
 * Short delays keep the card in "learning"; longer ones move to "review".
 * 7-day picks mark "mastered" until the next due cycle (still reviewable).
 */
export function statusAfterInterval(id: IntervalOptionId): ReviewStatus {
  switch (id) {
    case "30m":
    case "1h":
      return "learning";
    case "1d":
    case "3d":
      return "review";
    case "7d":
      return "mastered";
    default:
      return "learning";
  }
}

export function computeNextReviewAt(
  intervalId: IntervalOptionId,
  from: number = Date.now(),
): number {
  return from + getIntervalOption(intervalId).milliseconds;
}
