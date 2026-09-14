import people from '../data/people.json' with { type: 'json' };
import skills from '../data/skills.json' with { type: 'json' };
import { extraFor, type SocialState } from './social.ts';
import { heatOf } from './heat.ts';

export type CatalogPerson = {
  id: string;
  name: string;
  role: string;
  identity: string;
  color: string;
  supply: string[];
  demand: string[];
};

export type SeedComment = { author: string; text: string };

export type CatalogSkill = {
  id: number;
  title: string;
  authorId: string;
  category: string;
  color: string;
  icon: string;
  days: number;
  cases: number;
  tag: string[];
  desc: string;
  update: string;
  label: string;
  problem: string;
  steps: string[];
  limits: string;
  story: string;
  source: string;
  seed: { likes: number; comments: SeedComment[]; exchanges: number };
};

export const PLAYER_ID = 'wang-zhantao';
export const PEOPLE = people as CatalogPerson[];
export const CATALOG = skills as CatalogSkill[];

export function personById(id: string): CatalogPerson | undefined {
  return PEOPLE.find((p) => p.id === id);
}

export function personByName(name: string): CatalogPerson | undefined {
  return PEOPLE.find((p) => p.name === name);
}

export function itemHeat(
  skill: { id: number; seed?: { likes: number; comments: unknown[]; exchanges: number } },
  social: SocialState,
): number {
  const extra = extraFor(social, skill.id);
  const seed = skill.seed ?? { likes: 0, comments: [], exchanges: 0 };
  return heatOf({
    likes: seed.likes + extra.likes,
    comments: seed.comments.length + extra.comments,
    exchanges: seed.exchanges + extra.exchanges,
  });
}

export function catalogHeat(skill: CatalogSkill, social: SocialState): number {
  return itemHeat(skill, social);
}

export function commentsOf(skill: { id: number; seed?: { comments: SeedComment[] } }, social: SocialState): SeedComment[] {
  return [
    ...(skill.seed?.comments ?? []),
    ...social.comments.filter((c) => c.skillId === skill.id).map((c) => ({ author: c.author, text: c.text })),
  ];
}
