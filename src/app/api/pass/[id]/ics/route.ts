import { loadConfirmedPass } from "@/lib/pass-access";
import { buildICS } from "@/lib/ics";
import { bookingNights } from "@/lib/event";
import { passLinks } from "@/lib/links";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("t");
  const res = await loadConfirmedPass(id, token);
  if (!res.ok) return fail(res.status, res.message);

  const ics = buildICS({
    bookingId: res.booking.id,
    name: res.booking.name,
    passUrl: passLinks(res.booking).view,
    eventDate: res.booking.event_date,
    eventDates: bookingNights(res.booking),
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="GarbaVerse-${res.booking.id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
