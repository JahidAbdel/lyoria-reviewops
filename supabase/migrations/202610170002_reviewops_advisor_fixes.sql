create policy "demo_analysis_quota_deny_clients" on public.demo_analysis_quota
for all to anon, authenticated using (false) with check (false);

create index actions_theme_restaurant_idx on public.actions (theme_id, restaurant_id);
create index analysis_runs_import_restaurant_idx on public.analysis_runs (import_id, restaurant_id);
create index reply_drafts_analysis_restaurant_idx on public.reply_drafts (analysis_run_id, restaurant_id);
create index reply_drafts_review_restaurant_idx on public.reply_drafts (review_id, restaurant_id);
create index reviews_import_restaurant_idx on public.reviews (import_id, restaurant_id);
create index themes_analysis_restaurant_idx on public.themes (analysis_run_id, restaurant_id);
