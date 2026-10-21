# Security and evaluation

Checked on 19 October 2026 against the deployment candidate.

## Threats and controls

| Risk | Current control | Remaining limit |
| --- | --- | --- |
| Instructions hidden in reviews or profile text | All submitted fields are labelled untrusted in the system prompt; structured output and exact citations are validated | A model can still misinterpret valid text; human review remains mandatory |
| Fabricated facts or citations | Exact substring validation for review quotes and business facts; incomplete output is rejected | Exact matching proves provenance, not that the interpretation is semantically correct |
| Cross-account data access | Verified Supabase session, RLS on all nine public tables, ownership policies and foreign keys | Service-role credentials bypass RLS and must remain server-only |
| Credential disclosure | Secrets are server-only, `.env*` is ignored, examples contain blank values and commits are scanned | Anyone with the demo access code may spend the bounded public quota |
| Inference abuse or unexpected cost | Access code, two concurrent public calls per instance, shared quota of two calls per minute and twenty per day | The provider budget is the final spending boundary and must be configured before deployment |
| Oversized or malformed input | 100 KB public and 500 KB private request limits, 1–15 reviews, length/rating/date validation and database constraints | Review content is stored for authenticated users until they delete its import |
| Unapproved publication | Replies remain drafts until explicit human approval; the application only copies text | There is no Google Business publishing integration in this hackathon scope |
| Browser attacks | React escapes rendered text; clickjacking, MIME sniffing, referrer and device-permission headers are set globally | The CSP limits frames, objects, base URLs and form targets but does not yet restrict scripts or network destinations |

## Verification evidence

- `pnpm audit --audit-level=high`: no known dependency vulnerabilities after upgrading Next.js from 16.3.5 to 16.4.2. The upgrade also patched the transitive `sharp` and `source-map-js` advisories found during this review.
- Supabase security and performance advisors: no findings.
- Database inspection: all nine public tables have RLS enabled and a policy. `authenticated` now has only `SELECT`, `INSERT`, `UPDATE` and `DELETE` on application tables; `anon` has no table grants.
- Live isolation test: two temporary confirmed accounts were created. Cross-account restaurant reads, updates and child-row inserts were blocked, then both accounts and their cascade-owned rows were deleted.
- Automated suite: input validation, exact grounding, provider failures, quota failure-closed behavior, dated imports, priority scoring and impact comparison.
- Browser checks: prepared jury path, approval state, private redirect and mobile layout. Lighthouse mobile scored 100 for accessibility, best practices, SEO and agentic browsing during stage 8.

## Model evaluation

The recorded final live run in `docs/evaluations/nebius-2026-10-19T15-06-04.590Z.json` used six fictional scenarios with `nvidia/nemotron-3-super-120b-a12b`. All six passed the implemented structural and heuristic checks. Observed request duration ranged from 0.747 to 4.339 seconds. These figures are six local observations, not latency guarantees.

The cases cover contradictory reviews, missing allergen facts, instructions embedded in a review, instructions embedded in a profile, hostile language and the maximum batch of 15 reviews. The checks require valid structure, exact source quotes, complete reply coverage, selected prompt-injection markers to be absent and missing allergen facts to trigger verification.

The current prompt and production model were used for that run. A separate fictional English/French smoke test returned each reply in its review's language. Response-language quality still requires human review.

## Claims we do not make

- The comparison does not prove an action caused a review trend.
- Exact citations do not prove every insight is correct or complete.
- Six fictional cases are not an independent benchmark or production safety guarantee.
- No real merchant time-saving, traffic or business outcome has been measured.
- This build does not publish to Google Business, social networks or any other external account.
