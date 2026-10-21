export type ImportedReview = {
  externalId: string;
  rating: number;
  text: string;
  reviewedAt: string;
  language?: string;
};

export type ReviewImport = {
  restaurant: { name: string; facts: string; replyTone: "warm" | "formal" | "concise" };
  label: string;
  source: "example" | "paste" | "csv";
  periodStart: string;
  periodEnd: string;
  reviews: ImportedReview[];
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid object.");
  return value as Record<string, unknown>;
}

function string(value: unknown, max: number, allowEmpty = false) {
  if (typeof value !== "string" || value.length > max || (!allowEmpty && !value.trim())) throw new Error("Invalid text.");
  return value.trim();
}

function date(value: unknown) {
  const result = string(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || new Date(`${result}T00:00:00Z`).toISOString().slice(0, 10) !== result) throw new Error("Invalid date.");
  return result;
}

export function parseReviewImport(value: unknown): ReviewImport {
  const input = record(value), restaurant = record(input.restaurant);
  if (!Array.isArray(input.reviews) || input.reviews.length < 1 || input.reviews.length > 15) throw new Error("Import between 1 and 15 reviews.");
  if (!(["example", "paste", "csv"] as unknown[]).includes(input.source)) throw new Error("Invalid source.");
  if (!(["warm", "formal", "concise"] as unknown[]).includes(restaurant.replyTone)) throw new Error("Invalid reply tone.");
  const reviews = input.reviews.map(value => {
    const review = record(value);
    if (!Number.isInteger(review.rating) || Number(review.rating) < 1 || Number(review.rating) > 5) throw new Error("Invalid rating.");
    const language = review.language === undefined || review.language === "" ? undefined : string(review.language, 12);
    return { externalId: string(review.externalId, 80), rating: Number(review.rating), text: string(review.text, 2000), reviewedAt: date(review.reviewedAt), ...(language ? { language } : {}) };
  });
  if (new Set(reviews.map(review => review.externalId)).size !== reviews.length) throw new Error("Duplicate review identifiers.");
  const dates = reviews.map(review => review.reviewedAt).sort();
  return {
    restaurant: { name: string(restaurant.name, 120), facts: string(restaurant.facts, 6000, true), replyTone: restaurant.replyTone as ReviewImport["restaurant"]["replyTone"] },
    label: string(input.label, 120), source: input.source as ReviewImport["source"],
    periodStart: dates[0], periodEnd: dates.at(-1)!, reviews
  };
}

export function parseDatedPastedReviews(value: string): ImportedReview[] {
  if (value.length > 500_000) throw new Error("Import is too large.");
  return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => {
    const match = line.match(/^(\d{4}-\d{2}-\d{2})\s*\|\s*([1-5])\s*\|\s*(.+)$/);
    if (!match) throw new Error(`Ligne ${index + 1} invalide.`);
    return { externalId: `R${index + 1}`, reviewedAt: match[1], rating: Number(match[2]), text: match[3].trim() };
  });
}

function csvRows(value: string) {
  const rows: string[][] = [[""]];
  let quoted = false;
  for (let index = 0; index < value.length; index++) {
    const character = value[index], row = rows[rows.length - 1], cell = row.length - 1;
    if (character === '"' && quoted && value[index + 1] === '"') { row[cell] += '"'; index++; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) row.push("");
    else if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && value[index + 1] === "\n") index++; rows.push([""]); }
    else row[cell] += character;
  }
  if (quoted) throw new Error("Unclosed CSV quote.");
  return rows.filter(row => row.some(cell => cell.trim()));
}

export function parseCsvReviews(value: string): ImportedReview[] {
  if (value.length > 500_000) throw new Error("Import is too large.");
  const rows = csvRows(value);
  if (rows.length < 2) throw new Error("The CSV contains no reviews.");
  const headers = rows[0].map(header => header.trim().toLowerCase());
  for (const required of ["date", "rating", "text"]) if (!headers.includes(required)) throw new Error(`Colonne ${required} manquante.`);
  return rows.slice(1).map((row, index) => {
    const cell = (name: string) => row[headers.indexOf(name)]?.trim() || "";
    return {
      externalId: cell("id") || `R${index + 1}`,
      reviewedAt: cell("date"), rating: Number(cell("rating")), text: cell("text"),
      ...(cell("language") ? { language: cell("language") } : {})
    };
  });
}
