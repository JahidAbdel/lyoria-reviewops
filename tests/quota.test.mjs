import { test } from "node:test";
import assert from "node:assert/strict";
import { reserveDemoAnalysis } from "../lib/ai/quota.ts";

test("shared quota accepts only a boolean RPC result and fails closed", async t => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SECRET_KEY;
  t.after(() => {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SECRET_KEY; else process.env.SUPABASE_SECRET_KEY = previousKey;
  });
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  assert.equal(await reserveDemoAnalysis(), true);
  assert.equal(await reserveDemoAnalysis(), true);
  assert.equal(await reserveDemoAnalysis(), false);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.invalid";
  process.env.SUPABASE_SECRET_KEY = "test-secret";
  const mock = t.mock.method(globalThis, "fetch", async () => Response.json(true));
  assert.equal(await reserveDemoAnalysis(), true);
  mock.mock.mockImplementation(async () => Response.json({ allowed: true }));
  await assert.rejects(reserveDemoAnalysis(), /quota_unavailable/);
});
