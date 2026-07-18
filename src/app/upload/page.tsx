"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ExcelUploader } from "@/components/upload/ExcelUploader";
import { useWords } from "@/hooks/useWords";
import type { ParsedWordRow } from "@/types/word";

export default function UploadPage() {
  const router = useRouter();
  const { importRows, mode } = useWords();
  const [setName, setSetName] = useState("My Word List");
  const [status, setStatus] = useState<string | null>(null);

  const handleParsed = useCallback(
    async (rows: ParsedWordRow[], fileName: string) => {
      const name = setName.trim() || fileName.replace(/\.[^.]+$/, "");
      setStatus("저장 중…");
      await importRows(name, rows);
      setStatus(`${rows.length}개 저장 완료 (${mode})`);
      router.push("/study");
    },
    [importRows, mode, router, setName],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Upload
        </h1>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          엑셀/CSV를 파싱해 학습 큐에 바로 넣습니다. Firebase가 설정되어 있으면
          기기 간 실시간 동기화되고, 없으면 브라우저 로컬에 저장됩니다.
        </p>
      </header>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          세트 이름
        </span>
        <input
          value={setName}
          onChange={(event) => setSetName(event.target.value)}
          className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
          placeholder="예: TOEIC Day 1"
        />
      </label>

      <ExcelUploader onParsed={handleParsed} />

      {status ? (
        <p className="text-sm text-[var(--accent-deep)]">{status}</p>
      ) : null}

      <aside className="rounded-2xl border border-[var(--line)] bg-white/50 px-5 py-4 text-sm leading-relaxed text-[var(--muted)]">
        <p className="mb-2 font-medium text-[var(--ink)]">지원 형식</p>
        <p>
          <code className="text-[var(--ink-soft)]">영단어, 뜻, 예문, 해석</code>
          {" "}
          (예: 토익.xlsx의 &quot;영단어 토익책&quot; 시트)
        </p>
        <p className="mt-2">
          예문 열이 없는 시트(영단어·뜻만)도 가져올 수 있지만, 예문이 있는 시트가
          있으면 그쪽을 우선합니다.
        </p>
        <p className="mt-3">
          샘플 파일:{" "}
          <a
            href="/sample-words.csv"
            className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
          >
            sample-words.csv
          </a>
        </p>
      </aside>
    </div>
  );
}
