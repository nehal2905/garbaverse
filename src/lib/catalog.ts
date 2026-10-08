import type { TicketType } from "./types";

/**
 * Canonical pass catalog. Prices here are display defaults only —
 * Postgres `ticket_types.price_paise` is the source of truth at checkout.
 */
export const CATALOG: TicketType[] = [
  {
    id: "general",
    name: "General Pass",
    tagline: "Dance the night away",
    description:
      "Full access to the garba ground, live dhol & DJ, and the dandiya arena.",
    perks: ["Entry for 1", "Dandiya sticks included", "Access to food court", "Free photo booth"],
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
    tagline: "Two hearts, one circle",
    description: "Everything in General, for two — at a sweeter price.",
    perks: ["Entry for 2", "Dandiya sticks for both", "Access to food court", "Couple photo print"],
    price_paise: 54900,
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
    id: "vip",
    name: "VIP Pass",
    tagline: "Front of the circle",
    description: "Premium front-zone access, lounge seating, and a welcome drink.",
    perks: [
      "Entry for 1",
      "Front-zone wristband",
      "VIP lounge & seating",
      "Welcome drink + snacks",
      "Priority gate",
    ],
    price_paise: 79900,
    admits: 1,
    capacity: 200,
    sold: 0,
    reserved: 0,
    max_per_order: 6,
    badge: "Most popular",
    sort_order: 3,
    is_active: true,
    available: 200,
  },
  {
    id: "squad",
    name: "Squad Pass",
    tagline: "Bring the whole gang",
    description: "Five General entries bundled with a group photo and a reserved meet-up spot.",
    perks: ["Entry for 5", "Dandiya sticks for all", "Reserved squad spot", "Group photo print"],
    price_paise: 129900,
    admits: 5,
    capacity: 100,
    sold: 0,
    reserved: 0,
    max_per_order: 3,
    badge: null,
    sort_order: 4,
    is_active: true,
    available: 100,
  },
];

/**
 * True when real Supabase credentials are present. Accepts both key formats:
 * the legacy service_role JWT ("eyJ…") and the newer secret key ("sb_secret_…").
 */
export function isSupabaseConfigured() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return (
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) &&
    !/x{6,}/.test(url) &&
    (key.startsWith("sb_secret_") || (key.startsWith("eyJ") && key.length > 100))
  );
}
