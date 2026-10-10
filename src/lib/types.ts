export type BookingStatus = "pending" | "confirmed" | "cancelled";

export class BookingError extends Error {
  constructor(
    public code:
      | "SOLD_OUT"
      | "TICKET_TYPE_NOT_FOUND"
      | "QUANTITY_EXCEEDS_LIMIT"
      | "INVALID_QUANTITY"
      | "INVALID_EVENT_DATE"
      | "BOOKING_NOT_FOUND"
      | "UNKNOWN",
    message: string,
    public available?: number
  ) {
    super(message);
  }
}

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
  /** YYYY-MM-DD of the night this pass admits. */
  event_date: string;
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
  event_date: string;
  ticket_type: { id: string; name: string; admits: number };
  expires_at: string;
  confirmed_at: string | null;
  checked_in_at: string | null;
  qr_payload: string | null; // signed; only when confirmed
  access_token: string; // proves the holder may view this booking
  payment_method: string | null;
}
