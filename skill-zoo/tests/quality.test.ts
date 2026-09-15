import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skillQuality } from '../lib/platform/skills.ts';
import { emptySkill, type Skill } from '../lib/platform/types.ts';

const skill: Skill = {
  id: 'skill', owner_id: 'owner', title: '方法', category: '科研', tags: '',
  body: JSON.stringify({...emptySkill, title: '方法', example: '一次真实案例'}),
  status: 'published', revision: 2, created: 1, updated: 2, author: '作者', favorite: 0,
};

test('quality summary is transparent and deterministic', () => {
  const quality = skillQuality(skill, JSON.parse(skill.body), {
    feedback: 3, cases: 2, helpful: 2, unfit: 1, versions: 2, contributors: 1,
  });
  assert.equal(quality.score, 85);
  assert.equal(quality.label, '多人验证');
  assert.equal(quality.confidence, '高');
  assert.equal(quality.sourceVerified, false);
  assert.equal(quality.caseCount, 2);
  assert.match(quality.source, /尚未经平台独立核验/);
  assert.ok(quality.signals.some(signal => signal.includes('真实案例')));
});

test('unverified and empty methods remain clearly marked', () => {
  const draft = {...skill, status: 'draft' as const, body: JSON.stringify({...emptySkill, title: '草稿'})};
  const quality = skillQuality(draft, JSON.parse(draft.body), {
    feedback: 0, cases: 0, helpful: 0, unfit: 0, versions: 0, contributors: 0,
  });
  assert.equal(quality.score, 0);
  assert.equal(quality.label, '待验证');
  assert.equal(quality.confidence, '低');
  assert.equal(quality.sourceVerified, false);
  assert.match(quality.signals[0], /尚未提供真实案例/);
});
