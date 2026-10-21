import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { status } = await request.json() as { status?: unknown };
  if (!(["planned", "in_progress", "completed", "dismissed"] as unknown[]).includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  const { id } = await context.params;
  const { data, error } = await supabase.from("actions").update({ status: status as string, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update action." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Action not found." }, { status: 404 });
  return NextResponse.json(data);
}
