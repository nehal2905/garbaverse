import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdminRequest()) redirect("/admin");
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass-strong w-full max-w-sm rounded-3xl p-8">
        <Logo />
        <h1 className="mt-6 font-display text-2xl font-bold text-cream">Organiser login</h1>
        <p className="mt-1 text-sm text-cream/60">Bookings, exports and gate check-in.</p>
        <LoginForm />
      </div>
    </main>
  );
}
