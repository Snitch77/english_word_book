"use client";

import { splitExampleByWord } from "@/lib/study/highlight";

interface ExampleSentenceProps {
  example: string;
  word: string;
  mode: "highlight" | "blank";
  revealed: boolean;
}

export function ExampleSentence({
  example,
  word,
  mode,
  revealed,
}: ExampleSentenceProps) {
  const parts = splitExampleByWord(example, word);

  return (
    <p className="font-[family-name:var(--font-display)] text-[1.65rem] leading-snug tracking-tight text-[var(--ink)] sm:text-[2.1rem] sm:leading-[1.35]">
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={`${part.value}-${index}`}>{part.value}</span>;
        }

        if (mode === "blank" && !revealed) {
          return (
            <span
              key={`${part.value}-${index}`}
              className="mx-1 inline-block min-w-[4.5rem] border-b-2 border-[var(--accent)] align-baseline text-transparent select-none"
              aria-label="빈칸"
            >
              {part.value}
            </span>
          );
        }

        return (
          <mark
            key={`${part.value}-${index}`}
            className="rounded-sm bg-[var(--accent-soft)] px-1 text-[var(--accent-deep)] transition-colors duration-300"
          >
            {part.value}
          </mark>
        );
      })}
    </p>
  );
}
