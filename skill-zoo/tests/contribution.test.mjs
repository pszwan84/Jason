import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptySocial,
  submitContribution,
  approveContribution,
  contributionOf,
  canViewFull,
  extraFor,
  MIN_CONTRIBUTION,
} from '../lib/social.ts';
import { CATALOG, catalogHeat } from '../lib/catalog.ts';

const gated = CATALOG.find((s) => s.label === '贡献后开放');
const text = '我在自己那份材料学数据上试了，口径一周改三次就会假。';

test('contribution opens a 贡献后开放 card without counting as a 成交', () => {
  assert.ok(gated);
  const before = catalogHeat(gated, emptySocial());
  assert.equal(canViewFull(gated.label, gated.id, [], false), false, '没交贡献前不给完整步骤');

  const submitted = submitContribution(emptySocial(), gated.id, text);
  assert.ok(!('error' in submitted));
  if ('error' in submitted) return;
  assert.equal(contributionOf(submitted, gated.id).status, 'pending');
  assert.equal(canViewFull(gated.label, gated.id, submitted.acquiredIds, false), false, '待确认还不算开放');

  const opened = approveContribution(submitted, gated.id);
  assert.equal(contributionOf(opened, gated.id).status, 'opened');
  assert.equal(canViewFull(gated.label, gated.id, opened.acquiredIds, false), true);
  assert.equal(extraFor(opened, gated.id).exchanges, 0, '贡献不是换卡，不加成交热度');
  assert.equal(catalogHeat(gated, opened) - before, 0, '热度公式不被贡献污染');
});

test('contribution rejects short text and duplicates', () => {
  const short = submitContribution(emptySocial(), gated.id, '太短');
  assert.ok('error' in short);
  assert.ok(submitContribution(emptySocial(), gated.id, 'x'.repeat(MIN_CONTRIBUTION - 1)).error);
  const once = submitContribution(emptySocial(), gated.id, text);
  if ('error' in once) return assert.fail('第一次应当收下');
  const twice = submitContribution(once, gated.id, text);
  assert.ok('error' in twice, '同一张卡只收一份贡献');
});

test('approving a contribution nobody submitted is a no-op', () => {
  const state = emptySocial();
  assert.deepEqual(approveContribution(state, gated.id), state);
});
