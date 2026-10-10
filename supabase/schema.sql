-- ═══════════════════════════════════════════════════════════════════════════
--  GarbaVerse — Supabase schema
--  Run this whole file once in Supabase → SQL Editor.
--
--  Design notes
--  • Inventory is tracked on ticket_types (capacity / sold / reserved).
--  • Every inventory change happens inside a SECURITY DEFINER function that
--    takes a row lock (FOR UPDATE) → no oversells under concurrency.
--  • Amounts are computed inside create_booking from price_paise → the client
--    can never influence price.
--  • confirm_booking is a state-machine transition; it returns `transitioned`
--    so the app only sends the pass email on the FIRST confirmation.
--  • RLS is enabled on every table. The app talks to Postgres with the service
--    role key from the server only; anon can read ticket availability only.
--  • Lock order is booking row → ticket_types row everywhere. The one path
--    that starts from ticket_types (create_booking) uses SKIP LOCKED on
--    bookings, and expire_bookings is single-flight via an advisory lock —
--    so concurrent checkout / webhook / cron cannot deadlock.
--  • Safe to re-run: every object is create-or-replace / if-not-exists.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type booking_status as enum ('pending', 'confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ── ticket_types ────────────────────────────────────────────────────────────
create table if not exists public.ticket_types (
  id            text primary key,                -- slug, e.g. 'general'
  name          text not null,
  tagline       text not null default '',
  description   text not null default '',
  perks         text[] not null default '{}',
  price_paise   integer not null check (price_paise >= 0),
  admits        integer not null default 1 check (admits > 0),   -- people per unit
  capacity      integer not null check (capacity >= 0),          -- units
  sold          integer not null default 0 check (sold >= 0),
  reserved      integer not null default 0 check (reserved >= 0),
  max_per_order integer not null default 10 check (max_per_order > 0),
  badge         text,                                            -- e.g. 'Most popular'
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── bookings ────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id                   text primary key,                        -- 'GV-7K3M9Q'
  ticket_type_id       text not null references public.ticket_types(id),
  quantity             integer not null check (quantity > 0),
  attendees            integer not null check (attendees > 0),  -- quantity * admits
  amount_paise         integer not null check (amount_paise >= 0),
  currency             text not null default 'INR',
  name                 text not null,
  email                text not null,
  phone                text not null,
  status               booking_status not null default 'pending',
  razorpay_order_id    text unique,
  razorpay_payment_id  text unique,
  payment_method       text,
  expires_at           timestamptz not null,
  confirmed_at         timestamptz,
  cancelled_at         timestamptz,
  cancel_reason        text,
  email_sent_at        timestamptz,
  checked_in_at        timestamptz,
  checked_in_by        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  event_date           date
);

alter table public.bookings add column if not exists event_date date;

create index if not exists bookings_email_idx      on public.bookings (lower(email));
create index if not exists bookings_status_idx     on public.bookings (status, expires_at);
create index if not exists bookings_created_idx    on public.bookings (created_at desc);
create index if not exists bookings_order_idx      on public.bookings (razorpay_order_id);

-- ── webhook_events (idempotency ledger) ─────────────────────────────────────
create table if not exists public.webhook_events (
  id           text primary key,          -- provider event id (x-razorpay-event-id)
  provider     text not null default 'razorpay',
  event        text not null,
  payload      jsonb not null,
  received_at  timestamptz not null default now()
);

-- ── updated_at trigger ──────────────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists ticket_types_updated_at on public.ticket_types;
create trigger ticket_types_updated_at before update on public.ticket_types
  for each row execute function public.set_updated_at();

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- ── Availability view ───────────────────────────────────────────────────────
-- security_invoker: the view runs with the CALLER's rights, so anon readers
-- get ticket_types' RLS (active tiers only) instead of the owner's bypass.
create or replace view public.ticket_availability
with (security_invoker = true) as
select
  id, name, tagline, description, perks, price_paise, admits, capacity,
  sold, reserved, max_per_order, badge, sort_order, is_active,
  greatest(capacity - sold - reserved, 0) as available
from public.ticket_types;

-- ═══════════════════════════════════════════════════════════════════════════
--  Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Release a single pending booking (internal helper, used by several paths).
create or replace function public.release_booking(p_id text, p_reason text default 'expired')
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = p_id for update;
  if not found then return false; end if;
  if b.status <> 'pending' then return false; end if;

  update public.ticket_types
     set reserved = greatest(reserved - b.quantity, 0)
   where id = b.ticket_type_id;

  update public.bookings
     set status = 'cancelled',
         cancelled_at = now(),
         cancel_reason = p_reason
   where id = p_id;

  return true;
end $$;

-- Expire every stale pending hold. Called by cron and lazily by the app.
-- Single-flight: the app calls this on every availability read, so concurrent
-- sweeps would contend for (and could deadlock on) the same tier rows. If a
-- sweep is already running, the others return immediately.
create or replace function public.expire_bookings()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  r record;
  n integer := 0;
begin
  if not pg_try_advisory_xact_lock(hashtext('garbaverse.expire_bookings')) then
    return 0;
  end if;

  for r in
    select id from public.bookings
     where status = 'pending' and expires_at < now()
     order by created_at
     for update skip locked
  loop
    if public.release_booking(r.id, 'expired') then n := n + 1; end if;
  end loop;
  return n;
end $$;

-- Create a pending booking and reserve inventory atomically.
-- Price is computed HERE from ticket_types.price_paise.
create or replace function public.create_booking(
  p_id             text,
  p_ticket_type_id text,
  p_quantity       integer,
  p_name           text,
  p_email          text,
  p_phone          text,
  p_hold_minutes   integer default 10
)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  t public.ticket_types%rowtype;
  b public.bookings%rowtype;
  avail integer;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
  end if;

  -- Lock the tier row so concurrent buyers serialise here.
  select * into t from public.ticket_types where id = p_ticket_type_id for update;
  if not found or not t.is_active then
    raise exception 'TICKET_TYPE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if p_quantity > t.max_per_order then
    raise exception 'QUANTITY_EXCEEDS_LIMIT' using errcode = 'P0003';
  end if;

  -- Free up any expired holds on this tier before counting. We already hold
  -- the tier lock, so SKIP LOCKED: waiting on a booking row that a webhook or
  -- the cron has locked (and which is itself waiting for this tier) would
  -- deadlock. Skipped rows are released by their owner moments later.
  perform public.release_booking(x.id, 'expired')
     from (
       select id from public.bookings
        where ticket_type_id = p_ticket_type_id
          and status = 'pending' and expires_at < now()
        for update skip locked
     ) x;

  select greatest(capacity - sold - reserved, 0) into avail
    from public.ticket_types where id = p_ticket_type_id;

  if avail < p_quantity then
    raise exception 'SOLD_OUT:%', avail using errcode = 'P0004';
  end if;

  update public.ticket_types set reserved = reserved + p_quantity
   where id = p_ticket_type_id;

  insert into public.bookings (
    id, ticket_type_id, quantity, attendees, amount_paise,
    name, email, phone, status, expires_at
  ) values (
    p_id, p_ticket_type_id, p_quantity, p_quantity * t.admits,
    p_quantity * t.price_paise,
    p_name, lower(p_email), p_phone, 'pending',
    now() + make_interval(mins => p_hold_minutes)
  )
  returning * into b;

  return b;
end $$;

-- Confirm a booking after verified payment. Idempotent.
-- Returns transitioned=true only on the first confirmation.
-- If the hold had already expired (late webhook), we still honour the paid
-- booking: it moves to confirmed and increments `sold` directly.
create or replace function public.confirm_booking(
  p_id         text,
  p_payment_id text,
  p_method     text default null
)
returns table (transitioned boolean, booking public.bookings)
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = p_id for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0002';
  end if;

  if b.status = 'confirmed' then
    transitioned := false; booking := b; return next; return;
  end if;

  if b.status = 'pending' then
    update public.ticket_types
       set reserved = greatest(reserved - b.quantity, 0),
           sold     = sold + b.quantity
     where id = b.ticket_type_id;
  else -- cancelled (late payment) → count as sold
    update public.ticket_types
       set sold = sold + b.quantity
     where id = b.ticket_type_id;
  end if;

  update public.bookings
     set status = 'confirmed',
         confirmed_at = now(),
         cancelled_at = null,
         cancel_reason = null,
         razorpay_payment_id = coalesce(razorpay_payment_id, p_payment_id),
         payment_method = coalesce(p_method, payment_method)
   where id = p_id
   returning * into b;

  transitioned := true; booking := b; return next;
end $$;

-- Gate check-in. Rejects duplicates and unpaid passes.
create or replace function public.check_in_booking(p_id text, p_by text default 'gate')
returns table (code text, booking public.bookings)
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = p_id for update;
  if not found then
    code := 'not_found'; booking := null; return next; return;
  end if;
  if b.status <> 'confirmed' then
    code := 'not_confirmed'; booking := b; return next; return;
  end if;
  if b.checked_in_at is not null then
    code := 'already_used'; booking := b; return next; return;
  end if;

  update public.bookings
     set checked_in_at = now(), checked_in_by = p_by
   where id = p_id
   returning * into b;

  code := 'ok'; booking := b; return next;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.ticket_types   enable row level security;
alter table public.bookings       enable row level security;
alter table public.webhook_events enable row level security;

-- Public may read tier availability (no PII in this table).
drop policy if exists "public read ticket types" on public.ticket_types;
create policy "public read ticket types"
  on public.ticket_types for select
  to anon, authenticated
  using (is_active = true);

-- No anon/authenticated policies on bookings or webhook_events → fully private.
-- The server uses the service role, which bypasses RLS.

-- Lock down function execution to the service role.
revoke all on function public.release_booking(text, text)                                  from public, anon, authenticated;
revoke all on function public.expire_bookings()                                             from public, anon, authenticated;
revoke all on function public.create_booking(text, text, integer, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.confirm_booking(text, text, text)                             from public, anon, authenticated;
revoke all on function public.check_in_booking(text, text)                                  from public, anon, authenticated;

grant execute on function public.release_booking(text, text)                                  to service_role;
grant execute on function public.expire_bookings()                                             to service_role;
grant execute on function public.create_booking(text, text, integer, text, text, text, integer) to service_role;
grant execute on function public.confirm_booking(text, text, text)                             to service_role;
grant execute on function public.check_in_booking(text, text)                                  to service_role;

grant select on public.ticket_availability to anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════════════════
--  Seed: GarbaVerse tiers (edit freely)
-- ═══════════════════════════════════════════════════════════════════════════
insert into public.ticket_types
  (id, name, tagline, description, perks, price_paise, admits, capacity, max_per_order, badge, sort_order)
values
  ('general', 'General Pass', '',
   '',
   array[]::text[],
   29900, 1, 1500, 10, null, 1),
  ('couple', 'Couple Pass', '',
   '',
   array[]::text[],
   50000, 2, 300, 5, 'Best value', 2),
  ('squad', 'Squad Pass', '',
   '',
   array[]::text[],
   129900, 5, 100, 3, null, 3)
on conflict (id) do nothing;

update public.ticket_types
  set is_active = false
  where id = 'vip';

update public.ticket_types
  set tagline = '', description = '', perks = array[]::text[],
      price_paise = 50000, badge = 'Best value', sort_order = 2
  where id = 'couple';

update public.ticket_types
  set tagline = '', description = '', perks = array[]::text[]
  where id in ('general', 'squad');
