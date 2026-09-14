import type { Skill, Kit, ZooState, Draft } from './model';
const sampleRows=[
{id:1,title:'法律论文精读',category:'法律馆',color:'peach',author:'陈沐',role:'法学研究生',days:143,cases:38,tag:'法律研究 · 论文阅读',desc:'写毕业论文时，AI 总把“研究创新”和“研究贡献”混在一起。于是，我开始教它真正读懂一篇论文。',update:'3 位同行一起补充了真实案例',label:'贡献后开放'},
{id:2,title:'论文创新判断',category:'科研馆',color:'sage',author:'王展韬',role:'材料学博士生',days:38,cases:26,tag:'科研方法 · 创新判断',desc:'读了很多论文，却还是说不清创新在哪里。我把反复追问的过程，慢慢整理成了 5 个判断步骤。',update:'新增「证据充分性」判断步骤',label:'交换后开放'},
{id:3,title:'系统韧性分析',category:'科研馆',color:'lavender',author:'林然',role:'城市研究博士生',days:96,cases:21,tag:'系统思维 · 跨界研究',desc:'从一片森林到一座城市，系统如何应对变化？一套从生态学里生长出来的分析方法。',update:'第一次应用于组织治理问题',label:'完全开放'},
{id:4,title:'把洞察变成设计',category:'设计馆',color:'yellow',author:'许知',role:'产品设计师',days:72,cases:19,tag:'用户研究 · 设计思考',desc:'访谈笔记堆满了桌子，却不知道下一步。我用真实项目，把模糊的发现整理成可行动的设计。',update:'两位伙伴完成了交叉测试',label:'贡献后开放'},
{id:5,title:'从数据到商业判断',category:'商业馆',color:'peach',author:'周遥',role:'商业分析师',days:62,cases:32,tag:'商业分析 · 决策',desc:'让每一个结论都找到数据依据，也让每一次分析都回到真实的业务问题。',update:'补充了 4 个决策案例',label:'交换后开放'},
{id:6,title:'工程问题拆解',category:'工程馆',color:'sage',author:'江屿',role:'工程师',days:84,cases:17,tag:'系统工程 · 问题拆解',desc:'把复杂故障拆成可以验证的小问题，从现象找到根因，留下可复现的方法。',update:'加入边界条件检查',label:'完全开放'},
{id:7,title:'让知识真正被理解',category:'教育馆',color:'lavender',author:'沈禾',role:'教育研究者',days:45,cases:14,tag:'教学设计 · 学习方法',desc:'从学生的一个困惑开始，设计提问、例子和反馈，让理解一步步发生。',update:'新增课堂反馈案例',label:'贡献后开放'}];
export const DEMO_KIT:Kit={days:38,cases:26,problem:'帮助用户判断一篇论文真正的研究创新在哪里。',tags:['论文精读','文献综述','研究选题','方法比较'],steps:['提取研究问题','找到基线方法','区分方法变化与研究贡献','判断创新是否可验证','给出证据与结论'],source:'来自 17 次论文分析、26 个真实案例和 8 次人工纠错',limits:'对高度理论化论文的判断稳定性仍然不足。',questions:['如何区分“研究创新”和“研究贡献”','如何判断一个方法是否值得继续做','如何设计验证性实验'],updated:'昨天更新'};

const sampleSteps: Record<number, string[]> = {
  1: ['明确论文的核心法律问题','定位现有学说与裁判基线','区分新论证与已有观点','检验引证案例和规范依据','以相反裁判验证适用边界'],
  2: DEMO_KIT.steps,
  3: ['界定系统边界与主要参与者','记录扰动前的基准表现','绘制反馈路径和资源依赖','比较不同扰动下的恢复能力','用极端情境检验失效条件'],
  4: ['确定具体用户和使用情境','逐条归纳访谈事实','区分已观察事实与解释假设','制作可验证的低成本原型','用任务成功率检验设计结论'],
  5: ['写清业务决策和备选方案','统一数据口径与比较基线','分解变化来源和潜在混杂因素','比较方案收益成本与风险','验证结论在不同样本下是否成立'],
  6: ['记录故障现象与复现条件','建立正常系统的比较基线','逐层隔离变量定位根因','实施最小修复并回归验证','记录失效边界与监控信号'],
  7: ['确定学生具体困惑','设计问题识别已有理解','用贴近情境的例子建立联系','要求学生在新情境中解释','根据反馈修正教学步骤'],
};
export const SAMPLE_SKILLS: Skill[] = sampleRows.map(row => ({
  ...row, color: row.color as Skill['color'], label: row.label as Skill['label'],
  steps: sampleSteps[row.id], limits: '示例方法；跨领域使用需由领域专家核验，不能代替专业判断。',
  source: '示例社区资料，案例数和生长天数用于展示，不代表现场验证结果。',
  story: row.desc, example: '', counterexample: '', parentIds: [], owner: 'sample', createdAt: '2026-09-01T00:00:00.000Z',
}));
export function emptyDraft(title = '', problem = ''): Draft {
  return { skillId: null, title, raw: '', category: '科研馆', access: '贡献后开放', story: '', example: '', counterexample: '',
    kit: { days: 1, cases: 0, problem, tags: [], steps: ['', '', '', '', ''],
      source: '作者自述，尚未经独立案例验证。', limits: '', questions: [], updated: '今天创建' } };
}
export function initialState(): ZooState {
  return { version: 2, pool: SAMPLE_SKILLS, saved: [],
    draft: { ...emptyDraft('论文创新判断'), kit: { ...DEMO_KIT, source: '示例草稿，请用自己的经历替换后再发布。' }, story: SAMPLE_SKILLS[1].desc },
    profile: '王展韬', identity: '材料学博士生 · AI 辅助研究',
    supply: ['科研'], demand: ['数据', '商业'], cards: [], comments: [], contributions: [], projects: [], motionPaused: false };
}
export const DEMO_EXPERIENCE = '团队做用户访谈时，总是把个人偏好当成用户需求，导致功能反复返工。首先记录每位受访者的原话和使用情境。然后把事实与推测分别标注，建立可比较的基线。接着归纳反复出现的问题，把洞察转成可以验证的产品假设。再用低成本原型完成任务测试，比较不同方案的成功率。最后记录样本偏差与反例，只在证据支持的范围内推广。';
