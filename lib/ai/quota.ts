let recentCalls: number[] = [];

function reserveLocally(now = Date.now()) {
  recentCalls = recentCalls.filter(timestamp => now - timestamp < 60_000);
  if (recentCalls.length >= 2) return false;
  recentCalls.push(now);
  return true;
}

export async function reserveDemoAnalysis() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url && !key) return reserveLocally();
  if (!url || !key) throw new Error("demo_quota_unavailable");

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/reserve_demo_analysis`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error("demo_quota_unavailable");
    const allowed: unknown = await response.json();
    if (typeof allowed !== "boolean") throw new Error("demo_quota_unavailable");
    return allowed;
  } catch {
    throw new Error("demo_quota_unavailable");
  }
}
