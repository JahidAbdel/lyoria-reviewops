import { NextResponse } from "next/server";
import { parseReviewImport } from "@/lib/reviews/import";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase.from("review_imports")
    .select("id,label,source,period_start,period_end,created_at,reviews(count)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Imports unavailable." }, { status: 500 });
  return NextResponse.json({ imports: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing request body.");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 500_000) { await reader.cancel(); return NextResponse.json({ error: "Import is too large." }, { status: 413 }); }
      chunks.push(value);
    }
    const input = parseReviewImport(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const { data, error } = await supabase.rpc("create_review_import", {
      restaurant_name: input.restaurant.name,
      restaurant_facts: input.restaurant.facts,
      restaurant_reply_tone: input.restaurant.replyTone,
      import_label: input.label,
      import_source: input.source,
      imported_reviews: input.reviews
    });
    if (error) throw error;
    return NextResponse.json({ id: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid import: provide 1–15 dated reviews, rated 1–5, with at most 2,000 characters each." }, { status: 400 });
  }
}
