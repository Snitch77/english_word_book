"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/study", label: "학습" },
  { href: "/upload", label: "업로드" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mode, user, loading, signOutUser } = useAuth();
  const needsLogin = mode === "firebase" && !loading && !user;

  return (
    <div className="relative min-h-full overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,#d8efe8_0%,transparent_42%),radial-gradient(circle_at_88%_0%,#f3e7d8_0%,transparent_36%),linear-gradient(180deg,#f4f7f6_0%,#eef2f0_48%,#f7f3ee_100%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
      </div>

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 pb-2 pt-6 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] transition-transform duration-300 group-hover:-translate-y-0.5">
            Context
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Words
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {!needsLogin ? (
            <nav className="flex items-center gap-1 sm:gap-2">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
                      active
                        ? "bg-[var(--ink)] text-[var(--paper)]"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {mode === "firebase" && user ? (
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="hidden rounded-md px-2 py-2 text-xs text-[var(--muted)] transition-colors hover:text-[var(--ink)] sm:inline"
              title={user.email ?? "로그아웃"}
            >
              로그아웃
            </button>
          ) : null}
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 pt-1 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
          sync ·{" "}
          {mode === "firebase"
            ? user
              ? `firebase · ${user.email ?? "signed in"}`
              : "firebase · sign in required"
            : "local demo"}
        </p>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-8 sm:px-8">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">계정 확인 중…</p>
        ) : needsLogin ? (
          <LoginPanel />
        ) : (
          children
        )}
      </main>
    </div>
  );
}
