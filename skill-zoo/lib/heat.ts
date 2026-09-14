// 演示热度：只买曝光，不买货。
// heat = 10×likes + 6×comments + 15×completedExchanges
export const HEAT_WEIGHTS = { like: 10, comment: 6, exchange: 15 } as const;

export type HeatSeed = {
  likes: number;
  comments: number;
  exchanges: number;
};

export function heatOf(seed: HeatSeed): number {
  const likes = Math.max(0, seed.likes);
  const comments = Math.max(0, seed.comments);
  const exchanges = Math.max(0, seed.exchanges);
  return HEAT_WEIGHTS.like * likes + HEAT_WEIGHTS.comment * comments + HEAT_WEIGHTS.exchange * exchanges;
}

export function rankByHeat<T>(items: T[], heat: (item: T) => number, id: (item: T) => number): T[] {
  return [...items].sort((a, b) => {
    const diff = heat(b) - heat(a);
    return diff !== 0 ? diff : id(a) - id(b);
  });
}

export function authorHeat<T>(items: T[], authorOf: (item: T) => string, heat: (item: T) => number): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const author = authorOf(item);
    map.set(author, (map.get(author) || 0) + heat(item));
  }
  return map;
}
