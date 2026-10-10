"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  min?: number;
  max: number;
  onChange: (n: number) => void;
  label?: string;
  hint?: string;
}

export function QuantityStepper({ value, min = 1, max, onChange, label = "Quantity", hint }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="glass flex items-center justify-between rounded-2xl p-3 pl-5">
      <div>
        <div id="qty-label" className="font-semibold text-ink-900">
          {label}
        </div>
        {hint && <div className="text-xs text-ink-500">{hint}</div>}
      </div>
      <div className="flex items-center gap-1" role="group" aria-labelledby="qty-label">
        <StepBtn onClick={dec} disabled={value <= min} label="Decrease quantity">
          <Minus className="h-4 w-4" aria-hidden="true" />
        </StepBtn>
        <input
          type="number"
          inputMode="numeric"
          aria-labelledby="qty-label"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
          }}
          className="w-12 bg-transparent text-center font-display text-2xl font-bold text-brand-600 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <StepBtn onClick={inc} disabled={value >= max} label="Increase quantity">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </StepBtn>
      </div>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl border border-brand-700/15 bg-cream-50 text-ink-800 transition-all active:scale-90",
        "hover:border-brand-500/60 hover:bg-brand-500/10 disabled:opacity-30 disabled:hover:border-brand-700/15 disabled:hover:bg-brand-700/5"
      )}
    >
      {children}
    </button>
  );
}
