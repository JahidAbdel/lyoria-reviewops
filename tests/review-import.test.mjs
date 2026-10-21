import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsvReviews, parseDatedPastedReviews, parseReviewImport } from "../lib/reviews/import.ts";

const restaurant = { name: "Café Test", facts: "Ouvert le midi", replyTone: "warm" };

test("parse dated pasted reviews and derive the import period", () => {
  const reviews = parseDatedPastedReviews("2026-10-02 | 5 | Excellent\n2026-09-29 | 2 | Trop lent");
  const result = parseReviewImport({ restaurant, label: "Septembre", source: "paste", reviews });
  assert.equal(result.periodStart, "2026-09-29");
  assert.equal(result.periodEnd, "2026-10-02");
  assert.equal(result.reviews.length, 2);
});

test("parse CSV fields with commas, quotes and optional identifiers", () => {
  const reviews = parseCsvReviews('id,date,rating,text,language\ng-1,2026-10-01,4,"Bon, mais lent",fr\ng-2,2026-10-02,5,"Très ""bon""",fr');
  assert.deepEqual(reviews[0], { externalId: "g-1", reviewedAt: "2026-10-01", rating: 4, text: "Bon, mais lent", language: "fr" });
  assert.equal(reviews[1].text, 'Très "bon"');
});

test("reject malformed, duplicate and oversized imports", () => {
  assert.throws(() => parseDatedPastedReviews("4 | Sans date"));
  assert.throws(() => parseCsvReviews("date,rating\n2026-10-01,4"), /text/);
  const review = { externalId: "same", reviewedAt: "2026-02-30", rating: 4, text: "Avis" };
  assert.throws(() => parseReviewImport({ restaurant, label: "Test", source: "csv", reviews: [review] }), /date/i);
  assert.throws(() => parseReviewImport({ restaurant, label: "Test", source: "csv", reviews: [{ ...review, reviewedAt: "2026-02-28" }, { ...review, reviewedAt: "2026-02-28" }] }), /Duplicate/);
  assert.throws(() => parseReviewImport({ restaurant, label: "Test", source: "csv", reviews: Array(16).fill(review) }), /15/);
});
