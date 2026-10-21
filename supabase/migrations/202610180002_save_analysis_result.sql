create function public.save_analysis_result(
  target_run uuid,
  model_name text,
  elapsed_ms integer,
  analyzed_themes jsonb,
  drafted_replies jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  restaurant uuid;
begin
  if elapsed_ms < 0 or char_length(model_name) not between 1 and 200
    or jsonb_typeof(analyzed_themes) <> 'array' or jsonb_array_length(analyzed_themes) > 8
    or jsonb_typeof(drafted_replies) <> 'array' or jsonb_array_length(drafted_replies) not between 1 and 200 then
    raise exception 'invalid_analysis_result';
  end if;

  select restaurant_id into restaurant from public.analysis_runs where id = target_run and status = 'running';
  if restaurant is null then raise exception 'analysis_run_not_found'; end if;

  insert into public.themes (restaurant_id, analysis_run_id, title, kind, suggested_action, evidence, frequency_count, severity, confidence, priority_score)
  select restaurant, target_run, theme ->> 'title', theme ->> 'kind', theme ->> 'action', theme -> 'evidence',
    (theme ->> 'frequencyCount')::integer, (theme ->> 'severity')::smallint,
    (theme ->> 'confidence')::numeric, (theme ->> 'priorityScore')::smallint
  from jsonb_array_elements(analyzed_themes) theme;

  insert into public.reply_drafts (restaurant_id, analysis_run_id, review_id, content, verification_question)
  select restaurant, target_run, (reply ->> 'reviewId')::uuid, reply ->> 'text', coalesce(reply ->> 'question', '')
  from jsonb_array_elements(drafted_replies) reply;

  update public.analysis_runs set status = 'completed', model = model_name, duration_ms = elapsed_ms,
    validation_passed = true, completed_at = now() where id = target_run;
end;
$$;

revoke all on function public.save_analysis_result(uuid, text, integer, jsonb, jsonb) from public, anon;
grant execute on function public.save_analysis_result(uuid, text, integer, jsonb, jsonb) to authenticated;
