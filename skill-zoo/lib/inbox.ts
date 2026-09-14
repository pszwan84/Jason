// 入站信：别人拿一张卡来换我的卡。
//
// 为什么是「抽」而不是写死：写死的人在改货架后会跟 JSON 脱节。这里按货架现算，
// 三条规则保证路演能预测：
//   1. 只挑「交换后开放」的卡——完全开放不用换，贡献后开放该走贡献，换卡只对得上交换后开放；
//   2. 一位作者只留一张，来信才像三个不同的人；
//   3. 按热度从高到低取，取不满就少几条，不编人。
import { heatOf } from './heat.ts';

export type InboundStatus = 'pending' | 'accepted' | 'declined';

export type LetterSkill = {
  id: number;
  title: string;
  authorId: string;
  category: string;
  label: string;
  seed: { likes: number; comments: unknown[]; exchanges: number };
};

export type InboundLetter = {
  skillId: number;
  fromId: string;
  fromName: string;
  theirSkillTitle: string;
  theirSkillDomain: string;
  wantTitle: string;
  note: string;
  ago: string;
};

export type LetterMarks = { skillId: number; status: Exclude<InboundStatus, 'pending'> }[];

const AGOS = ['12 分钟前', '3 小时前', '昨天'];
const EXCHANGEABLE = '交换后开放';

export function inboundLetters(
  catalog: LetterSkill[],
  people: { id: string; name: string }[],
  myAuthorId: string,
  myTitles: string[],
  limit = 3,
): InboundLetter[] {
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? id;
  const wanted = [...new Set(myTitles.filter(Boolean))];
  if (!wanted.length || !myAuthorId) return [];
  const seen = new Set<string>();
  const picked: LetterSkill[] = [];
  for (const skill of [...catalog].sort(
    (a, b) => heatOf({ likes: b.seed.likes, comments: b.seed.comments.length, exchanges: b.seed.exchanges })
      - heatOf({ likes: a.seed.likes, comments: a.seed.comments.length, exchanges: a.seed.exchanges })
      || a.id - b.id,
  )) {
    if (skill.authorId === myAuthorId || skill.label !== EXCHANGEABLE || seen.has(skill.authorId)) continue;
    seen.add(skill.authorId);
    picked.push(skill);
    if (picked.length >= limit) break;
  }
  return picked.map((skill, i) => {
    const wantTitle = wanted[i % wanted.length];
    const domain = skill.category.replace('馆', '');
    return {
      skillId: skill.id,
      fromId: skill.authorId,
      fromName: nameOf(skill.authorId),
      theirSkillTitle: skill.title,
      theirSkillDomain: domain,
      wantTitle,
      note: `我在${domain}方向的活儿上卡了很久，你那张《${wantTitle}》正好用得上。我拿《${skill.title}》跟你换，你看行吗？`,
      ago: AGOS[i] ?? '最近',
    };
  });
}

export function letterStatus(marks: LetterMarks, skillId: number): InboundStatus {
  return marks.find((m) => m.skillId === skillId)?.status ?? 'pending';
}

export function markLetter(marks: LetterMarks, skillId: number, status: Exclude<InboundStatus, 'pending'>): LetterMarks {
  return [...marks.filter((m) => m.skillId !== skillId), { skillId, status }];
}

export function pendingLetters(marks: LetterMarks, letters: InboundLetter[]): number {
  return letters.filter((l) => letterStatus(marks, l.skillId) === 'pending').length;
}
