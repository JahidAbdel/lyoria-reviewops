import { NextResponse } from "next/server";
import { compareTheme, matchTheme } from "@/lib/impact/comparison";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  const { data: action } = await supabase.from("actions").select("id,restaurant_id,theme_id,starts_on").eq("id", id).maybeSingle();
  if (!action) return NextResponse.json({ error: "Action not found." }, { status: 404 });
  const { data: baselineTheme } = await supabase.from("themes").select("id,title,kind,suggested_action,frequency_count,analysis_run_id").eq("id", action.theme_id).single();
  if (!baselineTheme) return NextResponse.json({ error: "Baseline finding not found." }, { status: 404 });
  const { data: baselineRun } = await supabase.from("analysis_runs").select("import_id").eq("id", baselineTheme.analysis_run_id).single();
  if (!baselineRun) return NextResponse.json({ error: "Baseline analysis not found." }, { status: 404 });
  const { data: baselineImport } = await supabase.from("review_imports").select("period_start,period_end,reviews(count)").eq("id", baselineRun.import_id).single();
  if (!baselineImport) return NextResponse.json({ error: "Baseline import not found." }, { status: 404 });
  const { data: laterImports } = await supabase.from("review_imports").select("id,label,period_start,period_end,reviews(count)").eq("restaurant_id", action.restaurant_id).gt("period_start", baselineImport.period_end).order("period_start", { ascending: false });
  for (const later of laterImports ?? []) {
    const { data: run } = await supabase.from("analysis_runs").select("id").eq("import_id", later.id).eq("status", "completed").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!run) continue;
    const { data: themes } = await supabase.from("themes").select("id,title,suggested_action,frequency_count").eq("analysis_run_id", run.id).eq("kind", baselineTheme.kind);
    const candidates = (themes ?? []).map(theme => ({ id: theme.id, title: theme.title, frequencyCount: theme.frequency_count, comparisonText: `${theme.title} ${theme.suggested_action}` }));
    const match = matchTheme(`${baselineTheme.title} ${baselineTheme.suggested_action}`, candidates), baselineSample = baselineImport.reviews[0]?.count ?? 0, afterSample = later.reviews[0]?.count ?? 0;
    if (!baselineSample || !afterSample) continue;
    if (candidates.length && !match) return NextResponse.json({ ready: false, message: "Lyoria found no sufficiently similar theme in the new analysis. An automatic comparison would be misleading." });
    const comparison = compareTheme({ baselineCount: baselineTheme.frequency_count, baselineSample, afterCount: match?.candidate.frequencyCount ?? 0, afterSample });
    return NextResponse.json({ ready: true, baseline: { label: "Baseline period", periodStart: baselineImport.period_start, periodEnd: baselineImport.period_end, count: baselineTheme.frequency_count, sample: baselineSample }, after: { label: later.label, periodStart: later.period_start, periodEnd: later.period_end, count: match?.candidate.frequencyCount ?? 0, sample: afterSample }, matchedTheme: match?.candidate.title ?? null, matchConfidence: match?.similarity ?? 0, ...comparison, sampleWarning: baselineSample < 5 || afterSample < 5 ? "Very small sample: treat this result with caution." : "Both sample sizes are shown to help interpret the result.", caveat: "This is a change observed in imported reviews; it does not prove the action caused it." });
  }
  return NextResponse.json({ ready: false, message: "Add and analyze an import dated after the baseline period." });
}
