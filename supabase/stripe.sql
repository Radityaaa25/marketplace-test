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
