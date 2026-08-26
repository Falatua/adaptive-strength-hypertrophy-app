create table public.forgepath_auth_handoffs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  constraint forgepath_auth_handoffs_expiry check (expires_at > created_at),
  constraint forgepath_auth_handoffs_redemption check (redeemed_at is null or redeemed_at >= created_at)
);

alter table public.forgepath_auth_handoffs enable row level security;
alter table public.forgepath_auth_handoffs force row level security;
revoke all on public.forgepath_auth_handoffs from public, anon, authenticated;

comment on table public.forgepath_auth_handoffs is
  'Server-only, five-minute, single-use bridge from a verified Safari session to the installed ForgePath Home Screen app.';
