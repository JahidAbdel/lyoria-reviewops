import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cases } from '../evals/cases.mjs';
import { parseInput } from '../lib/ai/analysis.ts';

test('all live-evaluation fixtures satisfy the public input contract', () => {
  for (const scenario of cases) assert.doesNotThrow(() => parseInput(scenario.input), scenario.id);
});
test('evaluation refuses inference unless explicitly requested', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../evals/run.mjs', import.meta.url))], {encoding: 'utf8', env: {PATH: process.env.PATH}});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Pass --live/);
  assert.equal(result.stdout, '');
});
