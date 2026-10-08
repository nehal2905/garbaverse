"use client";

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (res: RazorpaySuccess) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string; backdrop_color?: string };
  modal?: { ondismiss?: () => void; escape?: boolean; confirm_close?: boolean; backdropclose?: boolean };
  retry?: { enabled: boolean; max_count?: number };
  timeout?: number;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (res: { error: { description: string; reason: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Could not load payment gateway. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return loading;
}

export function openRazorpay(opts: RazorpayOptions) {
  if (!window.Razorpay) throw new Error("Razorpay not loaded");
  const rzp = new window.Razorpay(opts);
  rzp.open();
  return rzp;
}
