import type { TicketType } from "./types";

/**
 * Canonical pass catalog. Prices here are display defaults only —
 * Postgres `ticket_types.price_paise` is the source of truth at checkout.
 */
export const CATALOG: TicketType[] = [
  {
    id: "general",
    name: "General Pass",
    tagline: "",
    description: "",
    perks: [],
    price_paise: 29900,
    admits: 1,
    capacity: 1500,
    sold: 0,
    reserved: 0,
    max_per_order: 10,
    badge: null,
    sort_order: 1,
    is_active: true,
    available: 1500,
  },
  {
    id: "couple",
    name: "Couple Pass",
    tagline: "",
    description: "",
    perks: [],
    price_paise: 50000,
    admits: 2,
    capacity: 300,
    sold: 0,
    reserved: 0,
    max_per_order: 5,
    badge: "Best value",
    sort_order: 2,
    is_active: true,
    available: 300,
  },
  {
    id: "squad",
    name: "Squad Pass",
    tagline: "",
    description: "",
    perks: [],
    price_paise: 129900,
    admits: 5,
    capacity: 100,
    sold: 0,
    reserved: 0,
    max_per_order: 3,
    badge: null,
    sort_order: 3,
    is_active: true,
    available: 100,
  },
];

/**
 * True when real Supabase credentials are present. Accepts both key formats:
 * the legacy service_role JWT ("eyJ…") and the newer secret key ("sb_secret_…").
 */
/** IDs we still sell. VIP and any retired tier stay out of the shop. */
export function isOnSale(id: string) {
  return CATALOG.some((t) => t.id === id && t.is_active);
}

/** Overlay live availability onto the current catalog (name, price, copy). */
export function listedTiers(rows: TicketType[]): TicketType[] {
  const live = new Map(rows.map((t) => [t.id, t]));
  return CATALOG.filter((t) => t.is_active).map((canonical) => {
    const row = live.get(canonical.id);
    if (!row) return canonical;
    return {
      ...row,
      name: canonical.name,
      tagline: canonical.tagline,
      description: canonical.description,
      perks: canonical.perks,
      price_paise: canonical.price_paise,
      badge: canonical.badge,
      admits: canonical.admits,
      max_per_order: canonical.max_per_order,
      sort_order: canonical.sort_order,
      is_active: true,
    };
  });
}

export function isSupabaseConfigured() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return (
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) &&
    !/x{6,}/.test(url) &&
    (key.startsWith("sb_secret_") || (key.startsWith("eyJ") && key.length > 100))
  );
}
