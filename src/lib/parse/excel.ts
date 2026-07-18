import * as XLSX from "xlsx";
import type { ParsedWordRow } from "@/types/word";

const HEADER_ALIASES: Record<keyof ParsedWordRow, string[]> = {
  word: ["영단어", "단어", "word", "english", "vocab", "vocabulary"],
  meaning: ["단어 뜻", "뜻", "의미", "meaning", "definition", "번역"],
  example: ["예문", "example", "sentence", "예문영어", "example sentence"],
  exampleMeaning: [
    "예문 해석",
    "예문해석",
    "해석",
    "번역예문",
    "example meaning",
    "translation",
    "example translation",
  ],
};

export interface ParseWordFileResult {
  rows: ParsedWordRow[];
  sheetName: string;
  skipped: number;
}

type ColumnMap = Partial<Record<keyof ParsedWordRow, number>>;

interface SheetCandidate {
  sheetName: string;
  headerRowIndex: number;
  columnMap: ColumnMap;
  score: number;
  rows: (string | number | null)[][];
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveColumnMap(headers: string[]): ColumnMap {
  const map: ColumnMap = {};

  (Object.keys(HEADER_ALIASES) as Array<keyof ParsedWordRow>).forEach((key) => {
    const aliases = HEADER_ALIASES[key].map((alias) => alias.toLowerCase());
    const index = headers.findIndex((header) => aliases.includes(header));
    if (index >= 0) {
      map[key] = index;
    }
  });

  return map;
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function scoreColumnMap(map: ColumnMap): number {
  let score = 0;
  if (map.word != null) score += 10;
  if (map.meaning != null) score += 10;
  if (map.example != null) score += 20;
  if (map.exampleMeaning != null) score += 20;
  return score;
}

function findHeaderInSheet(
  sheetName: string,
  rows: (string | number | null)[][],
): SheetCandidate | null {
  const scanLimit = Math.min(rows.length, 40);

  for (let i = 0; i < scanLimit; i += 1) {
    const headers = (rows[i] ?? []).map(normalizeHeader);
    const columnMap = resolveColumnMap(headers);
    const score = scoreColumnMap(columnMap);

    // Need at least word + meaning
    if (columnMap.word == null || columnMap.meaning == null) {
      continue;
    }

    return {
      sheetName,
      headerRowIndex: i,
      columnMap,
      score,
      rows,
    };
  }

  return null;
}

function extractRows(candidate: SheetCandidate): {
  rows: ParsedWordRow[];
  skipped: number;
} {
  const { columnMap, headerRowIndex, rows } = candidate;
  const hasExamples =
    columnMap.example != null && columnMap.exampleMeaning != null;

  const parsed: ParsedWordRow[] = [];
  let skipped = 0;

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const word = cellToString(row[columnMap.word!]);
    const meaning = cellToString(row[columnMap.meaning!]);
    const example = cellToString(
      columnMap.example != null ? row[columnMap.example] : "",
    );
    const exampleMeaning = cellToString(
      columnMap.exampleMeaning != null ? row[columnMap.exampleMeaning] : "",
    );

    if (!word && !meaning && !example && !exampleMeaning) {
      continue;
    }

    if (!word || !meaning) {
      skipped += 1;
      continue;
    }

    if (hasExamples) {
      if (!example || !exampleMeaning) {
        skipped += 1;
        continue;
      }
      parsed.push({ word, meaning, example, exampleMeaning });
      continue;
    }

    // Word + meaning only sheet → synthetic example so study UI still works
    parsed.push({
      word,
      meaning,
      example: `Remember the word "${word}".`,
      exampleMeaning: meaning,
    });
  }

  return { rows: parsed, skipped };
}

/**
 * Parse Excel (.xlsx/.xls) or CSV into normalized word rows.
 *
 * Handles real study workbooks like `토익.xlsx`:
 * - Multiple sheets (auto-picks the best: prefers 영단어/뜻/예문/해석)
 * - Header not on row 1 (scans first ~40 rows)
 * - Leading empty columns
 * - Incomplete rows are skipped instead of failing the whole file
 */
export function parseWordFile(file: ArrayBuffer): ParseWordFileResult {
  const workbook = XLSX.read(file, { type: "array" });
  if (workbook.SheetNames.length === 0) {
    throw new Error("시트를 찾을 수 없습니다.");
  }

  const candidates: SheetCandidate[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    const candidate = findHeaderInSheet(sheetName, rows);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      "영단어/뜻 헤더를 찾지 못했습니다. " +
        "예: 영단어, 뜻, 예문, 해석 (토익 학습용 엑셀의 '영단어 토익책' 시트 형식)",
    );
  }

  // Prefer sheets that include example columns
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const { rows, skipped } = extractRows(best);

  if (rows.length === 0) {
    throw new Error(
      `"${best.sheetName}" 시트에서 유효한 단어 행을 찾지 못했습니다.`,
    );
  }

  return {
    rows,
    sheetName: best.sheetName,
    skipped,
  };
}
