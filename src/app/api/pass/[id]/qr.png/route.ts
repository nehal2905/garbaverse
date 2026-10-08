import { loadConfirmedPass } from "@/lib/pass-access";
import { qrPngBuffer } from "@/lib/qr";
import { signBookingId } from "@/lib/signing";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Hosted QR image for the email (Gmail strips data: URIs). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("t");
  const res = await loadConfirmedPass(id, token);
  if (!res.ok) return fail(res.status, res.message);

  const png = await qrPngBuffer(signBookingId(res.booking.id), 600);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
