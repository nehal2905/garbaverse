"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Mail, Search } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/lib/types";

interface Row extends Booking {
  ticket_types: { name: string } | null;
}
interface ListResponse {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
}

const statuses: Array<BookingStatus | "all"> = ["all", "confirmed", "pending", "cancelled"];

export function BookingsTable() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    // Only the latest request may write state; slower, older responses are dropped.
    const mine = ++requestId.current;
    setLoading(true);
    try {
      const sp = new URLSearchParams({ q: debounced, status, page: String(page) });
      const r = await fetch(`/api/admin/bookings?${sp}`, { cache: "no-store" });
      if (mine !== requestId.current) return;
      if (r.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData((await r.json()) as ListResponse);
      setLoadError(null);
    } catch {
      if (mine === requestId.current) setLoadError("Couldn't load bookings. Retrying on next change.");
    } finally {
      if (mine === requestId.current) setLoading(false);
    }
  }, [debounced, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (path: "/api/admin/confirm" | "/api/admin/reject", id: string, ok: string, fail: string) => {
    setActing(id);
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    setActing(null);
    setToast(r?.ok ? ok : fail);
    setTimeout(() => setToast(null), 3000);
    load();
  };

  const resend = async (id: string) => {
    setResending(id);
    const r = await fetch("/api/admin/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    setResending(null);
    setToast(r?.ok ? `Pass re-sent for ${id}` : `Failed to re-send ${id}`);
    setTimeout(() => setToast(null), 3000);
    load();
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section aria-label="Bookings list" className="glass-strong rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search bookings"
            placeholder="Search name, email, phone, booking or payment ID"
            className="input pl-11"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Filter by status" className="flex rounded-full border border-brand-700/10 p-1">
            {statuses.map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={status === s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  status === s ? "bg-brand-600 text-cream-50" : "text-ink-600 hover:text-ink-900"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <a href="/api/admin/export" className="btn-outline min-h-10 px-4 text-sm">
            <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
          </a>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {loadError}
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-500">
            <tr className="border-b border-brand-700/10">
              <th className="py-3 pr-4">Booking</th>
              <th className="py-3 pr-4">Attendee</th>
              <th className="py-3 pr-4">Pass</th>
              <th className="py-3 pr-4">Amount</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Check-in</th>
              <th className="py-3 pr-4">Created</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && !data
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-700/10">
                    <td colSpan={8} className="py-3">
                      <div className="skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))
              : data?.rows.map((r) => (
                  <tr key={r.id} className="border-b border-brand-700/10 align-top hover:bg-white/[0.03]">
                    <td className="py-3 pr-4">
                      <div className="font-mono font-semibold text-brand-600">{r.id}</div>
                      {r.razorpay_payment_id && (
                        <div className="text-xs text-ink-400">{r.razorpay_payment_id}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-ink-900">{r.name}</div>
                      <div className="text-xs text-ink-500">{r.email}</div>
                      <div className="text-xs text-ink-500">{r.phone}</div>
                    </td>
                    <td className="py-3 pr-4 text-ink-800">
                      {r.ticket_types?.name ?? r.ticket_type_id} × {r.quantity}
                      <div className="text-xs text-ink-500">admits {r.attendees}</div>
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-ink-900">{formatINR(r.amount_paise)}</td>
                    <td className="py-3 pr-4">
                      <StatusPill status={r.status} />
                      {r.payment_method && r.status === "pending" && (
                        <div className="mt-1 text-xs font-medium text-brand-600">UPI to review</div>
                      )}
                      {r.cancel_reason && <div className="mt-1 max-w-[160px] truncate text-xs text-ink-400" title={r.cancel_reason}>{r.cancel_reason}</div>}
                    </td>
                    <td className="py-3 pr-4 text-xs text-ink-600">
                      {r.checked_in_at ? (
                        <>
                          <span className="font-semibold text-ok">In</span>{" "}
                          {new Date(r.checked_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-ink-600">
                      {new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="py-3 text-right">
                      {r.status === "pending" && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => act("/api/admin/confirm", r.id, `Confirmed ${r.id}`, `Could not confirm ${r.id}`)}
                            disabled={acting === r.id}
                            className="inline-flex items-center rounded-full bg-ok/15 px-2.5 py-1 text-xs font-semibold text-ok hover:bg-ok/25 disabled:opacity-50"
                          >
                            {acting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => act("/api/admin/reject", r.id, `Rejected ${r.id}`, `Could not reject ${r.id}`)}
                            disabled={acting === r.id}
                            className="inline-flex items-center rounded-full border border-brand-700/10 px-2.5 py-1 text-xs text-ink-600 hover:border-danger/40 hover:text-danger disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status === "confirmed" && (
                        <button
                          type="button"
                          onClick={() => resend(r.id)}
                          disabled={resending === r.id}
                          className="inline-flex items-center gap-1 rounded-full border border-brand-700/10 px-2.5 py-1 text-xs text-ink-700 hover:border-brand-500/50 hover:text-brand-700 disabled:opacity-50"
                          title={r.email_sent_at ? `Sent ${new Date(r.email_sent_at).toLocaleString("en-IN")}` : "Never sent"}
                        >
                          {resending === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                          Resend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            {data && data.rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-ink-500">
                  No bookings match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
        <span>{data ? `${data.total.toLocaleString("en-IN")} bookings` : ""}</span>
        <div className="flex items-center gap-2">
          <button className="btn-ghost min-h-8 px-3 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span>
            Page {page} / {pages}
          </span>
          <button className="btn-ghost min-h-8 px-3 text-xs" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-cream-50 shadow-soft">
          {toast}
        </div>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        status === "confirmed" && "bg-ok/15 text-ok",
        status === "pending" && "bg-warn/15 text-warn",
        status === "cancelled" && "bg-brand-700/10 text-ink-600"
      )}
    >
      {status}
    </span>
  );
}
