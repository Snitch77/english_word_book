"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { IntervalOptionId, ParsedWordRow, WordCard } from "@/types/word";
import { useAuth } from "@/hooks/useAuth";
import {
  importWordSet,
  scheduleFirebaseReview,
  subscribeWords,
} from "@/lib/firebase/words";
import {
  getDueCards,
  getQueueStats,
  sortStudyQueue,
} from "@/lib/srs/scheduler";
import {
  importLocalWordSet,
  scheduleLocalReview,
  subscribeLocalWords,
} from "@/lib/storage/local-store";

export function useWords() {
  const { user, mode, loading: authLoading } = useAuth();
  const [words, setWords] = useState<WordCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Refresh "due" boundary every 30s so short intervals surface without reload
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    setLoading(true);
    setError(null);

    if (mode === "local" || !user) {
      const unsubscribe = subscribeLocalWords((next) => {
        setWords(next);
        setLoading(false);
      });
      return unsubscribe;
    }

    const unsubscribe = subscribeWords(
      user.uid,
      (next) => {
        setWords(next);
        setLoading(false);
      },
      (subscribeError) => {
        setError(subscribeError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [authLoading, mode, user]);

  const dueWords = useMemo(() => getDueCards(words, now), [now, words]);
  const queue = useMemo(() => sortStudyQueue(words, now), [now, words]);
  const stats = useMemo(() => getQueueStats(words, now), [now, words]);

  const importRows = useCallback(
    async (setName: string, rows: ParsedWordRow[]) => {
      if (mode === "firebase" && user) {
        return importWordSet(user.uid, setName, rows);
      }
      return importLocalWordSet(setName, rows).set;
    },
    [mode, user],
  );

  const schedule = useCallback(
    async (card: WordCard, intervalId: IntervalOptionId) => {
      if (mode === "firebase" && user) {
        return scheduleFirebaseReview(user.uid, card, intervalId);
      }
      return scheduleLocalReview(card.id, intervalId);
    },
    [mode, user],
  );

  return {
    words,
    dueWords,
    queue,
    stats,
    loading: authLoading || loading,
    error,
    mode,
    importRows,
    schedule,
    refreshNow: () => setNow(Date.now()),
  };
}
