# Gym lifting tracker

React + Vite + Tailwind + Supabase. Three-user 5×5 programme tracker.

---

## 1. Create a Supabase project

1. Go to https://supabase.com and sign up / sign in
2. Click **New project**, give it a name (e.g. `gym-tracker`), choose a region close to you
3. Wait ~2 minutes for it to provision

---

## 2. Create the database tables

In your Supabase project, go to **SQL Editor** and run this:

```sql
-- Sessions table: one row per completed set block
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  exercise    text not null,
  weight      numeric not null,
  sets        int not null,
  reps        int not null,
  volume      numeric not null,
  difficulty  text not null check (difficulty in ('easy', 'neutral', 'hard')),
  created_at  timestamptz default now()
);

-- Working weights table: current working weight per user per exercise
create table working_weights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  exercise    text not null,
  weight      numeric not null,
  updated_at  timestamptz default now(),
  unique (user_id, exercise)
);

-- Enable Row Level Security
alter table sessions enable row level security;
alter table working_weights enable row level security;

-- RLS policies: users can only see and modify their own rows
create policy "Users can manage their own sessions"
  on sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own working weights"
  on working_weights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 3. Get your API keys

In Supabase go to **Project Settings → API**. You need:
- **Project URL** (looks like `https://xxxx.supabase.co`)
- **anon / public key** (the long `eyJ...` string)

Copy `.env.example` to `.env.local` and fill them in:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 4. Run locally

```bash
npm install
npm run dev
```

---

## 5. Invite your three users

In Supabase go to **Authentication → Users → Invite user** and send invites to each email address. They will receive a link to set their password, then can sign in at your deployed URL.

Alternatively users can sign up themselves at the `/` route using the Sign up tab — though you may want to disable public signups once your three users are set up. You can do this in **Authentication → Providers → Email → Disable sign ups**.

---

## 6. Deploy to Netlify

```bash
npm run build
```

Then either:
- **Drag and drop** the `dist/` folder at https://app.netlify.com
- **Or connect a GitHub repo**: build command `npm run build`, publish directory `dist`

In Netlify go to **Site configuration → Environment variables** and add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

In Supabase go to **Authentication → URL Configuration** and add your Netlify URL to **Redirect URLs** (e.g. `https://your-site.netlify.app`).

---

## File structure

```
src/
  lifting.js        # Pure logic: weights, progression rules, programme
  supabase.js       # Supabase client initialisation
  useTracker.js     # Custom hook: all data fetching and saving
  App.jsx           # Root: auth state, layout, routing between views
  LoginScreen.jsx   # Sign in / sign up form
  SessionView.jsx   # Session-local state: diffs and weight overrides
  ExerciseCard.jsx  # Single exercise: warmup, working sets, difficulty
  HistoryView.jsx   # Per-exercise history tables
  main.jsx          # React entry point
  index.css         # Tailwind directives + component classes
```
