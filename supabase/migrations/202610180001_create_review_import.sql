create function public.create_review_import(
  restaurant_name text,
  restaurant_facts text,
  restaurant_reply_tone text,
  import_label text,
  import_source text,
  imported_reviews jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  owner uuid := auth.uid();
  restaurant uuid;
  created_import uuid;
begin
  if owner is null then raise exception 'authentication_required'; end if;
  if char_length(trim(restaurant_name)) not between 1 and 120
    or char_length(restaurant_facts) > 6000
    or restaurant_reply_tone not in ('warm', 'formal', 'concise')
    or char_length(trim(import_label)) not between 1 and 120
    or import_source not in ('example', 'paste', 'csv') then
    raise exception 'invalid_import';
  end if;
  if jsonb_typeof(imported_reviews) <> 'array' or jsonb_array_length(imported_reviews) not between 1 and 15 then
    raise exception 'invalid_review_count';
  end if;
  if exists (
    select 1 from jsonb_array_elements(imported_reviews) review
    where jsonb_typeof(review) <> 'object'
      or char_length(trim(review ->> 'externalId')) not between 1 and 80
      or coalesce(review ->> 'rating', '') !~ '^[1-5]$'
      or char_length(trim(review ->> 'text')) not between 1 and 2000
      or coalesce(review ->> 'reviewedAt', '') !~ '^\d{4}-\d{2}-\d{2}$'
      or char_length(coalesce(review ->> 'language', '')) > 12
  ) or exists (
    select 1 from jsonb_array_elements(imported_reviews) review
    group by review ->> 'externalId' having count(*) > 1
  ) then raise exception 'invalid_reviews'; end if;

  insert into public.restaurants (owner_id, name, facts, reply_tone)
  values (owner, trim(restaurant_name), restaurant_facts, restaurant_reply_tone)
  on conflict (owner_id) do update set
    name = excluded.name, facts = excluded.facts, reply_tone = excluded.reply_tone
  returning id into restaurant;

  insert into public.review_imports (restaurant_id, label, source, period_start, period_end)
  select restaurant, trim(import_label), import_source,
    min((review ->> 'reviewedAt')::date), max((review ->> 'reviewedAt')::date)
  from jsonb_array_elements(imported_reviews) review
  returning id into created_import;

  insert into public.reviews (restaurant_id, import_id, external_id, rating, text, language, reviewed_at)
  select restaurant, created_import, trim(review ->> 'externalId'), (review ->> 'rating')::smallint,
    trim(review ->> 'text'), nullif(trim(review ->> 'language'), ''), (review ->> 'reviewedAt')::date
  from jsonb_array_elements(imported_reviews) review;

  return created_import;
end;
$$;

revoke all on function public.create_review_import(text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.create_review_import(text, text, text, text, text, jsonb) to authenticated;
