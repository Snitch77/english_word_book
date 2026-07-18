"use client";

import { INTERVAL_OPTIONS } from "@/lib/srs/intervals";
import type { IntervalOptionId } from "@/types/word";

interface IntervalPickerProps {
  disabled?: boolean;
  onSelect: (intervalId: IntervalOptionId) => void;
}

export function IntervalPicker({ disabled, onSelect }: IntervalPickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        다음 복습
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {INTERVAL_OPTIONS.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.id)}
            className="rounded-xl border border-[var(--line)] bg-white/70 px-3 py-3 text-sm text-[var(--ink)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--ink)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ transitionDelay: `${index * 20}ms` }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
