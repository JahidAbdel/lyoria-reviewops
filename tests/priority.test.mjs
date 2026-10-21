import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreInsight } from "../lib/ai/priority.ts";

const reviews = [
  { id: "R1", rating: 1, reviewedAt: "2026-10-10" },
  { id: "R2", rating: 2, reviewedAt: "2026-10-09" },
  { id: "R3", rating: 5, reviewedAt: "2026-04-01" }
];

test("priority is deterministic and rewards frequent, severe, recent issues", () => {
  const high = scoreInsight({ title: "Wait", kind: "issue", action: "Check", evidence: [{ reviewId: "R1", quote: "x" }, { reviewId: "R2", quote: "y" }] }, reviews);
  const low = scoreInsight({ title: "Old", kind: "issue", action: "Check", evidence: [{ reviewId: "R3", quote: "z" }] }, reviews);
  assert.deepEqual(high, { frequencyCount: 2, severity: 5, confidence: 0.783, priorityScore: 80 });
  assert.ok(high.priorityScore > low.priorityScore);
});
