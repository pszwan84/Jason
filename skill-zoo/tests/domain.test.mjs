import test from 'node:test';
import assert from 'node:assert/strict';
import { distill } from '../lib/distill.ts';
import { loadState, saveState, slimSkills } from '../lib/persist.ts';
import { bilateralMatch } from '../lib/bilateral-match.ts';
import { initialState } from '../lib/fixtures.ts';
import { publishDraft, sendCard, reviewCard, composeProject } from '../lib/domain.ts';

test('an experience produces ordered, editable steps without carrying HTML markup', () => {
  const input = '<p>数据分析时，我们经常对结论是否可靠产生分歧。</p>首先整理原始记录。然后统一样本口径。接着比较不同方法。再检查异常案例。最后验证适用边界。';
  const result = distill(input);
  assert.equal(result.steps.length, 5);
  assert.equal(result.steps[0], '整理原始记录');
  assert.equal(result.steps[4], '验证适用边界');
  assert.ok(result.tags.includes('数据'));
  assert.ok(result.problem.includes('结论是否可靠'));
  assert.ok(!JSON.stringify(result).includes('<p>'));
});

test('bilateral matching rewards cross demand and penalizes homogeneous supply', () => {
  const complementary = bilateralMatch({ supply: ['科研'], demand: ['数据', '商业'] });
  const homogeneous = bilateralMatch({ supply: ['数据'], demand: ['数据'] });
  assert.ok(complementary.score > 0);
  assert.ok(complementary.score >= homogeneous.score);
  assert.match(complementary.reason, /供|需求/);
});

test('exchange review creates a gated project and composition requires evidence', () => {
  const start = initialState();
  const draft = { ...start.draft, title: '用户访谈复盘', kit: { ...start.draft.kit, problem: '把访谈中的个人偏好和真实需求区分开来。', steps: ['记录原话和情境', '分开事实与推测', '建立可比较基线', '用原型验证假设', '记录偏差与反例'], limits: '样本少于三人时不推广结论。', tags: ['用户', '设计'] } };
  const published = publishDraft({ ...start, draft });
  const own = published.pool.find(skill => skill.owner === 'local');
  assert.ok(own);
  const sent = sendCard(published, { skillId: 3, ownSkillId: own.id, who: '王展韬', why: '我正在验证城市研究方法能否用于产品访谈。', offer: '一个真实案例', evidence: '我会提交三段访谈原话、场景和对应的测试结果。' });
  assert.equal(sent.cards[0].status, 'pending');
  const reviewed = reviewCard(sent, sent.cards[0].id, true);
  assert.equal(reviewed.projects.length, 1);
  assert.throws(() => composeProject(reviewed, reviewed.projects[0].id), /前 5 项任务/);
});

test('blank input does not invent evidence or executable steps', () => {
  const result = distill('  \n\t  ');
  assert.equal(result.problem, '');
  assert.deepEqual(result.steps, []);
  assert.deepEqual(result.tags, []);
});

test('skill persistence excludes executable components and unknown fields', () => {
  const icon = () => null;
  const serialized = JSON.stringify(slimSkills([
    { id: 12, title: 'Case review', category: '科研馆', icon, privateNotes: 'Do not persist' },
  ]));
  assert.deepEqual(JSON.parse(serialized), [
    { id: 12, title: 'Case review', category: '科研馆' },
  ]);
});

test('local persistence roundtrips user work and safely reports unavailable storage', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const storage = new Map();
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage } });
  try {
    const state = { draft: '会议复盘', saved: [1, 3], cards: [{ id: 7, status: 'accepted' }] };
    assert.equal(saveState(state), true);
    assert.deepEqual(loadState({ draft: '', saved: [], cards: [] }), state);
    localStorage.getItem = () => '{broken json';
    const fallback = { draft: 'Safe default', saved: [] };
    assert.deepEqual(loadState(fallback), fallback);
    localStorage.setItem = () => { throw new Error('Storage unavailable'); };
    assert.equal(saveState(state), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
