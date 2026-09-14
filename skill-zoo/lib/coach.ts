// 伪 AIGC：规则商量，不是模型。同一句用户话 → 同一处修改。
export const COACH_MAX = 3;

export type CoachKit = {
  title: string;
  problem: string;
  steps: string[];
  limits: string;
  tags: string[];
};

export type CoachTurn = { role: 'ai' | 'me'; text: string };

const STEP_N = /第\s*([一二三四五1-5])\s*步/;
const NUM: Record<string, number> = { 一: 0, 二: 1, 三: 2, 四: 3, 五: 4, '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };

function stepIndex(text: string): number | null {
  const m = text.match(STEP_N);
  if (!m) return null;
  return NUM[m[1]] ?? null;
}

function concrete(step: string): string {
  if (/验证|检查|写出|标出|对照/.test(step)) return step;
  return `写出可检查的结果：${step.replace(/^(先|再|然后)?/, '')}`.slice(0, 160);
}

export function coachReply(kit: CoachKit, message: string, used: number): { kit: CoachKit; reply: string; used: number } {
  const text = message.trim();
  if (!text) return { kit, reply: '说具体一点：改第几步、加反例，还是换标题。', used };
  if (used >= COACH_MAX) {
    return { kit, reply: '这张卡先定下来。再改就发布之后去围炉说。规则共拟一共三轮。', used };
  }

  const next: CoachKit = {
    ...kit,
    steps: [...kit.steps],
  };
  let reply = '';

  if (/标题|改名|叫/.test(text) && text.length >= 4) {
    const named = text.replace(/.*(?:改成|叫|标题[是为]?)[:：\s]*/, '').replace(/[。！？!?]/g, '').trim();
    if (named.length >= 2 && named.length <= 24 && named !== text) {
      next.title = named;
      reply = `标题改成「${named}」。卡面已经换了。`;
    }
  }

  if (/反例|边界|局限|失效/.test(text)) {
    const extra = text.replace(/.*(反例|边界|局限)[:：是为]?/, '').trim() || '跨领域时必须有对方领域的人核验。';
    next.limits = kit.limits.includes(extra) ? kit.limits : [kit.limits, extra].filter(Boolean).join(' ');
    reply = (reply ? reply + ' ' : '') + '边界已写进卡背。';
  }

  const idx = stepIndex(text);
  if (idx !== null && next.steps[idx]) {
    if (/虚|空|抽象|空泛|太飘/.test(text)) {
      next.steps[idx] = concrete(next.steps[idx]);
      reply = (reply ? reply + ' ' : '') + `第${idx + 1}步改成可检查的动作。`;
    } else if (/删|不要|去掉/.test(text)) {
      next.steps.splice(idx, 1);
      reply = (reply ? reply + ' ' : '') + `第${idx + 1}步拿掉了。`;
    } else {
      const replacement = text.replace(STEP_N, '').replace(/^[，,、:：\s把改成]+/, '').trim();
      if (replacement.length >= 4) {
        next.steps[idx] = replacement.slice(0, 160);
        reply = (reply ? reply + ' ' : '') + `第${idx + 1}步按你的说法改了。`;
      }
    }
  } else if (/虚|空|抽象|空泛/.test(text) && next.steps[2]) {
    next.steps[2] = concrete(next.steps[2]);
    reply = (reply ? reply + ' ' : '') + '第三步最容易虚，已改成可检查的动作。';
  }

  if (/短|缩短|太长/.test(text)) {
    next.steps = next.steps.map((s) => s.slice(0, 36));
    reply = (reply ? reply + ' ' : '') + '每一步压短了，卡背上能一眼看完。';
  }

  if (!reply) {
    reply = '我还是规则，听得懂「改第N步 / 加反例 / 换标题」。说其中一个。';
    return { kit, reply, used };
  }

  if (next.steps.length < 3) {
    while (next.steps.length < 3) next.steps.push('用一个真实材料把判断走通');
  }
  if (next.steps.length > 5) next.steps = next.steps.slice(0, 5);

  return { kit: next, reply: reply + (used + 1 >= COACH_MAX ? ' 三轮到了，定稿还是继续发布后改。' : ''), used: used + 1 };
}

export function openingCoach(kit: CoachKit): CoachTurn {
  const steps = kit.steps.length ? kit.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : '还没有步骤。先贴一段经历。';
  return {
    role: 'ai',
    text: `先按规则收成一张草稿卡「${kit.title || '未命名'}」。\n${steps}\n边界：${kit.limits || '还没有'}。\n这不是大模型。你可以说：改第几步、加反例、换标题。一共三轮。`,
  };
}
