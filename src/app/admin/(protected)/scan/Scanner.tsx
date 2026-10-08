"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, CheckCircle2, Keyboard, Loader2, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Code = "ok" | "already_used" | "not_confirmed" | "not_found" | "invalid_signature" | "error";

interface ScanResult {
  code: Code;
  signatureValid: boolean;
  message?: string;
  booking: {
    id: string;
    name: string;
    tier: string;
    quantity: number;
    attendees: number;
    status: string;
    checked_in_at: string | null;
    checked_in_by: string | null;
  } | null;
}

const MESSAGES: Record<Code, { title: string; tone: "ok" | "bad" | "warn" }> = {
  ok: { title: "Welcome in!", tone: "ok" },
  already_used: { title: "Already scanned", tone: "bad" },
  not_confirmed: { title: "Not paid", tone: "bad" },
  not_found: { title: "Unknown pass", tone: "bad" },
  invalid_signature: { title: "Forged / invalid QR", tone: "bad" },
  error: { title: "Couldn't check", tone: "warn" },
};

/** A QR that stays in frame is ignored until it has been out of view this long. */
const SAME_QR_GAP_MS = 4000;

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastPayload = useRef<{ value: string; at: number }>({ value: "", at: 0 });

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState("");
  const [gate, setGate] = useState("Gate 1");
  const [count, setCount] = useState(0);

  // The camera loop is a long-lived rAF closure created once in start(); it
  // must read live values through refs, not the state captured at that time
  // (otherwise changing the gate mid-shift mislabels every later check-in).
  const busyRef = useRef(false);
  const gateRef = useRef(gate);
  useEffect(() => {
    gateRef.current = gate;
  }, [gate]);

  const submit = useCallback(async (payload: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, by: gateRef.current }),
      });
      const body = (await r.json().catch(() => ({}))) as Partial<ScanResult> & { error?: string };
      if (!r.ok || !body.code || !(body.code in MESSAGES)) {
        setResult({
          code: "error",
          signatureValid: false,
          booking: null,
          message:
            r.status === 401
              ? "Your admin session expired. Sign in again, then rescan."
              : body.error ?? "Server error. Rescan in a moment — do not admit on this result.",
        });
        beep(330, 0.25);
        return;
      }
      setResult(body as ScanResult);
      if (body.code === "ok") {
        setCount((c) => c + 1);
        beep(880);
        navigator.vibrate?.(80);
      } else {
        beep(220, 0.35);
        navigator.vibrate?.([120, 60, 120]);
      }
    } catch {
      setResult({
        code: "error",
        signatureValid: false,
        booking: null,
        message: "No connection. Check the network and rescan — do not admit on this result.",
      });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  /* ─────────── Camera loop ─────────── */
  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const start = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setCameraOn(true);

      const { default: jsQR } = await import("jsqr");
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

      const tick = () => {
        if (!streamRef.current) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          // Scan a centred square crop for speed.
          const size = Math.min(video.videoWidth, video.videoHeight);
          const sx = (video.videoWidth - size) / 2;
          const sy = (video.videoHeight - size) / 2;
          canvas.width = 480;
          canvas.height = 480;
          ctx.drawImage(video, sx, sy, size, size, 0, 0, 480, 480);
          const img = ctx.getImageData(0, 0, 480, 480);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          // While a check is in flight, don't consume frames — a new QR seen
          // now must still count as "new" once the request finishes.
          if (code?.data && !busyRef.current) {
            const now = Date.now();
            const last = lastPayload.current;
            // A phone held in front of the camera is seen every frame. Only
            // resubmit once that QR has left the frame for SAME_QR_GAP_MS —
            // otherwise a valid "Welcome in!" flips to "Already scanned" for
            // the very same person after a few seconds.
            const isNew = code.data !== last.value || now - last.at > SAME_QR_GAP_MS;
            lastPayload.current = { value: code.data, at: now };
            if (isNew) submit(code.data);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setCameraError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access in your browser settings, or type the ID below."
          : "Could not start the camera. Try another browser, or type the ID below."
      );
      stop();
    }
  }, [submit, stop]);

  useEffect(() => () => stop(), [stop]);

  const undo = async (id: string) => {
    const r = await fetch("/api/admin/checkin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    if (!r?.ok) {
      setResult({
        code: "error",
        signatureValid: false,
        booking: null,
        message: `Undo failed for ${id}. The pass is still marked as checked in — try again.`,
      });
      return;
    }
    setResult(null);
    setCount((c) => Math.max(0, c - 1));
  };

  const tone = result ? MESSAGES[result.code].tone : null;

  return (
    <div className="space-y-5">
      {/* Gate + count */}
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-cream/70">
          Gate
          <select value={gate} onChange={(e) => setGate(e.target.value)} className="input w-auto py-2">
            {["Gate 1", "Gate 2", "VIP gate", "Squad gate"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <div className="text-sm text-cream/60">
          <span className="font-display text-2xl font-bold text-brand-300">{count}</span> checked in this session
        </div>
      </div>

      {/* Camera */}
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-ink-950">
        <video ref={videoRef} className={cn("h-full w-full object-cover", !cameraOn && "hidden")} muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {cameraOn && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="h-[62%] w-[62%] rounded-3xl border-2 border-brand-500/80 shadow-[0_0_0_9999px_rgba(11,15,28,0.65)]" />
            <div className="absolute h-[62%] w-[62%] overflow-hidden rounded-3xl">
              <div className="h-0.5 w-full bg-brand-400 shadow-soft motion-safe:animate-[scanline_2.2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}
        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <Camera className="h-10 w-10 text-brand-400" aria-hidden="true" />
            <button type="button" onClick={start} className="btn-primary">
              Start camera
            </button>
            {cameraError && <p className="text-sm text-danger">{cameraError}</p>}
          </div>
        )}
        {busy && (
          <div className="absolute right-3 top-3 rounded-full bg-ink-950/80 p-2">
            <Loader2 className="h-4 w-4 animate-spin text-brand-300" aria-label="Checking…" />
          </div>
        )}
        <style>{`@keyframes scanline { 0%,100% { transform: translateY(0) } 50% { transform: translateY(calc(62vmin - 2px)) } }`}</style>
      </div>
      {cameraOn && (
        <button type="button" onClick={stop} className="btn-ghost w-full text-sm">
          <CameraOff className="h-4 w-4" aria-hidden="true" /> Stop camera
        </button>
      )}

      {/* Manual entry */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) submit(manual.trim());
          setManual("");
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Keyboard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" aria-hidden="true" />
          <input
            aria-label="Booking ID"
            className="input pl-11 font-mono uppercase"
            placeholder="Type booking ID, e.g. GV-7K3M9Q"
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <button type="submit" className="btn-outline" disabled={busy || !manual.trim()}>
          Check in
        </button>
      </form>

      {/* Result */}
      <div role="status" aria-live="assertive" className="min-h-[7rem]">
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={`${result.code}-${result.booking?.id ?? "x"}-${count}`}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={cn(
                "rounded-3xl border p-5",
                tone === "ok" && "border-ok/50 bg-ok/15",
                tone === "bad" && "border-brand-500/70 bg-brand-700/30",
                tone === "warn" && "border-warn/60 bg-warn/15"
              )}
            >
              <div className="flex items-start gap-3">
                {tone === "ok" ? (
                  <CheckCircle2 className="h-9 w-9 shrink-0 text-ok" aria-hidden="true" />
                ) : (
                  <XCircle className="h-9 w-9 shrink-0 text-brand-400" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-display text-2xl font-bold text-cream">{MESSAGES[result.code].title}</div>
                  {result.booking ? (
                    <div className="mt-1 text-sm text-cream/85">
                      <div className="text-lg font-semibold">{result.booking.name}</div>
                      <div>
                        {result.booking.tier} × {result.booking.quantity} ·{" "}
                        <span className="font-bold text-brand-300">admits {result.booking.attendees}</span>
                      </div>
                      <div className="mt-1 font-mono text-xs text-cream/60">{result.booking.id}</div>
                      {result.code === "already_used" && result.booking.checked_in_at && (
                        <div className="mt-1 text-xs text-brand-300">
                          First scanned{" "}
                          {new Date(result.booking.checked_in_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          at {result.booking.checked_in_by}
                        </div>
                      )}
                      {result.code === "not_confirmed" && (
                        <div className="mt-1 text-xs text-brand-300">Status: {result.booking.status}. Ask for payment proof.</div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-cream/75">
                      {result.code === "error"
                        ? result.message
                        : result.code === "invalid_signature"
                          ? "The QR failed signature verification. Do not admit."
                          : "No booking matches this code."}
                    </p>
                  )}
                </div>
                {result.code === "ok" && result.booking && (
                  <button
                    type="button"
                    onClick={() => undo(result.booking!.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-xs text-cream/70 hover:text-cream"
                    title="Undo this check-in"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" /> Undo
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Tiny beep via WebAudio — no asset needed. */
function beep(freq: number, duration = 0.12) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available */
  }
}
