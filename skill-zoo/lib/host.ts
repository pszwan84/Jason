// 共创假主持人：三问推进，不是聊天模型。
export const HOST_QUESTIONS = [
  '两张卡各自保哪一步、可以扔掉哪一步？',
  '谁出第一个反例？用一句话写下场景。',
  '新卡盖哪种开放印：完全开放、交换后开放，还是贡献后开放？',
] as const;

export function hostAdvance(step: number, answer: string): { step: number; reply: string; error?: string } {
  const text = answer.trim();
  if (text.length < 4) return { step, reply: '', error: '先写一句完整的话。' };
  if (step >= HOST_QUESTIONS.length) return { step, reply: '三问到了，可以合成新卡。' };
  const next = step + 1;
  const reply = next >= HOST_QUESTIONS.length
    ? '三问齐了。点「合成新卡」，亲本会写进族谱。'
    : `记下了。下一问：${HOST_QUESTIONS[next]}`;
  return { step: next, reply };
}
