import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInput, parseAnalysis, parsePastedReviews } from '../lib/ai/analysis.ts';
import { exampleInput, exampleAnalysis } from '../lib/ai/demo.ts';
import { generateText } from '../lib/ai/nebius.ts';

test('fixture references real review excerpts and profile facts', () => {
  assert.deepEqual(parseAnalysis(exampleAnalysis, parseInput(exampleInput)), exampleAnalysis);
  assert.deepEqual(parsePastedReviews('5 | Excellent\n\n2 | Lent'), [{id:'R1',rating:5,text:'Excellent'},{id:'R2',rating:2,text:'Lent'}]);
});
test('reject malformed imports and duplicate IDs', () => {
  assert.throws(() => parsePastedReviews('6 | Bad'));
  assert.throws(() => parseInput({...exampleInput, reviews: []}));
  assert.throws(() => parseInput({...exampleInput, reviews: Array(16).fill(exampleInput.reviews[0])}));
  assert.throws(() => parseInput({...exampleInput, reviews: [exampleInput.reviews[0],exampleInput.reviews[0]]}));
  assert.throws(() => parseInput({...exampleInput, reviews: [{id:'R1', rating:2.5,text:'x'}]}));
});
test('reject fabricated citations, facts and duplicate or missing replies', () => {
  let result = structuredClone(exampleAnalysis);
  result.insights[0].evidence[0].quote = 'invented';
  assert.throws(() => parseAnalysis(result, exampleInput), /Quote/);
  result = structuredClone(exampleAnalysis); result.replies[0].factQuotes = ['Free meals'];
  assert.throws(() => parseAnalysis(result, exampleInput), /Fact/);
  result = structuredClone(exampleAnalysis); result.replies[0].reviewId = 'missing';
  assert.throws(() => parseAnalysis(result, exampleInput));
  result = structuredClone(exampleAnalysis); result.replies[1].reviewId = 'R1';
  assert.throws(() => parseAnalysis(result, exampleInput), /Duplicate/);
  result = structuredClone(exampleAnalysis); result.replies.pop();
  assert.throws(() => parseAnalysis(result, exampleInput));
});
test('Nebius adapter sends server credentials and rejects failed or truncated output', async t => {
  const previous = {...process.env};
  t.after(() => { for (const key of ['NEBIUS_API_KEY','NEBIUS_MODEL','NEBIUS_BASE_URL']) { if(previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; } });
  delete process.env.NEBIUS_API_KEY;
  const request = {instructions:'system',prompt:'data',maxOutputTokens:100,json:true};
  await assert.rejects(generateText(request), /not_configured/);
  process.env.NEBIUS_API_KEY = 'test-only'; process.env.NEBIUS_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
  process.env.NEBIUS_BASE_URL = 'https://example.invalid/v1/';
  const mock = t.mock.method(globalThis,'fetch', async (url, options) => {
    assert.equal(url,'https://example.invalid/v1/chat/completions');
    assert.equal(options.headers.Authorization,'Bearer test-only');
    const body = JSON.parse(options.body);
    assert.equal(body.model,'nvidia/nemotron-3-super-120b-a12b'); assert.equal(body.response_format.type,'json_object');
    assert.equal(body.temperature, 0);
    assert.equal(body.chat_template_kwargs.enable_thinking, false);
    return Response.json({choices:[{finish_reason:'stop',message:{content:'{}'}}]});
  });
  assert.deepEqual(await generateText(request), {text:'{}',model:'nvidia/nemotron-3-super-120b-a12b'});
  mock.mock.mockImplementation(async () => new Response('',{status:429}));
  await assert.rejects(generateText(request), /nebius_http_429/);
  mock.mock.mockImplementation(async () => Response.json({choices:[{finish_reason:'length',message:{content:'partial'}}]}));
  await assert.rejects(generateText(request), /incomplete_model_output/);
});
