import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { FindForm } from "./FindForm";

export const metadata: Metadata = {
  title: "Find my booking",
  description: "Retrieve your GarbaVerse pass with your email and booking ID.",
};

export default async function FindPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <>
      <Nav />
      <main id="main" className="min-h-dvh">
        <div className="mx-auto max-w-md px-4 pb-20 pt-32 sm:px-6">
          <p className="eyebrow text-center">Lost your pass?</p>
          <h1 className="mt-3 text-center font-display text-4xl font-bold text-ink-900">Find my booking</h1>
          <p className="mt-3 text-center text-ink-600">
            Enter the email you booked with and your booking ID (it looks like{" "}
            <span className="font-mono text-brand-600">GV-7K3M9Q</span>, in your confirmation email).
          </p>
          <div className="glass-strong mt-8 rounded-3xl p-6 sm:p-8">
            <FindForm initialId={id} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
