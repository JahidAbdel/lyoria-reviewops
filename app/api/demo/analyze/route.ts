import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { instructions, parseAnalysis, parseInput } from "@/lib/ai/analysis";
import { generateText } from "@/lib/ai/nebius";
import { reserveDemoAnalysis } from "@/lib/ai/quota";

export const runtime = "nodejs";
export const maxDuration = 120;
let active = 0;
export async function POST(request: Request) {
  const code = process.env.LYORIA_DEMO_ACCESS_CODE;
  if (!code) return NextResponse.json({ error: "Live analysis is not configured. You can explore the prepared example." }, { status: 503 });
  const supplied = Buffer.from(request.headers.get("x-lyoria-access") || ""), expected = Buffer.from(code);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ error: "Incorrect access code." }, { status: 401 });
  let input;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing request body");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 100_000) {
        await reader.cancel();
        return NextResponse.json({ error: "Import is too large." }, { status: 413 });
      }
      chunks.push(value);
    }
    input = parseInput(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch {
    return NextResponse.json({ error: "Invalid import: provide 1–15 reviews, rated 1–5, with at most 2,000 characters each." }, { status: 400 });
  }
  if (active >= 2) return NextResponse.json({ error: "Two analyses are already running. Try again shortly." }, { status: 429 });
  if (!process.env.NEBIUS_API_KEY?.trim() || !process.env.NEBIUS_MODEL?.trim().startsWith("nvidia/")) {
    return NextResponse.json({ error: "Configure NEBIUS_API_KEY and NEBIUS_MODEL on the server." }, { status: 503 });
  }
  active++;
  try {
    if (!await reserveDemoAnalysis()) return NextResponse.json({ error: "Demo limit reached. Try again later or explore the prepared example." }, { status: 429 });
    const start = Date.now();
    const result = await generateText({ instructions, prompt: JSON.stringify(input), maxOutputTokens: 5000, json: true });
    return NextResponse.json({ analysis: parseAnalysis(JSON.parse(result.text), input), model: result.model, durationMs: Date.now() - start }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "demo_quota_unavailable"
      ? "Usage metering is unavailable. No AI call was made. You can explore the prepared example."
      : "Analysis unavailable or invalid evidence. No result was kept. Try again." }, { status: 503 });
  } finally { active--; }
}
