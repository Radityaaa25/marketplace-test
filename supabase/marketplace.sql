create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  category text not null check (
    category in (
      'Vehicles',
      'Property Rentals',
      'Electronics',
      'Home & Garden',
      'Clothing',
      'Hobbies',
      'Family',
      'Free Stuff',
      'Other'
    )
  ),
  seller_email text not null,
  image_url text not null,
  location varchar(255) not null default 'Palo Alto, CA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings
  add column if not exists location varchar(255) not null default 'Palo Alto, CA';
alter table public.listings
  add column if not exists updated_at timestamptz not null default now();

update public.listings
set location = 'Palo Alto, CA'
where location is null;

update public.listings
set updated_at = coalesce(created_at, now())
where updated_at is null;

alter table public.listings
  alter column location set default 'Palo Alto, CA',
  alter column location set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null,
  alter column description set not null,
  alter column image_url set not null,
  alter column created_at set not null;

alter table public.listings
  drop constraint if exists listings_price_check,
  add constraint listings_price_check check (price >= 0),
  drop constraint if exists listings_category_check,
  add constraint listings_category_check check (
    category in (
      'Vehicles',
      'Property Rentals',
      'Electronics',
      'Home & Garden',
      'Clothing',
      'Hobbies',
      'Family',
      'Free Stuff',
      'Other'
    )
  );

create index if not exists listings_created_at_idx
  on public.listings (created_at desc);
create index if not exists listings_category_idx
  on public.listings (category);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  seller_email text not null,
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists seller_email text;
alter table public.messages
  add column if not exists buyer_name text not null default 'Buyer';

update public.messages as messages
set seller_email = listings.seller_email
from public.listings as listings
where messages.listing_id = listings.id
  and (messages.seller_email is null or messages.seller_email = '');

alter table public.messages
  alter column listing_id set not null,
  alter column buyer_name set not null,
  alter column seller_email set not null;

alter table public.messages
  drop constraint if exists messages_message_check,
  add constraint messages_message_check
    check (char_length(message) between 1 and 1000);

create index if not exists messages_listing_id_idx
  on public.messages (listing_id);

create or replace function public.marketplace_update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marketplace_listings_updated_at on public.listings;
create trigger marketplace_listings_updated_at
  before update on public.listings
  for each row
  execute function public.marketplace_update_updated_at_column();

alter table public.listings enable row level security;
alter table public.messages enable row level security;

revoke all on table public.listings from anon, authenticated, public;
revoke all on table public.messages from anon, authenticated, public;
grant select, insert on table public.listings to anon;
grant insert on table public.messages to anon;

drop policy if exists "marketplace listings are public" on public.listings;
create policy "marketplace listings are public"
  on public.listings for select to anon
  using (true);

drop policy if exists "marketplace listings can be created anonymously" on public.listings;
create policy "marketplace listings can be created anonymously"
  on public.listings for insert to anon
  with check (true);

drop policy if exists "marketplace messages can be sent anonymously" on public.messages;
create policy "marketplace messages can be sent anonymously"
  on public.messages for insert to anon
  with check (true);

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

drop policy if exists "marketplace listing images are public" on storage.objects;
create policy "marketplace listing images are public"
  on storage.objects for select to public
  using (bucket_id = 'listing-images');

drop policy if exists "marketplace listing images can be uploaded anonymously" on storage.objects;
create policy "marketplace listing images can be uploaded anonymously"
  on storage.objects for insert to anon
  with check (bucket_id = 'listing-images');
