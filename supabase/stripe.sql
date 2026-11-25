create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  stripe_account_id text not null unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.sellers
  alter column email set not null,
  alter column stripe_account_id set not null,
  alter column charges_enabled set default false,
  alter column payouts_enabled set default false,
  alter column details_submitted set default false,
  alter column created_at set default now();

alter table public.sellers enable row level security;
revoke all on table public.sellers from anon, authenticated, public;
grant select, insert, update, delete on table public.sellers to service_role;

alter table public.listings
  add column if not exists status text not null default 'available';
alter table public.listings
  add column if not exists sold_at timestamptz;

alter table public.listings
  drop constraint if exists listings_status_check,
  add constraint listings_status_check check (status in ('available', 'sold'));

alter table public.listings
  alter column status set default 'available',
  alter column status set not null;

create index if not exists listings_status_idx
  on public.listings (status);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  seller_email text,
  stripe_account_id text,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  amount_total integer,
  application_fee_amount integer,
  currency text not null default 'usd',
  buyer_email text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'needs_refund', 'expired')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.orders
  add column if not exists listing_id uuid references public.listings(id) on delete set null;
alter table public.orders
  add column if not exists seller_email text,
  add column if not exists stripe_account_id text,
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists amount_total integer,
  add column if not exists application_fee_amount integer,
  add column if not exists currency text not null default 'usd',
  add column if not exists buyer_email text,
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists paid_at timestamptz;

alter table public.orders
  drop constraint if exists orders_status_check,
  add constraint orders_status_check check (
    status in ('pending', 'paid', 'needs_refund', 'expired')
  );

create unique index if not exists orders_stripe_session_id_unique
  on public.orders (stripe_session_id)
  where stripe_session_id is not null;

create index if not exists orders_listing_id_idx
  on public.orders (listing_id);

alter table public.orders enable row level security;
revoke all on table public.orders from anon, authenticated, public;
grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update on table public.listings to service_role;

create or replace function public.marketplace_finalize_order(
  p_order_id uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_amount_total integer,
  p_application_fee_amount integer,
  p_currency text,
  p_buyer_email text,
  p_stripe_account_id text,
  p_paid_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_listing public.listings%rowtype;
begin
  select *
    into v_order
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    return 'not_found';
  end if;

  if v_order.status = 'paid' then
    if v_order.stripe_session_id = p_session_id then
      return 'paid';
    end if;
    return 'already_paid';
  end if;

  if v_order.status in ('needs_refund', 'expired') then
    return v_order.status;
  end if;

  if v_order.stripe_account_id is distinct from p_stripe_account_id
     or v_order.listing_id is null then
    return 'not_found';
  end if;

  select *
    into v_listing
    from public.listings
   where id = v_order.listing_id
   for update;

  if not found then
    return 'not_found';
  end if;

  if v_listing.status = 'sold' then
    update public.orders
       set status = 'needs_refund',
           stripe_session_id = p_session_id,
           stripe_payment_intent_id = p_payment_intent_id,
           amount_total = coalesce(p_amount_total, amount_total),
           application_fee_amount = coalesce(p_application_fee_amount, application_fee_amount),
           currency = coalesce(p_currency, currency),
           buyer_email = coalesce(p_buyer_email, buyer_email),
           stripe_account_id = p_stripe_account_id
     where id = p_order_id;
    return 'needs_refund';
  end if;

  update public.listings
     set status = 'sold',
         sold_at = coalesce(p_paid_at, now())
   where id = v_listing.id
     and status = 'available';

  if not found then
    update public.orders
       set status = 'needs_refund',
           stripe_session_id = p_session_id,
           stripe_payment_intent_id = p_payment_intent_id,
           amount_total = coalesce(p_amount_total, amount_total),
           application_fee_amount = coalesce(p_application_fee_amount, application_fee_amount),
           currency = coalesce(p_currency, currency),
           buyer_email = coalesce(p_buyer_email, buyer_email),
           stripe_account_id = p_stripe_account_id
     where id = p_order_id;
    return 'needs_refund';
  end if;

  update public.orders
     set status = 'paid',
         stripe_session_id = p_session_id,
         stripe_payment_intent_id = p_payment_intent_id,
         amount_total = coalesce(p_amount_total, amount_total),
         application_fee_amount = coalesce(p_application_fee_amount, application_fee_amount),
         currency = coalesce(p_currency, currency),
         buyer_email = coalesce(p_buyer_email, buyer_email),
         stripe_account_id = p_stripe_account_id,
         paid_at = coalesce(p_paid_at, now())
   where id = p_order_id;

  return 'paid';
end;
$$;

revoke all on function public.marketplace_finalize_order(
  uuid, text, text, integer, integer, text, text, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.marketplace_finalize_order(
  uuid, text, text, integer, integer, text, text, text, timestamptz
) to service_role;
