import test from 'node:test';
import assert from 'node:assert/strict';
import { distill } from '../lib/distill.ts';
import { complementScore, LINRAN } from '../lib/match.ts';

test('an experience produces ordered steps without carrying HTML markup', () => {
  const input = '<p>数据分析时，我们经常对结论是否可靠产生分歧。</p>首先整理原始记录。然后统一样本口径。接着比较不同方法。再检查异常案例。最后验证适用边界。';
  const result = distill(input);
  assert.equal(result.steps.length, 5);
  assert.equal(result.steps[0], '整理原始记录');
  assert.equal(result.steps[4], '验证适用边界');
  assert.ok(result.tags.includes('数据'));
  assert.ok(result.problem.includes('结论是否可靠'));
  assert.ok(!JSON.stringify(result).includes('<p>'));
});

test('distillation is deterministic for the same input', () => {
  const input = '先确认原始记录，然后统一样本口径，接着比较不同方法，再检查异常案例，最后验证适用边界。';
  assert.deepEqual(distill(input), distill(input));
});

test('blank input does not invent evidence or executable steps', () => {
  const result = distill('  \n\t  ');
  assert.equal(result.problem, '');
  assert.deepEqual(result.steps, []);
  assert.deepEqual(result.tags, []);
});

test('matching score stays inside its documented 8-92 range', () => {
  assert.ok(complementScore([]).score >= 8);
  assert.ok(complementScore([]).score <= 92);
  assert.ok(complementScore(['城市研究']).score <= 92);
  assert.ok(complementScore([...LINRAN.tags, '额外一', '额外二', '额外三', '额外四']).score <= 92);
});

test('matching rewards shared ground and reports a reason either way', () => {
  const overlap = complementScore(['城市研究']);
  const none = complementScore(['完全无关的领域']);
  assert.ok(overlap.overlap.length > 0);
  assert.ok(overlap.score > none.score);
  assert.ok(complementScore([]).reason.length > 0);
  assert.ok(overlap.reason.length > 0);
});
