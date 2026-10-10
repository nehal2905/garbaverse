import Link from "next/link";
import { Nav } from "@/components/layout/Nav";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink-900">Wandered out of the circle</h1>
        <p className="mt-3 text-ink-600">That page doesn&apos;t exist. Let&apos;s get you back to the dance floor.</p>
        <Link href="/" className="btn-primary mt-8">
          Back home
        </Link>
      </main>
    </>
  );
}
