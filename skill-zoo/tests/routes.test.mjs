import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearch, parseSearch, pageOfSlug, slugOf, DEFAULT_PAGE } from '../lib/routes.ts';

test('every page has a stable slug and reads back', () => {
  const pages = ['Skill Zoo', '我的栖息地', '孵化室', '共创实验室', '消息', '我的关系'];
  for (const page of pages) {
    assert.equal(pageOfSlug(slugOf(page)), page);
  }
  assert.equal(pageOfSlug('colab'), '共创实验室');
  assert.equal(slugOf('不存在的页'), 'zoo', '认不出的页回落到商城');
  assert.equal(pageOfSlug('nope'), undefined);
});

test('search round-trips page and skill', () => {
  const search = buildSearch('共创实验室', 3);
  assert.equal(search, '?page=colab&skill=3');
  assert.deepEqual(parseSearch(search), { page: '共创实验室', skill: 3 });
  assert.equal(buildSearch(DEFAULT_PAGE), '?page=zoo');
  assert.deepEqual(parseSearch(buildSearch('消息')), { page: '消息', skill: undefined });
});

test('junk in the URL degrades instead of throwing', () => {
  assert.deepEqual(parseSearch(''), {});
  assert.deepEqual(parseSearch('?page='), {});
  assert.deepEqual(parseSearch('?page=colab&skill=abc'), { page: '共创实验室', skill: undefined });
  assert.deepEqual(parseSearch('?page=colab&skill=-2'), { page: '共创实验室', skill: undefined });
  assert.deepEqual(parseSearch('?skill=0'), {});
  assert.deepEqual(parseSearch('page=zoo'), { page: 'Skill Zoo', skill: undefined }, '没有问号也认');
});
