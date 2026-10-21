import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const input = await request.json() as { content?: unknown; confirmed?: unknown };
  const content = typeof input.content === "string" ? input.content.trim() : "";
  if (!content || content.length > 1800) return NextResponse.json({ error: "Invalid reply." }, { status: 400 });
  const { id } = await context.params;
  const { data: draft } = await supabase.from("reply_drafts").select("verification_question").eq("id", id).maybeSingle();
  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  if (draft.verification_question && input.confirmed !== true) return NextResponse.json({ error: "Verify the information before approval." }, { status: 400 });
  const { data, error } = await supabase.from("reply_drafts").update({ content, status: "approved", approved_at: new Date().toISOString() }).eq("id", id).select("id").single();
  if (error) return NextResponse.json({ error: "Could not approve reply." }, { status: 500 });
  return NextResponse.json(data);
}
