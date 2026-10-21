import type { Insight } from "./analysis";

type DatedReview = { id: string; rating: number; reviewedAt: string };

export function scoreInsight(insight: Insight, reviews: DatedReview[]) {
  const cited = insight.evidence.map(evidence => reviews.find(review => review.id === evidence.reviewId)).filter((review): review is DatedReview => Boolean(review));
  const newest = Math.max(...reviews.map(review => Date.parse(`${review.reviewedAt}T00:00:00Z`)));
  const frequency = cited.length / reviews.length;
  const severity = insight.kind === "issue" ? cited.reduce((sum, review) => sum + 6 - review.rating, 0) / cited.length : cited.reduce((sum, review) => sum + review.rating, 0) / cited.length;
  const recency = cited.reduce((sum, review) => sum + Math.max(0, 1 - (newest - Date.parse(`${review.reviewedAt}T00:00:00Z`)) / 15_552_000_000), 0) / cited.length;
  return {
    frequencyCount: cited.length,
    severity: Math.max(1, Math.min(5, Math.round(severity))),
    confidence: Math.min(0.99, Number((0.45 + frequency * 0.5).toFixed(3))),
    priorityScore: Math.round(100 * (frequency * 0.5 + (severity / 5) * 0.35 + recency * 0.15))
  };
}
