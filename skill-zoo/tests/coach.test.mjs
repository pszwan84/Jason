import test from 'node:test';
import assert from 'node:assert/strict';
import { coachReply, openingCoach, COACH_MAX } from '../lib/coach.ts';
import { hostAdvance, HOST_QUESTIONS } from '../lib/host.ts';

const kit = {
  title: '论文创新判断',
  problem: '说不清创新在哪',
  steps: ['提取问题', '找基线', '区分贡献', '判断可否验证', '给证据'],
  limits: '理论文不稳定',
  tags: ['论文'],
};

test('coach makes a vague third step checkable and is deterministic', () => {
  const a = coachReply(kit, '第三步太虚了', 0);
  const b = coachReply(kit, '第三步太虚了', 0);
  assert.deepEqual(a, b);
  assert.notEqual(a.kit.steps[2], kit.steps[2]);
  assert.match(a.kit.steps[2], /写出可检查的结果/);
  assert.equal(a.used, 1);
});

test('coach writes counterexample into limits and stops after three turns', () => {
  const one = coachReply(kit, '加一个反例：高度理论化论文会空', 0);
  assert.match(one.kit.limits, /理论化/);
  const two = coachReply(one.kit, '改标题叫证据判断', one.used);
  const three = coachReply(two.kit, '第一步改成只写争议问题', two.used);
  assert.equal(three.used, COACH_MAX);
  const four = coachReply(three.kit, '再改第四步', three.used);
  assert.equal(four.used, COACH_MAX);
  assert.equal(four.kit.steps[3], three.kit.steps[3]);
  assert.match(four.reply, /三轮/);
});

test('opening coach shows the draft card and denies being a model', () => {
  const open = openingCoach(kit);
  assert.equal(open.role, 'ai');
  assert.match(open.text, /论文创新判断/);
  assert.match(open.text, /不是大模型/);
});

test('host advances three questions then allows synthesis', () => {
  let step = 0;
  const first = hostAdvance(step, '我保第三步，她保验证');
  assert.equal(first.step, 1);
  assert.ok(first.reply.includes(HOST_QUESTIONS[1]));
  const second = hostAdvance(first.step, '我出一份失败实验记录');
  const third = hostAdvance(second.step, '贡献后开放');
  assert.equal(third.step, 3);
  assert.match(third.reply, /合成/);
  const empty = hostAdvance(0, '嗯');
  assert.ok(empty.error);
});
