export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface TicketType {
  id: string;
  name: string;
  tagline: string;
  description: string;
  perks: string[];
  price_paise: number;
  admits: number;
  capacity: number;
  sold: number;
  reserved: number;
  max_per_order: number;
  badge: string | null;
  sort_order: number;
  is_active: boolean;
  available: number;
}

export interface Booking {
  id: string;
  ticket_type_id: string;
  quantity: number;
  attendees: number;
  amount_paise: number;
  currency: string;
  name: string;
  email: string;
  phone: string;
  status: BookingStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_method: string | null;
  expires_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  email_sent_at: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
}

/** What the browser is allowed to see about a booking. */
export interface PublicBooking {
  id: string;
  status: BookingStatus;
  name: string;
  email: string;
  quantity: number;
  attendees: number;
  amount_paise: number;
  ticket_type: { id: string; name: string; admits: number };
  expires_at: string;
  confirmed_at: string | null;
  checked_in_at: string | null;
  qr_payload: string | null; // signed; only when confirmed
  access_token: string; // proves the holder may view this booking
}
