export const DIMENSIONS = ['科研', '法律', '设计', '商业', '工程', '教育', '数据', '写作'] as const;
const ALIASES: Record<string, string[]> = {
  科研: ['科研', '论文', '文献', '研究选题', '实验', '方法比较'], 法律: ['法律', '法学', '裁判', '司法'],
  设计: ['设计', '用户', '访谈', '产品'], 商业: ['商业', '经营', '财务', '决策', '市场'],
  工程: ['工程', '系统', '故障', '软件'], 教育: ['教育', '教学', '学习'],
  数据: ['数据', '统计', '量化', '回归', '标注'], 写作: ['写作', '内容', '表达'],
};
export const WEIGHTS = { alpha: 0.5, beta: 0.5, gamma: 0.2 };
export type MatchProfile = { supply: string[]; demand: string[] };
export const LINRAN_PROFILE: MatchProfile = { supply: ['数据', '工程'], demand: ['科研', '商业'] };
export function normalizeTags(tags: string[]): string[] {
  return DIMENSIONS.filter(dimension => tags.some(tag => ALIASES[dimension].some(alias => tag.includes(alias))));
}
function unitVector(tags: string[]): number[] {
  const present = normalizeTags(tags);
  return DIMENSIONS.map(dimension => present.includes(dimension) ? 1 / Math.sqrt(present.length) : 0);
}
const dot = (first: number[], second: number[]) => first.reduce((sum, value, index) => sum + value * second[index], 0);
export function bilateralMatch(mine: MatchProfile, theirs: MatchProfile = LINRAN_PROFILE) {
  const si = unitVector(mine.supply), di = unitVector(mine.demand);
  const sj = unitVector(theirs.supply), dj = unitVector(theirs.demand);
  const outbound = dot(si, dj), inbound = dot(sj, di), overlap = dot(si, sj);
  const raw = WEIGHTS.alpha * outbound + WEIGHTS.beta * inbound - WEIGHTS.gamma * overlap;
  const score = Math.round(100 * Math.max(0, Math.min(1, raw)));
  const iHelp = normalizeTags(mine.supply).filter(tag => normalizeTags(theirs.demand).includes(tag));
  const theyHelp = normalizeTags(theirs.supply).filter(tag => normalizeTags(mine.demand).includes(tag));
  const reason = `${iHelp.length ? `你提供的${iHelp.join('、')}能回应对方需求` : '你暂未覆盖对方的需求'}；${theyHelp.length ? `对方的${theyHelp.join('、')}能回应你的需求` : '对方暂未覆盖你的需求'}。`;
  return { score, raw, outbound, inbound, overlap, iHelp, theyHelp, reason };
}
