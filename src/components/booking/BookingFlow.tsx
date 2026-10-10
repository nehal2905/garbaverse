"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Lock, Loader2, RefreshCw } from "lucide-react";
import { Progress } from "./Progress";
import { PriceSummary } from "./PriceSummary";
import { QuantityStepper } from "./QuantityStepper";
import { DetailsForm, validateDetails, type Details, type DetailsErrors } from "./DetailsForm";
import { TierCard } from "@/components/tiers/TierCard";
import { PayQr } from "./PayQr";
import { BrandPair } from "@/components/ui/PartnerLogo";
import { NightPicker } from "./NightPicker";
import { EVENT, formatEventNight, type EventNight } from "@/lib/event";
import { cn, formatINR, normaliseIndianMobile, pluralise } from "@/lib/utils";
import type { TicketType } from "@/lib/types";

interface Props {
  initialTiers: TicketType[];
  initialTierId?: string;
  /** False when the server has no payment/database keys — Pay is disabled up front. */
  checkoutReady?: boolean;
}

interface CreateResponse {
  bookingId: string;
  accessToken: string;
  expiresAt: string;
  amountPaise: number;
}

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
};

export function BookingFlow({ initialTiers, initialTierId, checkoutReady = true }: Props) {
  const router = useRouter();
  const [tiers, setTiers] = useState(initialTiers);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [tierId, setTierId] = useState<string | null>(() => {
    const t = initialTiers.find((x) => x.id === initialTierId);
    return t && t.available > 0 ? t.id : null;
  });
  const [night, setNight] = useState<EventNight | null>(null);
  const [qty, setQty] = useState(1);
  const [details, setDetails] = useState<Details>({ name: "", email: "", phone: "", agree: false });
  const [touched, setTouched] = useState<Partial<Record<keyof Details, boolean>>>({});
  const [paying, setPaying] = useState<"idle" | "creating" | "declaring">("idle");
  const [checkout, setCheckout] = useState<CreateResponse | null>(null);
  const [upiRef, setUpiRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const tier = useMemo(() => tiers.find((t) => t.id === tierId) ?? null, [tiers, tierId]);
  const maxQty = tier ? Math.max(1, Math.min(tier.max_per_order, tier.available)) : 1;

  useEffect(() => {
    if (qty > maxQty) setQty(maxQty);
  }, [maxQty, qty]);

  // Move focus to the step heading on step change (keyboard/screen-reader friendly).
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const refreshTiers = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await fetch("/api/tickets", { cache: "no-store" });
      if (r.ok) {
        const { tiers: fresh } = (await r.json()) as { tiers: TicketType[] };
        setTiers(fresh);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Keep availability honest while the user is on the choose step.
  useEffect(() => {
    if (step !== 0) return;
    const id = setInterval(refreshTiers, 30_000);
    return () => clearInterval(id);
  }, [step, refreshTiers]);

  const errors: DetailsErrors = useMemo(() => validateDetails(details), [details]);
  const visibleErrors: DetailsErrors = Object.fromEntries(
    Object.entries(errors).filter(([k]) => touched[k as keyof Details])
  );

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setError(null);
    setStep(next);
  };

  const submitDetails = () => {
    setTouched({ name: true, email: true, phone: true, agree: true });
    if (Object.keys(errors).length === 0) go(2);
    else {
      const first = Object.keys(errors)[0];
      document.getElementById(first)?.focus();
    }
  };

  /* ───────────────────────── Payment ───────────────────────── */
  const startPay = async () => {
    if (!tier || !night || checkout) return;
    setError(null);
    setPaying("creating");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketTypeId: tier.id,
          eventDate: night,
          quantity: qty,
          name: details.name,
          email: details.email,
          phone: details.phone,
        }),
      });
      const body = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));
      if (!res.ok) {
        if (body.code === "SOLD_OUT") {
          await refreshTiers();
          go(0);
          setError(
            body.available > 0
              ? `Only ${body.available} ${tier.name.toLowerCase()}${body.available === 1 ? "" : "es"} left — please reduce your quantity.`
              : `${tier.name} just sold out. Pick another pass.`
          );
        } else {
          setError(body.error ?? "Something went wrong. Please try again.");
        }
        setPaying("idle");
        return;
      }
      setCheckout(body as CreateResponse);
      setPaying("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error. Please try again.");
      setPaying("idle");
    }
  };

  const declarePaid = async () => {
    if (!checkout) return;
    setError(null);
    setPaying("declaring");
    try {
      const res = await fetch(`/api/bookings/${checkout.bookingId}/paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: checkout.accessToken,
          ref: upiRef.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({ error: "Could not record payment." }));
      if (!res.ok) {
        setError(body.error ?? "Could not record payment. Please try again.");
        setPaying("idle");
        return;
      }
      router.push(`/booking/${checkout.bookingId}?t=${checkout.accessToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error. Please try again.");
      setPaying("idle");
    }
  };

  const abandonQr = async () => {
    if (!checkout) {
      go(1);
      return;
    }
    await fetch(`/api/bookings/${checkout.bookingId}/cancel?t=${checkout.accessToken}`, {
      method: "POST",
    }).catch(() => null);
    setCheckout(null);
    setUpiRef("");
    refreshTiers();
    go(1);
  };

  const total = tier ? tier.price_paise * qty : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-24 sm:px-6 sm:pt-28 lg:pb-16">
      <BrandPair size="sm" className="mb-8" />
      <div className="mx-auto mb-10 max-w-xl">
        <Progress step={step} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* ───────────── Main column ───────────── */}
        <div className="min-w-0">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {/* STEP 1 — Choose */}
            {step === 0 && (
              <motion.section
                key="choose"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                aria-labelledby="step-heading"
              >
                <StepHeading ref={headingRef} eyebrow="Step 1 of 3" title="Choose your pass">
                  <button
                    type="button"
                    onClick={refreshTiers}
                    className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-700"
                    aria-label="Refresh availability"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden="true" />
                    Live availability
                  </button>
                </StepHeading>

                <ErrorBanner message={error} />

                <div className="mt-6">
                  <NightPicker value={night} onChange={setNight} />
                </div>

                <div role="radiogroup" aria-label="Pass type" className="mt-8 grid gap-4 pt-3 sm:grid-cols-2">
                  {tiers.map((t) => (
                    <TierCard
                      key={t.id}
                      tier={t}
                      as="button"
                      selected={t.id === tierId}
                      onSelect={(x) => {
                        setTierId(x.id);
                        setError(null);
                      }}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {tier && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6">
                        <QuantityStepper
                          value={qty}
                          max={maxQty}
                          onChange={setQty}
                          label="Quantity"
                          hint={
                            tier.available < tier.max_per_order
                              ? `Only ${tier.available} left · admits ${tier.admits * qty}`
                              : `Max ${tier.max_per_order} per order · admits ${tier.admits * qty}`
                          }
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => go(1)}
                    disabled={!tier || !night}
                    className="btn-primary w-full sm:w-auto"
                  >
                    Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.section>
            )}

            {/* STEP 2 — Details */}
            {step === 1 && (
              <motion.section
                key="details"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                aria-labelledby="step-heading"
              >
                <StepHeading ref={headingRef} eyebrow="Step 2 of 3" title="Your details" />
                <form
                  className="glass-strong mt-6 rounded-3xl p-6 sm:p-8"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitDetails();
                  }}
                  noValidate
                >
                  <DetailsForm
                    value={details}
                    errors={visibleErrors}
                    onChange={setDetails}
                    onBlurField={(k) => setTouched((t) => ({ ...t, [k]: true }))}
                  />
                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => go(0)} className="btn-ghost">
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                    </button>
                    <button type="submit" className="btn-primary">
                      Continue to payment <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              </motion.section>
            )}

            {/* STEP 3 — Pay */}
            {step === 2 && tier && (
              <motion.section
                key="pay"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                aria-labelledby="step-heading"
              >
                <StepHeading
                  ref={headingRef}
                  eyebrow="Step 3 of 3"
                  title={checkout ? "Scan & pay" : "Review & pay"}
                />
                {!checkoutReady && (
                  <div
                    role="status"
                    className="mt-5 rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn"
                  >
                    Booking isn&apos;t ready on this server yet. Nothing has been saved.
                  </div>
                )}
                <ErrorBanner message={error} />

                <div className="glass-strong mt-6 rounded-3xl p-6 sm:p-8">
                  {!checkout ? (
                    <>
                      <dl className="grid gap-5 sm:grid-cols-2">
                        <Row label="Pass">
                          {tier.name} × {qty}
                          <span className="block text-sm font-normal text-ink-500">
                            Admits {pluralise(tier.admits * qty, "person", "people")}
                          </span>
                        </Row>
                        <Row label="Name">{details.name}</Row>
                        <Row label="Email">{details.email}</Row>
                        <Row label="Mobile">+91 {normaliseIndianMobile(details.phone) ?? details.phone}</Row>
                        <Row label="Night">
                          {night ? formatEventNight(night) : "—"}
                          <span className="block text-sm font-normal text-ink-500">{EVENT.venue.name}</span>
                        </Row>
                        <Row label="Total">
                          <span className="font-display text-2xl text-brand-600">{formatINR(total)}</span>
                        </Row>
                      </dl>

                      <p className="mt-6 flex items-start gap-2 text-xs text-ink-500">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                        We&apos;ll hold your spots for {EVENT.holdMinutes} minutes while you pay by UPI. Your pass
                        is issued after we confirm the payment — usually the same day.
                      </p>

                      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                        <button type="button" onClick={() => go(1)} className="btn-ghost" disabled={paying !== "idle"}>
                          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Edit details
                        </button>
                        <button
                          type="button"
                          onClick={startPay}
                          disabled={paying !== "idle" || !checkoutReady}
                          className="btn-primary min-w-[220px]"
                          aria-busy={paying !== "idle"}
                        >
                          {paying === "creating" ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Reserving your spots…
                            </>
                          ) : (
                            <>Show UPI QR · {formatINR(total)}</>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <PayQr amountPaise={checkout.amountPaise} bookingId={checkout.bookingId} />
                      <label className="label mt-6" htmlFor="upi-ref">
                        UPI reference <span className="font-normal text-ink-400">(optional)</span>
                      </label>
                      <input
                        id="upi-ref"
                        className="input"
                        inputMode="text"
                        autoComplete="off"
                        placeholder="12-digit UTR / UPI ref"
                        value={upiRef}
                        onChange={(e) => setUpiRef(e.target.value)}
                      />
                      <p className="mt-2 text-xs text-ink-500">
                        Helps us find your payment faster. You can skip this and still tap I&apos;ve paid.
                      </p>
                      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                        <button type="button" onClick={abandonQr} className="btn-ghost" disabled={paying !== "idle"}>
                          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Edit details
                        </button>
                        <button
                          type="button"
                          onClick={declarePaid}
                          disabled={paying !== "idle"}
                          className="btn-primary min-w-[220px]"
                          aria-busy={paying !== "idle"}
                        >
                          {paying === "declaring" ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving…
                            </>
                          ) : (
                            "I've paid"
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* ───────────── Sidebar summary (desktop) ───────────── */}
        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <PriceSummary tier={tier} quantity={qty} night={night} />
        </aside>
      </div>

      {/* ───────────── Sticky mobile bar ───────────── */}
      <div className="glass-strong safe-bottom fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <PriceSummary tier={tier} quantity={qty} night={night} compact />
          {step === 0 && (
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!tier || !night}
              className="btn-primary min-h-11 px-5 text-sm"
            >
              Continue
            </button>
          )}
          {step === 1 && (
            <button type="button" onClick={submitDetails} className="btn-primary min-h-11 px-5 text-sm">
              Continue
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={checkout ? declarePaid : startPay}
              disabled={paying !== "idle" || !checkoutReady}
              className="btn-primary min-h-11 px-5 text-sm"
            >
              {paying !== "idle" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : checkout ? (
                "I've paid"
              ) : (
                `Pay ${formatINR(total)}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Bits ───────────────────────── */

const StepHeading = forwardRef<
  HTMLHeadingElement,
  { eyebrow: string; title: string; children?: React.ReactNode }
>(function StepHeading({ eyebrow, title, children }, ref) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1
          id="step-heading"
          ref={ref}
          tabIndex={-1}
          className="mt-2 font-display text-3xl font-bold text-ink-900 focus:outline-none sm:text-4xl"
        >
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
});

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-ink-900">{children}</dd>
    </div>
  );
}

function ErrorBanner({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-5 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
