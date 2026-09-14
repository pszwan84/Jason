import test from 'node:test';
import assert from 'node:assert/strict';
import { inboundLetters, letterStatus, markLetter, pendingLetters } from '../lib/inbox.ts';
import { CATALOG, PEOPLE, PLAYER_ID } from '../lib/catalog.ts';

const myTitles = ['论文创新判断', '实验失败复盘'];
const letters = inboundLetters(CATALOG, PEOPLE, PLAYER_ID, myTitles);

test('inbox is derived from the shelf, not written by hand', () => {
  assert.equal(letters.length, 3);
  for (const letter of letters) {
    const skill = CATALOG.find((s) => s.id === letter.skillId);
    assert.ok(skill, '来信必须绑到货架上真实的卡');
    assert.equal(skill.authorId, letter.fromId);
    assert.equal(skill.title, letter.theirSkillTitle);
    assert.equal(skill.label, '交换后开放', '换卡只对得上交换后开放');
    assert.notEqual(letter.fromId, PLAYER_ID, '不给自己发信');
    assert.ok(letter.note.includes(letter.theirSkillTitle));
    assert.ok(myTitles.includes(letter.wantTitle), '想要的必须是我自己的卡');
  }
  const authors = new Set(letters.map((l) => l.fromId));
  assert.equal(authors.size, letters.length, '一位作者只留一张');
});

test('inbox is deterministic and respects the limit', () => {
  assert.deepEqual(inboundLetters(CATALOG, PEOPLE, PLAYER_ID, myTitles), letters);
  assert.equal(inboundLetters(CATALOG, PEOPLE, PLAYER_ID, myTitles, 1).length, 1);
  assert.deepEqual(inboundLetters(CATALOG, PEOPLE, PLAYER_ID, []), [], '没有自己的卡就不写信');
  assert.deepEqual(inboundLetters(CATALOG, PEOPLE, '', myTitles), []);
});

test('letter marks default to pending, then flip once', () => {
  const first = letters[0].skillId;
  assert.equal(letterStatus([], first), 'pending');
  assert.equal(pendingLetters([], letters), 3);
  const declined = markLetter([], first, 'declined');
  assert.equal(letterStatus(declined, first), 'declined');
  assert.equal(pendingLetters(declined, letters), 2);
  const accepted = markLetter(declined, first, 'accepted');
  assert.equal(letterStatus(accepted, first), 'accepted');
  assert.equal(accepted.length, 1, '同一张卡只留最新状态');
});
