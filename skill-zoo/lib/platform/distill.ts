const DOMAIN=['法律','科研','论文','写作','设计','商业','工程','教育','数据','城市','决策','复盘','访谈','实验','系统','团队','产品','运营','医疗','研究','方法','学习','教学','案例','证据','标准','流程','判断','统计','模型','策略','内容','组织','治理','政策','文献','创新','验证','边界','需求','用户','增长','沟通','会议','选择'];
const SEQ=/^(第[一二三四五六七八九十0-9]+步|[0-9]+[、.．)）]|[一二三四五六七八九十]+[、.．)）]|首先|先|接着|然后|其次|之后|再|最后|最终|一是|二是|三是)/;
export type Distilled={title:string;problem:string;steps:string[];tags:string[];source:string};
export function distill(input:string):Distilled {
 const text=input.slice(0,12000).replace(/<[^>]+>/g,' ').replace(/[\t ]+/g,' ').trim();
 const parts=text.split(/[。！？!?；;\n]+|[，,](?=首先|然后|接着|其次|最后|再)/).map(s=>s.trim()).filter(s=>s.length>=4);
 const problem=(parts[0]||text).slice(0,4000);const steps:string[]=[];
 for(const s of [...parts.filter(s=>SEQ.test(s)),...parts.filter(s=>!SEQ.test(s))]){const step=s.replace(SEQ,'').replace(/^[，,、:：\s]+/,'').trim().slice(0,800);if(step.length>=4&&!steps.includes(step)){steps.push(step);if(steps.length===5)break;}}
 const tags=DOMAIN.filter(d=>text.includes(d)).slice(0,5);const title=tags.length?`${tags[0]}实践方法`:'经验实践方法';
 return {title,problem,steps,tags,source:`来自你粘贴的经历（${text.length} 字）· 规则提炼草稿，请核验后发布`};
}
