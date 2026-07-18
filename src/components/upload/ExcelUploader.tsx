"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { parseWordFile } from "@/lib/parse/excel";
import type { ParsedWordRow } from "@/types/word";

interface ExcelUploaderProps {
  onParsed: (rows: ParsedWordRow[], fileName: string) => Promise<void> | void;
}

export function ExcelUploader({ onParsed }: ExcelUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;

      setBusy(true);
      setError(null);
      setMessage(null);

      try {
        const buffer = await file.arrayBuffer();
        const result = parseWordFile(buffer);
        await onParsed(result.rows, file.name);
        const skippedNote =
          result.skipped > 0 ? ` · 예문 비어 있는 ${result.skipped}행 건너뜀` : "";
        setMessage(
          `"${result.sheetName}" 시트에서 ${result.rows.length}개 단어를 가져왔습니다${skippedNote}.`,
        );
      } catch (parseError) {
        setError(
          parseError instanceof Error
            ? parseError.message
            : "파일을 읽는 중 오류가 발생했습니다.",
        );
      } finally {
        setBusy(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [onParsed],
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed px-6 py-14 text-center transition-all duration-300 ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent-soft)] scale-[1.01]"
            : "border-[var(--line)] bg-white/50 hover:border-[var(--ink)] hover:bg-white/80"
        }`}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Drop your list
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            토익 학습용 엑셀처럼 시트가 여러 개여도 됩니다.{" "}
            <span className="text-[var(--ink)]">영단어 · 뜻 · 예문 · 해석</span>{" "}
            열이 있는 시트를 자동으로 고릅니다.
          </p>
          <span className="mt-2 inline-flex items-center rounded-md bg-[var(--ink)] px-4 py-2 text-sm text-[var(--paper)] transition-transform duration-300 group-hover:-translate-y-0.5">
            {busy ? "파싱 중…" : "파일 선택"}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </div>

      {message ? (
        <p className="text-sm text-[var(--accent-deep)]">{message}</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
