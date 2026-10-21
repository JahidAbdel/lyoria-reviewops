import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  const { data: imported } = await supabase.from("review_imports").select("id").eq("id", id).maybeSingle();
  if (!imported) return NextResponse.json({ error: "Import not found." }, { status: 404 });
  const { data: run } = await supabase.from("analysis_runs").select("id,model,duration_ms,created_at").eq("import_id", id).eq("status", "completed").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!run) return NextResponse.json({ error: "No completed analysis found." }, { status: 404 });
  const [{ data: themes }, { data: replies }] = await Promise.all([
    supabase.from("themes").select("id,title,kind,suggested_action,evidence,frequency_count,severity,confidence,priority_score,actions(id,title,status,target_description,baseline_value,target_value,starts_on)").eq("analysis_run_id", run.id).order("priority_score", { ascending: false }),
    supabase.from("reply_drafts").select("id,content,verification_question,status,review_id,reviews(external_id,rating,text)").eq("analysis_run_id", run.id)
  ]);
  return NextResponse.json({ run, themes: themes ?? [], replies: replies ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
