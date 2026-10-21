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

test("matches equivalent timing themes despite different model wording", () => {
  const baseline = "Service speed and timing inconsistencies reported Review takeaway order preparation and communication processes during peak times";
  const temperature = { id: "temperature", title: "Food temperature at pickup needs attention", frequencyCount: 1, comparisonText: "Food temperature at pickup needs attention Assess packaging and handoff timing to maintain food heat" };
  const match = matchTheme(baseline, [
    temperature,
    { id: "timing", title: "Pickup timing generally reliable but occasional delays noted", frequencyCount: 5, comparisonText: "Pickup timing generally reliable but occasional delays noted Review pickup time estimates to improve accuracy during peak periods" }
  ]);
  assert.equal(match?.candidate.id, "timing");
  assert.equal(matchTheme(baseline, [temperature]), null);
});

test("classifies observed movement from review frequencies", () => {
  assert.deepEqual(compareTheme({ baselineCount: 4, baselineSample: 10, afterCount: 1, afterSample: 10 }), { baselineRate: .4, afterRate: .1, deltaPercentagePoints: -30, movement: "improving" });
  assert.equal(compareTheme({ baselineCount: 2, baselineSample: 10, afterCount: 2, afterSample: 11 }).movement, "stable");
  assert.equal(compareTheme({ baselineCount: 1, baselineSample: 10, afterCount: 3, afterSample: 10 }).movement, "worsening");
});
