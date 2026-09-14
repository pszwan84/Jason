// 赞 / 评 / 交换沉淀 / 贡献换开放 / 好友。纯函数，页面只接线。
export const MIN_COMMENT = 8;
export const MIN_CONTRIBUTION = 8;

export type SocialComment = { skillId: number; author: string; text: string };

/** 贡献后开放：交一份可验证的贡献，作者通过后开放。
 *  它不加成交热度——成交是换卡，贡献不是换卡，混在一起热度公式就说不清了。 */
export type Contribution = { skillId: number; text: string; status: 'pending' | 'opened' };

export type SocialState = {
  likedIds: number[];
  comments: SocialComment[];
  acquiredIds: number[];
  friends: string[];
  extraExchanges: number[];
  contributions: Contribution[];
};

export type HeatCounts = { likes: number; comments: number; exchanges: number };

export function emptySocial(): SocialState {
  return { likedIds: [], comments: [], acquiredIds: [], friends: [], extraExchanges: [], contributions: [] };
}

export function isOwnSkill(authorId: string, myAuthorId: string): boolean {
  return Boolean(authorId) && authorId === myAuthorId;
}

export function toggleLike(state: SocialState, skillId: number, authorId: string, myAuthorId: string): SocialState {
  if (isOwnSkill(authorId, myAuthorId)) return state;
  const liked = state.likedIds.includes(skillId);
  return {
    ...state,
    likedIds: liked ? state.likedIds.filter((id) => id !== skillId) : [...state.likedIds, skillId],
  };
}

export function addComment(state: SocialState, skillId: number, author: string, text: string): SocialState | { error: string } {
  const trimmed = text.trim();
  if (trimmed.length < MIN_COMMENT) return { error: `评论至少 ${MIN_COMMENT} 个字，空评不计热度` };
  return { ...state, comments: [...state.comments, { skillId, author, text: trimmed }] };
}

export function acquireOpen(state: SocialState, skillId: number): SocialState {
  if (state.acquiredIds.includes(skillId)) return state;
  return { ...state, acquiredIds: [...state.acquiredIds, skillId] };
}

export function completeExchange(state: SocialState, skillId: number): SocialState {
  const acquiredIds = state.acquiredIds.includes(skillId) ? state.acquiredIds : [...state.acquiredIds, skillId];
  const extraExchanges = state.extraExchanges.includes(skillId) ? state.extraExchanges : [...state.extraExchanges, skillId];
  return { ...state, acquiredIds, extraExchanges };
}

export function contributionOf(state: SocialState, skillId: number): Contribution | undefined {
  return state.contributions.find((c) => c.skillId === skillId);
}

/** 交一份反例/交叉测试 → 待作者确认。同一张卡只收一份。 */
export function submitContribution(state: SocialState, skillId: number, text: string): SocialState | { error: string } {
  const trimmed = text.trim();
  if (trimmed.length < MIN_CONTRIBUTION) return { error: `贡献至少 ${MIN_CONTRIBUTION} 个字，写清情境、做法或结果` };
  if (contributionOf(state, skillId)) return { error: '这张卡你已经交过一份贡献了，等作者确认' };
  return { ...state, contributions: [...state.contributions, { skillId, text: trimmed, status: 'pending' }] };
}

/** 作者通过 → 加进我的沉淀（= 开放完整步骤），不计成交热度。 */
export function approveContribution(state: SocialState, skillId: number): SocialState {
  if (!contributionOf(state, skillId)) return state;
  return {
    ...state,
    contributions: state.contributions.map((c) => (c.skillId === skillId ? { ...c, status: 'opened' } : c)),
    acquiredIds: state.acquiredIds.includes(skillId) ? state.acquiredIds : [...state.acquiredIds, skillId],
  };
}

export function addFriend(state: SocialState, authorId: string, myAuthorId: string): SocialState {
  if (!authorId || authorId === myAuthorId) return state;
  if (state.friends.includes(authorId)) return state;
  return { ...state, friends: [...state.friends, authorId] };
}

export function exchangedWith(state: SocialState, authorId: string, skills: { id: number; authorId: string }[]): boolean {
  return skills.some((s) => s.authorId === authorId && (state.acquiredIds.includes(s.id) || state.extraExchanges.includes(s.id)));
}

export function canViewFull(label: string, skillId: number, acquiredIds: number[], isOwner: boolean): boolean {
  if (isOwner || label === '完全开放') return true;
  return acquiredIds.includes(skillId);
}

export function extraFor(state: SocialState, skillId: number): HeatCounts {
  return {
    likes: state.likedIds.includes(skillId) ? 1 : 0,
    comments: state.comments.filter((c) => c.skillId === skillId).length,
    exchanges: state.extraExchanges.includes(skillId) ? 1 : 0,
  };
}
