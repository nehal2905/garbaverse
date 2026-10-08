import { isAdminRequest } from "@/lib/admin-auth";
import { allBookingsForExport } from "@/lib/admin-data";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection, then quote.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdminRequest())) return fail(401, "Unauthorized.");
  let rows;
  try {
    rows = await allBookingsForExport();
  } catch (err) {
    console.error("[admin:export]", err);
    return fail(500, "Export failed. Try again.");
  }

  const header = [
    "booking_id", "status", "name", "email", "phone", "pass_type", "quantity", "attendees",
    "amount_inr", "payment_id", "order_id", "payment_method", "created_at", "confirmed_at",
    "checked_in_at", "checked_in_by", "email_sent_at", "cancel_reason",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id, r.status, r.name, r.email, r.phone, r.ticket_types?.name ?? r.ticket_type_id,
        r.quantity, r.attendees, (r.amount_paise / 100).toFixed(2), r.razorpay_payment_id,
        r.razorpay_order_id, r.payment_method, r.created_at, r.confirmed_at, r.checked_in_at,
        r.checked_in_by, r.email_sent_at, r.cancel_reason,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  const csv = "\uFEFF" + lines.join("\r\n");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="garbaverse-bookings-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
