import { NextResponse } from "next/server";
import { instructions, parseAnalysis, parseInput } from "@/lib/ai/analysis";
import { generateText } from "@/lib/ai/nebius";
import { scoreInsight } from "@/lib/ai/priority";
import { reserveDemoAnalysis } from "@/lib/ai/quota";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  const { data: imported } = await supabase.from("review_imports").select("id,restaurant_id").eq("id", id).maybeSingle();
  if (!imported) return NextResponse.json({ error: "Import not found." }, { status: 404 });
  const [{ data: restaurant }, { data: reviews }] = await Promise.all([
    supabase.from("restaurants").select("name,facts").eq("id", imported.restaurant_id).single(),
    supabase.from("reviews").select("id,external_id,rating,text,reviewed_at").eq("import_id", imported.id).order("reviewed_at")
  ]);
  if (!restaurant || !reviews?.length) return NextResponse.json({ error: "Incomplete import." }, { status: 400 });
  const input = parseInput({ name: restaurant.name, facts: restaurant.facts, reviews: reviews.map(review => ({ id: review.external_id, rating: review.rating, text: review.text })) });
  const { data: run, error: runError } = await supabase.from("analysis_runs").insert({ restaurant_id: imported.restaurant_id, import_id: imported.id, status: "running" }).select("id").single();
  if (runError || !run) return NextResponse.json({ error: "Could not start analysis." }, { status: 500 });
  try {
    if (!await reserveDemoAnalysis()) throw new Error("quota_rejected");
    const started = Date.now(), generated = await generateText({ instructions, prompt: JSON.stringify(input), maxOutputTokens: 5000, json: true });
    const analysis = parseAnalysis(JSON.parse(generated.text), input), duration = Date.now() - started;
    const dated = reviews.map(review => ({ id: review.external_id, rating: review.rating, reviewedAt: review.reviewed_at }));
    const themes = analysis.insights.map(insight => ({ ...insight, ...scoreInsight(insight, dated) }));
    const reviewIds = new Map(reviews.map(review => [review.external_id, review.id]));
    const replies = analysis.replies.map(reply => ({ ...reply, reviewId: reviewIds.get(reply.reviewId)! }));
    const { error } = await supabase.rpc("save_analysis_result", { target_run: run.id, model_name: generated.model, elapsed_ms: duration, analyzed_themes: themes, drafted_replies: replies });
    if (error) throw error;
    return NextResponse.json({ runId: run.id, analysis: { ...analysis, themes }, model: generated.model, durationMs: duration });
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "analysis_failed";
    await supabase.from("analysis_runs").update({ status: "failed", validation_passed: false, error_code: code, completed_at: new Date().toISOString() }).eq("id", run.id);
    return NextResponse.json({ error: code === "quota_rejected" ? "Analysis limit reached. Try again later." : "Analysis unavailable or invalid result. No partial result was saved." }, { status: code === "quota_rejected" ? 429 : 503 });
  }
}
