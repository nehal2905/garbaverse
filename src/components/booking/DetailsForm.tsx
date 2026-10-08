"use client";

import { cn, normaliseIndianMobile } from "@/lib/utils";

export interface Details {
  name: string;
  email: string;
  phone: string;
  agree: boolean;
}

export type DetailsErrors = Partial<Record<keyof Details, string>>;

export function validateDetails(d: Details): DetailsErrors {
  const e: DetailsErrors = {};
  if (d.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = "Enter a valid email — your pass goes here.";
  if (!normaliseIndianMobile(d.phone)) e.phone = "Enter a valid 10-digit Indian mobile number.";
  if (!d.agree) e.agree = "Please accept the terms to continue.";
  return e;
}

interface Props {
  value: Details;
  errors: DetailsErrors;
  onChange: (d: Details) => void;
  onBlurField: (k: keyof Details) => void;
}

export function DetailsForm({ value, errors, onChange, onBlurField }: Props) {
  const set = (k: keyof Details, v: string | boolean) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      <Field id="name" label="Full name" error={errors.name} hint="As it should appear on the pass">
        <input
          id="name"
          name="name"
          autoComplete="name"
          className={cn("input", errors.name && "border-danger focus:border-danger focus:ring-danger/30")}
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={() => onBlurField("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : "name-hint"}
          placeholder="Ananya Reddy"
          required
        />
      </Field>

      <Field id="email" label="Email" error={errors.email} hint="Your QR pass and PDF will be sent here">
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={cn("input", errors.email && "border-danger focus:border-danger focus:ring-danger/30")}
          value={value.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={() => onBlurField("email")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : "email-hint"}
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field id="phone" label="Mobile number" error={errors.phone} hint="For gate support on the day">
        <div className="flex">
          <span className="inline-flex items-center rounded-l-2xl border border-r-0 border-white/15 bg-white/5 px-3.5 text-sm text-cream/70">
            +91
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className={cn("input rounded-l-none", errors.phone && "border-danger focus:border-danger focus:ring-danger/30")}
            value={value.phone}
            onChange={(e) => set("phone", e.target.value.replace(/[^\d\s+-]/g, ""))}
            onBlur={() => onBlurField("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
            placeholder="98765 43210"
            required
          />
        </div>
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-cream/75">
          <input
            type="checkbox"
            name="agree"
            checked={value.agree}
            onChange={(e) => set("agree", e.target.checked)}
            onBlur={() => onBlurField("agree")}
            aria-invalid={Boolean(errors.agree)}
            aria-describedby={errors.agree ? "agree-error" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/30 bg-ink-900 text-brand-400 accent-brand-400 focus:ring-brand-400"
          />
          <span>
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener" className="text-brand-300 underline underline-offset-2">
              terms, entry rules and no-refund policy
            </a>
            .
          </span>
        </label>
        {errors.agree && (
          <p id="agree-error" role="alert" className="mt-1.5 text-sm text-danger">
            {errors.agree}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-cream/45">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
