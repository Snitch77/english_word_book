import type {
  IntervalOptionId,
  QueueStats,
  WordCard,
} from "@/types/word";
import { computeNextReviewAt, statusAfterInterval } from "./intervals";

/**
 * Spaced Repetition Scheduler (manual interval model)
 * --------------------------------------------------
 * Product model (from the spec):
 * 1. Learner finishes a card (answer revealed).
 * 2. Learner picks when to see it again: 30m / 1h / 1d / 3d / 7d.
 * 3. Card is removed from the *due* queue until `nextReviewAt`.
 * 4. When `nextReviewAt <= now`, the card reappears automatically.
 *
 * This is intentionally simpler than SM-2:
 * - No ease factor / quality grade math
 * - Learner self-rates via concrete time buttons
 * - Easy to sync in Firestore (one timestamp field drives the queue)
 *
 * Queue priority:
 * - Due cards first (`nextReviewAt <= now`), oldest due first
 * - Then upcoming cards (for preview / empty-state messaging)
 */
export function isDue(card: WordCard, now: number = Date.now()): boolean {
  return card.nextReviewAt <= now;
}

export function sortStudyQueue(
  cards: WordCard[],
  now: number = Date.now(),
): WordCard[] {
  return [...cards].sort((a, b) => {
    const aDue = isDue(a, now);
    const bDue = isDue(b, now);

    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    // Among due cards: oldest first so long-overdue items surface early
    if (aDue && bDue) {
      if (a.nextReviewAt !== b.nextReviewAt) {
        return a.nextReviewAt - b.nextReviewAt;
      }
      return a.createdAt - b.createdAt;
    }

    // Upcoming: soonest first
    return a.nextReviewAt - b.nextReviewAt;
  });
}

export function getDueCards(
  cards: WordCard[],
  now: number = Date.now(),
): WordCard[] {
  return sortStudyQueue(
    cards.filter((card) => isDue(card, now)),
    now,
  );
}

export function getQueueStats(
  cards: WordCard[],
  now: number = Date.now(),
): QueueStats {
  const due = cards.filter((card) => isDue(card, now));
  const upcoming = cards
    .filter((card) => !isDue(card, now))
    .map((card) => card.nextReviewAt);

  return {
    dueCount: due.length,
    learningCount: cards.filter((card) => card.status === "learning").length,
    totalCount: cards.length,
    nextDueAt: upcoming.length > 0 ? Math.min(...upcoming) : null,
  };
}

/**
 * Apply a learner-selected interval to a card.
 * Pure function — persistence is handled by the repository layer.
 */
export function scheduleReview(
  card: WordCard,
  intervalId: IntervalOptionId,
  now: number = Date.now(),
): WordCard {
  return {
    ...card,
    lastIntervalId: intervalId,
    nextReviewAt: computeNextReviewAt(intervalId, now),
    status: statusAfterInterval(intervalId),
    reviewCount: card.reviewCount + 1,
    updatedAt: now,
  };
}

/**
 * Optional SM-2-inspired suggestion (not forced in UI).
 * Uses recent interval + a coarse self-grade to recommend the next button.
 *
 * grade: 0 = forgot, 1 = hard, 2 = good, 3 = easy
 */
export function suggestIntervalId(
  card: WordCard,
  grade: 0 | 1 | 2 | 3,
): IntervalOptionId {
  if (grade === 0) return "30m";
  if (grade === 1) return "1h";

  const ladder: IntervalOptionId[] = ["30m", "1h", "1d", "3d", "7d"];
  const currentIndex = card.lastIntervalId
    ? ladder.indexOf(card.lastIntervalId)
    : -1;

  if (grade === 2) {
    return ladder[Math.min(currentIndex + 1, ladder.length - 1)] ?? "1d";
  }

  // easy → jump two steps
  return ladder[Math.min(currentIndex + 2, ladder.length - 1)] ?? "3d";
}
