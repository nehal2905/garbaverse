"use client";

import { useEffect } from "react";
import Link from "next/link";
import { EVENT } from "@/lib/event";

/** Branded fallback for unexpected server/render errors (e.g. a database blip). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-cream">We missed a beat</h1>
      <p className="mt-3 text-cream/65">
        This page hit a snag. If you just paid, don&apos;t pay again — your pass is safe and will arrive by
        email. Try again in a moment, or write to {EVENT.contact.email}.
      </p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Home
        </Link>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-cream/40">Ref {error.digest}</p>}
    </main>
  );
}
