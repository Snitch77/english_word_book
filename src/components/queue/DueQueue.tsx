"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import type { QueueStats, WordCard } from "@/types/word";

interface DueQueueProps {
  dueWords: WordCard[];
  stats: QueueStats;
}

export function DueQueue({ dueWords, stats }: DueQueueProps) {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat label="복습 대기" value={String(stats.dueCount)} />
        <Stat label="학습 중" value={String(stats.learningCount)} />
        <Stat label="전체" value={String(stats.totalCount)} />
      </div>

      {stats.nextDueAt && stats.dueCount === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          다음 복습{" "}
          {formatDistanceToNow(stats.nextDueAt, {
            addSuffix: true,
            locale: ko,
          })}
        </p>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Due queue
          </h2>
          <Link
            href="/study"
            className="text-sm text-[var(--accent-deep)] underline-offset-4 hover:underline"
          >
            학습 시작
          </Link>
        </div>

        {dueWords.length === 0 ? (
          <p className="rounded-2xl border border-[var(--line)] bg-white/50 px-5 py-8 text-sm text-[var(--muted)]">
            지금 복습할 단어가 없습니다. 새 리스트를 업로드하거나 다음 복습
            시각을 기다려 주세요.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-white/60">
            {dueWords.slice(0, 8).map((word) => (
              <li
                key={word.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div>
                  <p className="font-medium text-[var(--ink)]">{word.word}</p>
                  <p className="text-sm text-[var(--muted)]">{word.meaning}</p>
                </div>
                <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {word.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/55 px-4 py-5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        {value}
      </p>
    </div>
  );
}
