-- Optional Stripe demo seed.
-- Replace the seller_email value below with the lowercase email used in /sell/connect.
-- Listing photos use public placeholder images and do not require a storage upload.
insert into public.listings (
  title,
  description,
  price,
  category,
  seller_email,
  image_url,
  location,
  status
) values
  (
    'Test Camera',
    'A working demo camera for a sandbox Stripe Connect checkout. The seller account must match the seller email below.',
    25.00,
    'Electronics',
    'replace-with-onboarded-seller@example.com',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    'Palo Alto, CA',
    'available'
  ),
  (
    'Test Desk Chair',
    'A demo chair for testing direct-charge checkout and the 10 percent platform fee.',
    40.00,
    'Home & Garden',
    'replace-with-onboarded-seller@example.com',
    'https://images.unsplash.com/photo-1503602642458-232111445657',
    'Palo Alto, CA',
    'available'
  )
on conflict do nothing;
