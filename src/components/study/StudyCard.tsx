"use client";

import { useEffect, useState } from "react";
import { ExampleSentence } from "@/components/study/ExampleSentence";
import { IntervalPicker } from "@/components/study/IntervalPicker";
import type { IntervalOptionId, WordCard } from "@/types/word";

interface StudyCardProps {
  card: WordCard;
  remaining: number;
  onSchedule: (intervalId: IntervalOptionId) => Promise<void> | void;
}

export function StudyCard({ card, remaining, onSchedule }: StudyCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [blankMode, setBlankMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRevealed(false);
    setSaving(false);
  }, [card.id]);

  const handleSchedule = async (intervalId: IntervalOptionId) => {
    setSaving(true);
    try {
      await onSchedule(intervalId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="animate-fade-up space-y-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {card.setName} · 남은 {remaining}개
        </p>
        <button
          type="button"
          onClick={() => setBlankMode((prev) => !prev)}
          className="text-xs uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
        >
          {blankMode ? "강조 모드" : "빈칸 모드"}
        </button>
      </div>

      <div className="space-y-6">
        <ExampleSentence
          example={card.example}
          word={card.word}
          mode={blankMode ? "blank" : "highlight"}
          revealed={revealed}
        />

        <div
          className={`grid gap-4 overflow-hidden transition-all duration-500 ${
            revealed
              ? "max-h-64 opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              단어 · 뜻
            </p>
            <p className="text-xl text-[var(--ink)]">
              <span className="font-semibold">{card.word}</span>
              <span className="mx-2 text-[var(--line-strong)]">/</span>
              <span>{card.meaning}</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              예문 해석
            </p>
            <p className="text-base leading-relaxed text-[var(--ink-soft)]">
              {card.exampleMeaning}
            </p>
          </div>
        </div>
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-xl bg-[var(--ink)] px-5 py-3 text-sm text-[var(--paper)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          답보기
        </button>
      ) : (
        <IntervalPicker disabled={saving} onSelect={(id) => void handleSchedule(id)} />
      )}
    </section>
  );
}
