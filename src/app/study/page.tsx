"use client";

import Link from "next/link";
import { StudyCard } from "@/components/study/StudyCard";
import { useWords } from "@/hooks/useWords";

export default function StudyPage() {
  const { dueWords, loading, schedule, refreshNow, error } = useWords();
  const current = dueWords[0];

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">학습 큐를 준비하는 중…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!current) {
    return (
      <section className="animate-fade-up space-y-5 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          All caught up
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">
          지금 복습할 카드가 없습니다. 새 단어를 업로드하거나, 설정해 둔 다음
          복습 시각을 기다려 주세요.
        </p>
        <div className="flex gap-3">
          <Link
            href="/upload"
            className="rounded-xl bg-[var(--ink)] px-5 py-3 text-sm text-[var(--paper)]"
          >
            업로드로 이동
          </Link>
          <button
            type="button"
            onClick={refreshNow}
            className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm text-[var(--ink)]"
          >
            큐 새로고침
          </button>
        </div>
      </section>
    );
  }

  return (
    <StudyCard
      card={current}
      remaining={dueWords.length}
      onSchedule={async (intervalId) => {
        await schedule(current, intervalId);
        refreshNow();
      }}
    />
  );
}
