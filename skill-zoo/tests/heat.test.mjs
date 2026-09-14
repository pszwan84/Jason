import test from 'node:test';
import assert from 'node:assert/strict';
import { heatOf, rankByHeat, HEAT_WEIGHTS } from '../lib/heat.ts';
import {
  emptySocial,
  toggleLike,
  addComment,
  completeExchange,
  acquireOpen,
  addFriend,
  canViewFull,
  extraFor,
  MIN_COMMENT,
} from '../lib/social.ts';
import { CATALOG, catalogHeat, PLAYER_ID } from '../lib/catalog.ts';

test('heat formula is 10 likes + 6 comments + 15 exchanges', () => {
  assert.equal(heatOf({ likes: 1, comments: 1, exchanges: 1 }), HEAT_WEIGHTS.like + HEAT_WEIGHTS.comment + HEAT_WEIGHTS.exchange);
  assert.equal(heatOf({ likes: 18, comments: 5, exchanges: 8 }), 10 * 18 + 6 * 5 + 15 * 8);
});

test('catalog has 18 skills across six halls and a shaped leaderboard', () => {
  assert.equal(CATALOG.length, 18);
  const halls = new Set(CATALOG.map((s) => s.category));
  assert.equal(halls.size, 6);
  const heats = CATALOG.map((s) => catalogHeat(s, emptySocial())).sort((a, b) => b - a);
  assert.ok(heats[0] >= 200);
  assert.ok(heats[heats.length - 1] <= 40);
});

test('liking own skill does nothing; liking others is a toggle', () => {
  const mine = CATALOG.find((s) => s.authorId === PLAYER_ID);
  const other = CATALOG.find((s) => s.authorId !== PLAYER_ID);
  assert.ok(mine && other);
  const blocked = toggleLike(emptySocial(), mine.id, mine.authorId, PLAYER_ID);
  assert.deepEqual(blocked.likedIds, []);
  const liked = toggleLike(emptySocial(), other.id, other.authorId, PLAYER_ID);
  assert.deepEqual(liked.likedIds, [other.id]);
  const unliked = toggleLike(liked, other.id, other.authorId, PLAYER_ID);
  assert.deepEqual(unliked.likedIds, []);
});

test('short comments are rejected; a like plus a comment raises heat', () => {
  const cold = CATALOG.find((s) => s.seed.likes + s.seed.comments.length + s.seed.exchanges === 0) || CATALOG[17];
  const before = catalogHeat(cold, emptySocial());
  const rejected = addComment(emptySocial(), cold.id, '王展韬', '太短');
  assert.equal('error' in rejected, true);
  let state = emptySocial();
  state = toggleLike(state, cold.id, cold.authorId, PLAYER_ID);
  const next = addComment(state, cold.id, '王展韬', '我拿去课堂上试了一次。');
  assert.equal('error' in next, false);
  if ('error' in next) return;
  const after = catalogHeat(cold, next);
  assert.equal(after - before, HEAT_WEIGHTS.like + HEAT_WEIGHTS.comment);
  assert.ok(addComment(emptySocial(), cold.id, '王展韬', 'x'.repeat(MIN_COMMENT - 1)).error);
});

test('exchange unlocks gated skills; open skills can be acquired without extra heat', () => {
  const gated = CATALOG.find((s) => s.label === '交换后开放');
  const open = CATALOG.find((s) => s.label === '完全开放');
  assert.ok(gated && open);
  assert.equal(canViewFull(gated.label, gated.id, [], false), false);
  const exchanged = completeExchange(emptySocial(), gated.id);
  assert.equal(canViewFull(gated.label, gated.id, exchanged.acquiredIds, false), true);
  assert.equal(extraFor(exchanged, gated.id).exchanges, 1);
  const taken = acquireOpen(emptySocial(), open.id);
  assert.equal(taken.acquiredIds.includes(open.id), true);
  assert.equal(extraFor(taken, open.id).exchanges, 0);
});

test('friends cannot be added to yourself; ranking is heat then id', () => {
  const self = addFriend(emptySocial(), PLAYER_ID, PLAYER_ID);
  assert.deepEqual(self.friends, []);
  const added = addFriend(emptySocial(), 'lin-ran', PLAYER_ID);
  assert.deepEqual(added.friends, ['lin-ran']);
  const ranked = rankByHeat(CATALOG, (s) => catalogHeat(s, emptySocial()), (s) => s.id);
  for (let i = 1; i < ranked.length; i++) {
    const prev = catalogHeat(ranked[i - 1], emptySocial());
    const cur = catalogHeat(ranked[i], emptySocial());
    assert.ok(prev > cur || (prev === cur && ranked[i - 1].id < ranked[i].id));
  }
});
