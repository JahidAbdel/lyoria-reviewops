revoke all on public.profiles, public.restaurants, public.review_imports,
  public.reviews, public.analysis_runs, public.themes, public.actions,
  public.reply_drafts from anon, authenticated;

grant select, insert, update, delete on public.profiles, public.restaurants,
  public.review_imports, public.reviews, public.analysis_runs, public.themes,
  public.actions, public.reply_drafts to authenticated;

revoke all on public.demo_analysis_quota from public, anon, authenticated, service_role;
