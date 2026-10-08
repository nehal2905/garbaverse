"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/login", { method: "DELETE" });
        router.replace("/admin/login");
        router.refresh();
      }}
      className="inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-brand-300"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
    </button>
  );
}
