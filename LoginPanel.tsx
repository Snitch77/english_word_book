"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function LoginPanel() {
  const { signIn, error } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await signIn();
    } catch {
      // error is surfaced via useAuth().error
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg animate-fade-up space-y-6 rounded-[2rem] border border-[var(--line)] bg-white/70 px-6 py-12 text-center sm:px-10">
      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Sign in
        </h1>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Google 계정으로 로그인하면 PC와 핸드폰에서 같은 학습 기록이
          동기화됩니다.
        </p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void handleSignIn()}
        className="inline-flex items-center justify-center gap-3 rounded-xl bg-[var(--ink)] px-5 py-3 text-sm text-[var(--paper)] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
      >
        <GoogleMark />
        {busy ? "로그인 중…" : "Google로 계속하기"}
      </button>

      {error ? (
        <p className="text-sm text-red-700">
          {error.includes("auth/unauthorized-domain")
            ? "Firebase에 이 사이트 주소(도메인)를 허용 목록에 추가해 주세요."
            : error}
        </p>
      ) : null}
    </section>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.3 5.2C39.1 36.9 44 32 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
