import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, ScanLine } from "lucide-react";
import { isAdminRequest } from "@/lib/admin-auth";
import { Logo } from "@/components/ui/Logo";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminRequest())) redirect("/admin/login");
  return (
    <div className="min-h-dvh">
      <header className="glass-strong sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <nav aria-label="Admin" className="flex items-center gap-1 text-sm">
              <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-cream/75 hover:bg-white/5 hover:text-brand-300">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Bookings
              </Link>
              <Link href="/admin/scan" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-cream/75 hover:bg-white/5 hover:text-brand-300">
                <ScanLine className="h-4 w-4" aria-hidden="true" /> Check-in
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
