import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error();
    const body = input as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const target = typeof body.targetDescription === "string" ? body.targetDescription.trim() : "";
    if (!title || title.length > 200 || !target || target.length > 500 || typeof body.baselineValue !== "number" || typeof body.targetValue !== "number") throw new Error();
    const { data: theme } = await supabase.from("themes").select("restaurant_id").eq("id", id).maybeSingle();
    if (!theme) return NextResponse.json({ error: "Finding not found." }, { status: 404 });
    const { data, error } = await supabase.from("actions").insert({ restaurant_id: theme.restaurant_id, theme_id: id, title, target_description: target, baseline_value: body.baselineValue, target_value: body.targetValue, starts_on: new Date().toISOString().slice(0, 10), status: "planned" }).select("id").single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: "Invalid action." }, { status: 400 }); }
}
