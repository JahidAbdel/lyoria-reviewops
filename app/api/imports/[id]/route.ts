import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Import not found." }, { status: 404 });
  const { data, error } = await supabase.from("review_imports").delete().eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not delete import." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Import not found." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
