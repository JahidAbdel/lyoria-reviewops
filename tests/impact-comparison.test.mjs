import { test } from "node:test";
import assert from "node:assert/strict";
import { compareTheme, matchTheme, themeSimilarity } from "../lib/impact/comparison.ts";

test("matches a repeated theme deterministically across periods", () => {
  assert.equal(themeSimilarity("Attente longue le midi", "Temps d’attente long le midi"), 0.4);
  const match = matchTheme("Attente longue le midi", [
    { id: "a", title: "Accueil chaleureux", frequencyCount: 3 },
    { id: "b", title: "Temps d’attente long le midi", frequencyCount: 1 }
  ]);
  assert.equal(match?.candidate.id, "b");
});

test("classifies observed movement from review frequencies", () => {
  assert.deepEqual(compareTheme({ baselineCount: 4, baselineSample: 10, afterCount: 1, afterSample: 10 }), { baselineRate: .4, afterRate: .1, deltaPercentagePoints: -30, movement: "improving" });
  assert.equal(compareTheme({ baselineCount: 2, baselineSample: 10, afterCount: 2, afterSample: 11 }).movement, "stable");
  assert.equal(compareTheme({ baselineCount: 1, baselineSample: 10, afterCount: 3, afterSample: 10 }).movement, "worsening");
});
