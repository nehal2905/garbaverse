import { loadConfirmedPass } from "@/lib/pass-access";
import { renderPassPdf } from "@/lib/pdf";
import { signBookingId } from "@/lib/signing";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("t");
  const res = await loadConfirmedPass(id, token);
  if (!res.ok) return fail(res.status, res.message);

  const pdf = await renderPassPdf({
    booking: res.booking,
    tier: res.tier,
    qrPayload: signBookingId(res.booking.id),
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="GarbaVerse-Pass-${res.booking.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
