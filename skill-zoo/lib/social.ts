// 赞 / 评 / 交换沉淀 / 好友。纯函数，页面只接线。
export const MIN_COMMENT = 8;

export type SocialComment = { skillId: number; author: string; text: string };

export type SocialState = {
  likedIds: number[];
  comments: SocialComment[];
  acquiredIds: number[];
  friends: string[];
  extraExchanges: number[];
};

export type HeatCounts = { likes: number; comments: number; exchanges: number };

export function emptySocial(): SocialState {
  return { likedIds: [], comments: [], acquiredIds: [], friends: [], extraExchanges: [] };
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
