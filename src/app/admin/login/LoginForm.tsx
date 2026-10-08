"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (!r) {
      setError("No connection. Check the network and try again.");
      setBusy(false);
      return;
    }
    if (r.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      const body = await r.json().catch(() => ({}));
      setError(body.error ?? "Login failed.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Sign in
      </button>
    </form>
  );
}
