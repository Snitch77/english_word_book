import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import type { IntervalOptionId, ParsedWordRow, WordCard, WordSet } from "@/types/word";
import { scheduleReview } from "@/lib/srs/scheduler";
import { getFirebaseDb } from "./client";

function wordsCol(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "words");
}

function setsCol(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "wordSets");
}

function mapWordDoc(id: string, data: Record<string, unknown>): WordCard {
  return {
    id,
    word: String(data.word ?? ""),
    meaning: String(data.meaning ?? ""),
    example: String(data.example ?? ""),
    exampleMeaning: String(data.exampleMeaning ?? ""),
    setId: String(data.setId ?? ""),
    setName: String(data.setName ?? ""),
    status: (data.status as WordCard["status"]) ?? "new",
    nextReviewAt: Number(data.nextReviewAt ?? Date.now()),
    lastIntervalId: (data.lastIntervalId as IntervalOptionId | null) ?? null,
    reviewCount: Number(data.reviewCount ?? 0),
    createdAt: Number(data.createdAt ?? Date.now()),
    updatedAt: Number(data.updatedAt ?? Date.now()),
  };
}

/**
 * Real-time word stream for cross-device sync.
 * Due-queue filtering happens client-side so we keep a single listener.
 */
export function subscribeWords(
  uid: string,
  listener: (words: WordCard[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(wordsCol(uid), orderBy("nextReviewAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const words = snapshot.docs.map((item) =>
        mapWordDoc(item.id, item.data() as Record<string, unknown>),
      );
      listener(words);
    },
    (error) => onError?.(error),
  );
}

export async function importWordSet(
  uid: string,
  setName: string,
  rows: ParsedWordRow[],
): Promise<WordSet> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const now = Date.now();
  const setRef = doc(setsCol(uid));

  const set: WordSet = {
    id: setRef.id,
    name: setName,
    wordCount: rows.length,
    createdAt: now,
  };

  batch.set(setRef, {
    ...set,
    serverCreatedAt: serverTimestamp(),
  });

  rows.forEach((row) => {
    const wordRef = doc(wordsCol(uid));
    batch.set(wordRef, {
      word: row.word,
      meaning: row.meaning,
      example: row.example,
      exampleMeaning: row.exampleMeaning,
      setId: set.id,
      setName: set.name,
      status: "new",
      nextReviewAt: now,
      lastIntervalId: null,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return set;
}

export async function scheduleFirebaseReview(
  uid: string,
  card: WordCard,
  intervalId: IntervalOptionId,
): Promise<WordCard> {
  const updated = scheduleReview(card, intervalId);
  const wordRef = doc(wordsCol(uid), card.id);

  const batch = writeBatch(getFirebaseDb());
  batch.update(wordRef, {
    nextReviewAt: updated.nextReviewAt,
    lastIntervalId: updated.lastIntervalId,
    status: updated.status,
    reviewCount: updated.reviewCount,
    updatedAt: updated.updatedAt,
    serverUpdatedAt: serverTimestamp(),
  });
  await batch.commit();

  return updated;
}
