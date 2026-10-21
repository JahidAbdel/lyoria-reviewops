import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { instructions, parseInput, parseAnalysis } from '../lib/ai/analysis.ts';
import { generateText } from '../lib/ai/nebius.ts';
import { cases } from './cases.mjs';

// Live evaluation is explicit: it spends inference credits on fictional fixtures only.
if (!process.argv.includes('--live')) {
  console.error('Pass --live to run six paid inference requests using fictional fixtures.');
  process.exit(1);
}
const results = [];
for (const scenario of cases) {
  const started = Date.now();
  try {
    const input = parseInput(scenario.input);
    const result = await generateText({ instructions, prompt: JSON.stringify(input), maxOutputTokens: 5000, json: true });
    const analysis = parseAnalysis(JSON.parse(result.text), input);
    const checks = { schemaAndSources: true, oneReplyPerReview: analysis.replies.length === input.reviews.length };
    if (scenario.requiresQuestion) checks.missingFactsFlagged = scenario.requiresQuestion.every(id => analysis.replies.find(reply => reply.reviewId === id)?.question.trim());
    checks.noUnconfirmedActionPhrase = !analysis.replies.some(reply => /nous (allons|avons corrigé|transmettons)/i.test(reply.text));
    if (scenario.forbidden) checks.injectionMarkersAbsent = scenario.forbidden.every(marker => !analysis.replies.some(reply => reply.text.includes(marker)));
    results.push({ id: scenario.id, model: result.model, durationMs: Date.now() - started, passed: Object.values(checks).every(Boolean), checks, manualCheck: scenario.manualCheck, analysis });
  } catch (error) {
    results.push({ id: scenario.id, durationMs: Date.now() - started, passed: false, error: error.message });
  }
  const latest = results.at(-1);
  console.log(`${latest.passed ? 'PASS' : 'FAIL'} ${latest.id} (${latest.durationMs} ms)`);
}
const report = {
  date: new Date().toISOString(),
  promptSha256: createHash('sha256').update(instructions).digest('hex'),
  fixturesSha256: createHash('sha256').update(JSON.stringify(cases)).digest('hex'),
  note: 'One sample per scenario. Automated checks do not prove semantic correctness or general prompt-injection resistance. Manual review required.',
  passed: results.filter(result => result.passed).length, total: results.length, results
};
const directory = new URL('../docs/evaluations/', import.meta.url);
await mkdir(directory, { recursive: true });
const destination = new URL(`nebius-${report.date.replaceAll(':', '-')}.json`, directory);
await writeFile(destination, JSON.stringify(report, null, 2) + '\n');
console.log(`Report: ${fileURLToPath(destination)}`);
if (report.passed !== report.total) process.exitCode = 1;
