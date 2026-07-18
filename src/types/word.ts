export type ReviewStatus = "new" | "learning" | "review" | "mastered";

/** Fixed spaced-repetition intervals from the product spec */
export type IntervalOptionId =
  | "30m"
  | "1h"
  | "1d"
  | "3d"
  | "7d";

export interface IntervalOption {
  id: IntervalOptionId;
  label: string;
  milliseconds: number;
}

export interface WordCard {
  id: string;
  word: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  setId: string;
  setName: string;
  status: ReviewStatus;
  /** When this card becomes due in the learning queue */
  nextReviewAt: number;
  /** Last interval the learner chose */
  lastIntervalId: IntervalOptionId | null;
  reviewCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface WordSet {
  id: string;
  name: string;
  wordCount: number;
  createdAt: number;
}

export interface ParsedWordRow {
  word: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

export interface QueueStats {
  dueCount: number;
  learningCount: number;
  totalCount: number;
  nextDueAt: number | null;
}
