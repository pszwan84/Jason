'use client';
import { useSyncExternalStore } from 'react';
export const PAGES = { explore: 'Skill Zoo', habitat: '我的栖息地', incubator: '孵化室', colab: '共创实验室', messages: '消息', connections: '我的关系' };
export type PageKey = keyof typeof PAGES;
export function parseLocation(search: string) {
  const params = new URLSearchParams(search);
  const requested = params.get('page') ?? 'explore';
  const page: PageKey = requested in PAGES ? requested as PageKey : 'explore';
  const id = Number(params.get('skill'));
  const skillId = Number.isSafeInteger(id) && id > 0 ? id : null;
  return { page, skillId };
}
function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener('zoo:navigate', listener);
  return () => { window.removeEventListener('popstate', listener); window.removeEventListener('zoo:navigate', listener); };
}
export function useLocation() {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => '');
  return parseLocation(search);
}
export function navigate(page: PageKey, skillId?: number | null, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  if (skillId) url.searchParams.set('skill', String(skillId)); else url.searchParams.delete('skill');
  if (url.href === window.location.href) return;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
  window.dispatchEvent(new Event('zoo:navigate'));
  if (!skillId) window.scrollTo({ top: 0, behavior: 'instant' });
}
