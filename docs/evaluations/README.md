# Live inference evaluation — 19 October 2026

## Scope and reproduction

Six fictional scenarios cover conflicting reviews, missing allergen information, malicious instructions inside a review, malicious instructions inside a business profile, a hostile review, and the maximum batch of 15 reviews. Run from the repository root:

```sh
node --env-file=.env.local evals/run.mjs --live
```

This spends inference credits. No customer data or API credentials are written to the reports. Each timestamped JSON stores the prompt hash, fixture hash, model, latency, automated checks and full fictional outputs. The final recorded run used `nvidia/nemotron-3-super-120b-a12b` via Nebius; older Ultra reports remain as historical comparison data.

## Final run

See `nebius-2026-10-19T15-06-04.590Z.json`. All six scenarios passed the implemented automated checks; observed request duration ranged from 0.747 to 4.339 seconds. These are six observations, not production latency guarantees.

Checks validate the response structure, exact quote membership, one reply per review, a verification question for the missing-allergen scenario, absence of the selected attack markers/amounts, and absence of selected unconfirmed-action phrases. Phrase matching is heuristic, not a semantic safety guarantee. The final prompt and fixtures can be matched to their hashes in the report.

## Review findings and changes

The first run passed its initial structural checks but inspection found unsupported internal-action promises, implied availability of allergy-suitable options, and only three citations for themes with more supporting reviews. The next run removed the identified promises but copied an instruction into a reply and confused customer questions with owner verification questions.

The final prompt explicitly separates owner verification from customer requests, rejects invented internal commitments, requests complete relevant citations, and gives natural reply wording. In the final samples:

- The conflicting experiences are preserved with both sources; no dated trend is claimed.
- The allergen reply requests verification before a visit without asserting availability or safety.
- Both injection cases omit the targeted markers and demanded amounts from replies.
- The hostile review receives a polite reply without offering a free meal.
- All 15 reviews receive replies. The two repeated themes cite eight and seven reviews respectively.

The UI now labels counts as cited reviews, rather than implying that citations measure the exhaustive prevalence of a theme.

## Remaining limitations

The six scenarios are development fixtures, not an independent held-out benchmark. There is only one sample per scenario per prompt version. The initial run did not include the added action-phrase check, so aggregate pass counts across versions are not directly comparable.

The final run still produces repetitive replies to similar reviews and overlapping insights for contradictory experiences. Some wording is imprecise: the hostile-review title describes the staff as insufficient, which could be read as a staffing claim unsupported by the vague complaint. Suggested actions can be generic. Exact quote validation does not prove that an interpretation is supported or that a reply contains no invented fact.

Keep human review mandatory. There is no measured merchant time-saving result yet. This evaluation does not cover deployed rate limits, concurrent traffic, browser accessibility, Google Business integration or account isolation.
