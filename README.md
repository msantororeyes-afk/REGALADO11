# REGALADO — Next.js + Supabase MVP

This project is a minimal, extendable prototype for REGALADO. It provides posting deals, upvote/downvote, comments, simple auth (Supabase), and a redirect API to wrap affiliate links.

## Features
- User sign up / sign in (Supabase Auth)
- Submit deals (title, description, link, category, image URL)
- Upvote/downvote (stored in votes table)
- Comments on deals
- Trending / newest sorting
- Redirect endpoint (pages/api/redirect/[id]) to record clicks before forwarding to merchant link

## Setup (quick)
1. Create a Supabase project: https://app.supabase.com
2. In Supabase SQL editor, create these tables (SQL below).
3. Add a `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel or .env.local
4. `npm install` and `npm run dev`

### SQL schema (run in Supabase SQL editor)

```sql
-- Users handled by Supabase Auth (no users table required)

create extension if not exists pgcrypto;

create table deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  link text not null,
  affiliate_link text,
  image_url text,
  category text,
  posted_by uuid references auth.users(id),
  created_at timestamptz default now(),
  votes int default 0,
  is_expired boolean default false
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  user_id uuid references auth.users(id),
  vote smallint,
  created_at timestamptz default now(),
  unique (deal_id, user_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  user_id uuid references auth.users(id),
  body text,
  created_at timestamptz default now()
);

create table redirects (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id),
  target text,
  clicks int default 0,
  created_at timestamptz default now()
);
```

## Environment variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> Keep `SUPABASE_SERVICE_ROLE_KEY` secret — used only on server-side (like in /api/redirect).

## Deploy to Vercel
1. Push to GitHub
2. Import project on Vercel
3. Set environment variables in Vercel dashboard
4. Deploy
