import type { Analysis, AnalysisInput } from "./analysis";

export const exampleInput: AnalysisInput = {
  name: "The Garden Table — fictional example",
  facts: "Neighborhood restaurant. Seasonal cuisine. Reservations by phone.",
  reviews: [
    { id: "R1", rating: 5, text: "Delicious seasonal food and a warm welcome." },
    { id: "R2", rating: 3, text: "Very good food, but we waited 40 minutes at lunch." },
    { id: "R3", rating: 2, text: "Long wait at lunch. Do you offer gluten-free dishes?" }
  ]
};
export const exampleAnalysis: Analysis = {
  insights: [
    { title: "Food guests appreciate", kind: "strength", action: "Highlight the seasonal menu in a social post.", evidence: [{ reviewId: "R1", quote: "Delicious seasonal food" }, { reviewId: "R2", quote: "Very good food" }] },
    { title: "Lunch waiting times", kind: "issue", action: "Review the lunch service workflow before promising a specific wait time.", evidence: [{ reviewId: "R2", quote: "waited 40 minutes at lunch" }, { reviewId: "R3", quote: "Long wait at lunch" }] }
  ],
  replies: [
    { reviewId: "R1", text: "Thank you for your review! We are delighted that you enjoyed our seasonal food and the warm welcome.", question: "", factQuotes: ["Seasonal cuisine."] },
    { reviewId: "R2", text: "Thank you for your feedback on the food. We are sorry that the wait affected your lunch experience. Your comment helps us identify what needs attention.", question: "", factQuotes: [] },
    { reviewId: "R3", text: "We are sorry about the wait during lunch. For your question about gluten-free dishes, please contact our team before your visit so we can verify the available options, ingredients, and cross-contamination risks.", question: "Which dishes, ingredients, and cross-contamination precautions can you confirm for a gluten-free request?", factQuotes: [] }
  ]
};

export const exampleImpact = {
  action: "Add a lunch handoff checklist and assign one team member to coordinate peak service.",
  target: "Reduce wait-related mentions by at least 25% in the next review period.",
  baseline: { count: 2, sample: 3, period: "Oct 1–7" },
  after: { count: 1, sample: 6, period: "Oct 15–21" },
  matchedTheme: "Lunch service delays",
  matchConfidence: 0.78
};
