import type { IntervalOptionId, ParsedWordRow, WordCard, WordSet } from "@/types/word";
import { scheduleReview } from "@/lib/srs/scheduler";

const WORDS_KEY = "eglish_words_v1";
const SETS_KEY = "eglish_sets_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function loadLocalWords(): WordCard[] {
  return readJson<WordCard[]>(WORDS_KEY, []);
}

export function loadLocalSets(): WordSet[] {
  return readJson<WordSet[]>(SETS_KEY, []);
}

export function subscribeLocalWords(
  listener: (words: WordCard[]) => void,
): () => void {
  const emit = () => listener(loadLocalWords());
  emit();

  const onStorage = (event: StorageEvent) => {
    if (event.key === WORDS_KEY || event.key === null) {
      emit();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("eglish-words-updated", emit as EventListener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("eglish-words-updated", emit as EventListener);
  };
}

function notifyWordsUpdated() {
  window.dispatchEvent(new Event("eglish-words-updated"));
}

export function importLocalWordSet(
  setName: string,
  rows: ParsedWordRow[],
): { set: WordSet; words: WordCard[] } {
  const now = Date.now();
  const set: WordSet = {
    id: createId("set"),
    name: setName,
    wordCount: rows.length,
    createdAt: now,
  };

  const words: WordCard[] = rows.map((row) => ({
    id: createId("word"),
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
  }));

  const nextWords = [...loadLocalWords(), ...words];
  const nextSets = [set, ...loadLocalSets()];
  writeJson(WORDS_KEY, nextWords);
  writeJson(SETS_KEY, nextSets);
  notifyWordsUpdated();

  return { set, words };
}

export function scheduleLocalReview(
  wordId: string,
  intervalId: IntervalOptionId,
): WordCard | null {
  const words = loadLocalWords();
  const index = words.findIndex((word) => word.id === wordId);
  if (index < 0) return null;

  const updated = scheduleReview(words[index], intervalId);
  words[index] = updated;
  writeJson(WORDS_KEY, words);
  notifyWordsUpdated();
  return updated;
}
