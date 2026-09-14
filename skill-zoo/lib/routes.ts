// 深链：把六屏与单张卡映射到 URL，刷新和后退不再回首页。
//
// 约束：必须能同时跑在 Node（测试）和浏览器/Worker（vinext 客户端）里，
// 所以只用 URLSearchParams，不碰 window。
export const DEFAULT_PAGE = 'Skill Zoo';

export const PAGE_SLUGS: Record<string, string> = {
  'Skill Zoo': 'zoo',
  我的栖息地: 'habitat',
  孵化室: 'incubator',
  共创实验室: 'colab',
  消息: 'inbox',
  我的关系: 'graph',
};

const SLUG_PAGES: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_SLUGS).map(([page, slug]) => [slug, page]),
);

export function slugOf(page: string): string {
  return PAGE_SLUGS[page] ?? 'zoo';
}

export function pageOfSlug(slug: string | null | undefined): string | undefined {
  if (!slug) return undefined;
  return SLUG_PAGES[slug];
}

/** 读 `?page=colab&skill=19`；认不出的 slug 与非法 id 一律丢掉，不抛错。 */
export function parseSearch(search: string): { page?: string; skill?: number } {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const page = pageOfSlug(params.get('page'));
  const raw = Number(params.get('skill'));
  const skill = Number.isInteger(raw) && raw > 0 ? raw : undefined;
  return page || skill ? { page, skill } : {};
}

/** 写回 `?page=colab&skill=19`；没有 skill 时不带这个参数。 */
export function buildSearch(page: string, skillId?: number | null): string {
  const params = new URLSearchParams();
  params.set('page', slugOf(page));
  if (skillId) params.set('skill', String(skillId));
  return `?${params.toString()}`;
}
