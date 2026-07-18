"use client";

import Link from "next/link";
import { DueQueue } from "@/components/queue/DueQueue";
import { useWords } from "@/hooks/useWords";

export default function HomePage() {
  const { dueWords, stats, loading, mode } = useWords();

  return (
    <div className="space-y-14">
      <section className="relative min-h-[58vh] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(135deg,#163028_0%,#1f4034_42%,#2d4a38_100%)] px-6 py-10 text-[var(--paper)] sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-[var(--accent)]/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-40 w-40 rounded-full bg-[#f3e7d8]/15 blur-2xl" />

        <div className="relative max-w-xl space-y-6">
          <p className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight sm:text-6xl">
            Context
            <span className="block text-[var(--accent)]">Words</span>
          </p>
          <p className="max-w-md text-base leading-relaxed text-white/75">
            예문 속에서 단어를 만나고, 내가 고른 간격으로 다시 만납니다.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/study"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--ink)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              지금 학습
            </Link>
            <Link
              href="/upload"
              className="rounded-xl border border-white/25 px-5 py-3 text-sm text-white/90 transition-colors hover:bg-white/10"
            >
              엑셀 업로드
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">큐를 불러오는 중…</p>
      ) : (
        <DueQueue dueWords={dueWords} stats={stats} />
      )}

      <section className="max-w-2xl space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          How review works
        </h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          학습 후 30분 / 1시간 / 1일 / 3일 / 7일 중 하나를 고르면
          <code className="mx-1 rounded bg-white/70 px-1.5 py-0.5 text-[var(--ink)]">
            nextReviewAt
          </code>
          이 갱신되고, 그 시각이 되면 학습 큐에 다시 올라옵니다. 현재 모드:{" "}
          <span className="text-[var(--ink)]">{mode}</span>.
        </p>
      </section>
    </div>
  );
}
