"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { EVENT } from "@/lib/event";

export function FindForm({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [bookingId, setBookingId] = useState(initialId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, bookingId }),
      });
      const body = await r.json();
      if (!r.ok) {
        setError(body.error ?? "We couldn't find that booking.");
        return;
      }
      router.push(body.url as string);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="find-email" className="label">
          Email
        </label>
        <input
          id="find-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label htmlFor="find-id" className="label">
          Booking ID
        </label>
        <input
          id="find-id"
          className="input font-mono uppercase tracking-widest"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value.toUpperCase())}
          placeholder="GV-XXXXXX"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </div>
      {error && (
        <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full" aria-busy={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
        {busy ? "Looking…" : "Find my pass"}
      </button>
      <p className="text-center text-xs text-ink-400">
        Can&apos;t find your ID? Search your inbox for “GarbaVerse”, or email{" "}
        <a href={`mailto:${EVENT.contact.email}`} className="text-brand-600 underline">
          {EVENT.contact.email}
        </a>
        .
      </p>
    </form>
  );
}
