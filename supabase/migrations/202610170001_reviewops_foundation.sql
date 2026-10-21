create schema if not exists private;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  facts text not null default '' check (char_length(facts) <= 6000),
  reply_tone text not null default 'warm' check (reply_tone in ('warm', 'formal', 'concise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.review_imports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  source text not null check (source in ('example', 'paste', 'csv')),
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  unique (id, restaurant_id),
  check (period_end >= period_start)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  import_id uuid not null,
  external_id text not null check (char_length(external_id) between 1 and 80),
  rating smallint not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 1 and 2000),
  language text check (char_length(language) between 2 and 12),
  reviewed_at date not null,
  created_at timestamptz not null default now(),
  unique (id, restaurant_id),
  unique (import_id, external_id),
  foreign key (import_id, restaurant_id) references public.review_imports(id, restaurant_id) on delete cascade
);

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  import_id uuid not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  model text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  validation_passed boolean,
  error_code text check (char_length(error_code) <= 120),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, restaurant_id),
  foreign key (import_id, restaurant_id) references public.review_imports(id, restaurant_id) on delete cascade
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  analysis_run_id uuid not null,
  title text not null check (char_length(title) between 1 and 160),
  kind text not null check (kind in ('strength', 'issue')),
  suggested_action text not null check (char_length(suggested_action) between 1 and 600),
  evidence jsonb not null check (jsonb_typeof(evidence) = 'array'),
  frequency_count integer not null check (frequency_count >= 1),
  severity smallint not null check (severity between 1 and 5),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  priority_score smallint not null check (priority_score between 0 and 100),
  created_at timestamptz not null default now(),
  unique (id, restaurant_id),
  foreign key (analysis_run_id, restaurant_id) references public.analysis_runs(id, restaurant_id) on delete cascade
);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  theme_id uuid not null,
  title text not null check (char_length(title) between 1 and 200),
  status text not null default 'draft' check (status in ('draft', 'planned', 'in_progress', 'completed', 'dismissed')),
  target_description text not null check (char_length(target_description) between 1 and 500),
  baseline_value numeric,
  target_value numeric,
  starts_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (theme_id, restaurant_id) references public.themes(id, restaurant_id) on delete cascade
);

create table public.reply_drafts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  analysis_run_id uuid not null,
  review_id uuid not null,
  content text not null check (char_length(content) between 1 and 1800),
  verification_question text not null default '' check (char_length(verification_question) <= 600),
  status text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (analysis_run_id, review_id),
  foreign key (analysis_run_id, restaurant_id) references public.analysis_runs(id, restaurant_id) on delete cascade,
  foreign key (review_id, restaurant_id) references public.reviews(id, restaurant_id) on delete cascade
);

create index reviews_restaurant_reviewed_at_idx on public.reviews (restaurant_id, reviewed_at desc);
create index review_imports_restaurant_created_at_idx on public.review_imports (restaurant_id, created_at desc);
create index analysis_runs_restaurant_created_at_idx on public.analysis_runs (restaurant_id, created_at desc);
create index themes_restaurant_priority_idx on public.themes (restaurant_id, priority_score desc);
create index actions_restaurant_status_idx on public.actions (restaurant_id, status);
create index reply_drafts_restaurant_status_idx on public.reply_drafts (restaurant_id, status);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger restaurants_set_updated_at before update on public.restaurants
for each row execute function private.set_updated_at();
create trigger actions_set_updated_at before update on public.actions
for each row execute function private.set_updated_at();
create trigger reply_drafts_set_updated_at before update on public.reply_drafts
for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create function private.owns_restaurant(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurants
    where id = target_restaurant_id and owner_id = (select auth.uid())
  );
$$;

revoke all on function private.owns_restaurant(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.owns_restaurant(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.review_imports enable row level security;
alter table public.reviews enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.themes enable row level security;
alter table public.actions enable row level security;
alter table public.reply_drafts enable row level security;

create policy "profiles_manage_self" on public.profiles
for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "restaurants_manage_own" on public.restaurants
for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "review_imports_manage_own" on public.review_imports
for all to authenticated using ((select private.owns_restaurant(restaurant_id))) with check ((select private.owns_restaurant(restaurant_id)));
create policy "reviews_manage_own" on public.reviews
for all to authenticated using ((select private.owns_restaurant(restaurant_id))) with check ((select private.owns_restaurant(restaurant_id)));
create policy "analysis_runs_manage_own" on public.analysis_runs
for all to authenticated using ((select private.owns_restaurant(restaurant_id))) with check ((select private.owns_restaurant(restaurant_id)));
create policy "themes_manage_own" on public.themes
for all to authenticated using ((select private.owns_restaurant(restaurant_id))) with check ((select private.owns_restaurant(restaurant_id)));
create policy "actions_manage_own" on public.actions
for all to authenticated using ((select private.owns_restaurant(restaurant_id))) with check ((select private.owns_restaurant(restaurant_id)));
create policy "reply_drafts_manage_own" on public.reply_drafts
for all to authenticated using ((select private.owns_restaurant(restaurant_id))) with check ((select private.owns_restaurant(restaurant_id)));

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on public.profiles, public.restaurants, public.review_imports,
  public.reviews, public.analysis_runs, public.themes, public.actions, public.reply_drafts to authenticated;

create table public.demo_analysis_quota (
  id boolean primary key default true check (id),
  day date not null,
  minute timestamptz not null,
  daily_count integer not null default 0 check (daily_count >= 0),
  minute_count integer not null default 0 check (minute_count >= 0)
);
alter table public.demo_analysis_quota enable row level security;
revoke all on public.demo_analysis_quota from public, anon, authenticated, service_role;
insert into public.demo_analysis_quota (id, day, minute)
values (true, (now() at time zone 'UTC')::date, date_trunc('minute', now()));

create function public.reserve_demo_analysis()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_day date := (now() at time zone 'UTC')::date;
  current_minute timestamptz := date_trunc('minute', now());
  reserved boolean;
begin
  update public.demo_analysis_quota
  set day = current_day,
      minute = current_minute,
      daily_count = case when day = current_day then daily_count + 1 else 1 end,
      minute_count = case when minute = current_minute then minute_count + 1 else 1 end
  where id = true
    and (day <> current_day or daily_count < 20)
    and (minute <> current_minute or minute_count < 2)
  returning true into reserved;
  return coalesce(reserved, false);
end;
$$;
revoke all on function public.reserve_demo_analysis() from public, anon, authenticated;
grant execute on function public.reserve_demo_analysis() to service_role;
