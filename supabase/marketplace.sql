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
  created_at timestamptz not null default now()
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
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

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
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "marketplace listing photos are public" on storage.objects;
create policy "marketplace listing photos are public"
  on storage.objects for select to public
  using (bucket_id = 'listing-photos');

drop policy if exists "marketplace listing photos can be uploaded anonymously" on storage.objects;
create policy "marketplace listing photos can be uploaded anonymously"
  on storage.objects for insert to anon
  with check (bucket_id = 'listing-photos');
