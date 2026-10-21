export type ThemeCandidate = { id: string; title: string; frequencyCount: number; comparisonText?: string };

const ignored = new Set(["de", "du", "des", "la", "le", "les", "un", "une", "et", "au", "aux", "the", "a", "an", "and", "of", "to", "reported", "review", "improve", "during", "generally", "noted", "needs", "attention", "occasional"]);
const aliases = new Map([
  ["delay", "timing"], ["delays", "timing"], ["late", "timing"], ["slow", "timing"], ["speed", "timing"], ["wait", "timing"], ["waited", "timing"], ["waiting", "timing"], ["readiness", "timing"], ["time", "timing"], ["times", "timing"],
  ["takeaway", "order"], ["pickup", "order"], ["delivery", "order"], ["orders", "order"],
  ["ingredients", "food"], ["pizza", "food"], ["pizzas", "food"], ["heat", "temperature"], ["hot", "temperature"]
]);

function words(value: string) {
  return new Set(value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().match(/[a-z0-9]+/g)?.filter(word => word.length > 2 && !ignored.has(word)).map(word => aliases.get(word) ?? word) ?? []);
}

export function themeSimilarity(left: string, right: string) {
  const a = words(left), b = words(right), union = new Set(Array.from(a).concat(Array.from(b)));
  if (!union.size) return 0;
  return Array.from(a).filter(word => b.has(word)).length / union.size;
}

export function matchTheme(title: string, candidates: ThemeCandidate[]) {
  const ranked = candidates.map(candidate => ({ candidate, similarity: themeSimilarity(title, candidate.comparisonText ?? candidate.title) })).sort((a, b) => b.similarity - a.similarity);
  return ranked[0]?.similarity >= 0.2 ? ranked[0] : null;
}

export function compareTheme(input: { baselineCount: number; baselineSample: number; afterCount: number; afterSample: number }) {
  const baselineRate = input.baselineCount / input.baselineSample, afterRate = input.afterCount / input.afterSample;
  const delta = afterRate - baselineRate;
  return {
    baselineRate, afterRate, deltaPercentagePoints: Math.round(delta * 1000) / 10,
    movement: delta < -0.05 ? "improving" as const : delta > 0.05 ? "worsening" as const : "stable" as const
  };
}
