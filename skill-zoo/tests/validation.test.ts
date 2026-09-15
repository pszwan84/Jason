import {test} from 'node:test';
import assert from 'node:assert/strict';
import {skillInput,assertOrigin,safeUrl} from '../lib/platform/validation.ts';
import {emptySkill} from '../lib/platform/types.ts';
import {distill} from '../lib/platform/distill.ts';
import {explainSkillMatch,skillQuality} from '../lib/platform/skills.ts';
void test('draft may be incomplete, publishing requires all quality fields',()=>{
 const value={body:{...emptySkill,title:'方法'},status:'draft',revision:0};
 assert.equal(skillInput(value).status,'draft');
 assert.throws(()=>skillInput({...value,status:'published'}));
 for(const key of ['problem','input','output','steps','example','limits']) Object.assign(value.body,{[key]:'真实内容'});
 assert.equal(skillInput({...value,status:'published'}).status,'published');
 assert.throws(()=>skillInput({...value,revision:-1}));
 assert.throws(()=>skillInput({...value,body:{...value.body,title:'x'.repeat(81)}}));
});
void test('cross-origin mutations are rejected',()=>{
 assert.throws(()=>assertOrigin(new Request('https://zoo.test/api',{method:'POST',headers:{origin:'https://evil.test'}})));
 assert.doesNotThrow(()=>assertOrigin(new Request('https://zoo.test/api',{method:'POST',headers:{origin:'https://zoo.test'}})));
});
void test('model links cannot execute scripts or embed credentials',()=>{
 for(const v of ['javascript:alert(1)','http://example.com','https://user:pw@example.com',null])assert.equal(safeUrl(v),undefined);
 assert.equal(safeUrl('https://cdn.example.com/m.glb'),'https://cdn.example.com/m.glb');
});
void test('experience distillation creates editable method fields',()=>{
 const result=distill('我在会议中经常遇到决定无法落地的问题。首先记录所有参与者和目标。然后把分歧拆成可验证的选项。最后确认负责人、截止时间并在下一次会议复盘。');
 assert.equal(result.problem.includes('会议'),true);
 assert.equal(result.steps.length>=3,true);
 assert.equal(result.title,'复盘实践方法');
 assert.equal(result.source.includes('规则提炼草稿'),true);
});
void test('skill quality exposes transparent evidence instead of opaque authority',()=>{
 const body={...emptySkill,title:'会议复盘',example:'团队在三次会议中使用并复盘。'};
 const skill={...({status:'published'} as const)} as Parameters<typeof skillQuality>[0];
 const initial=skillQuality(skill,body,{feedback:0,cases:0,helpful:0,unfit:0,versions:1,contributors:0});
 assert.equal(initial.label,'初步验证');
 assert.equal(initial.confidence,'中');
 assert.equal(initial.sourceVerified,false);
 assert.equal(initial.caseCount,0);
 assert.match(initial.source,/尚未经平台独立核验/);
 assert.ok(initial.signals.includes('作者提供了真实案例'));
 const evidenced=skillQuality(skill,body,{feedback:3,cases:2,helpful:2,unfit:0,versions:2,contributors:1});
 assert.equal(evidenced.feedbackCount,3);
 assert.equal(evidenced.caseCount,2);
 assert.equal(evidenced.versionCount,2);
 assert.equal(evidenced.contributorCount,1);
 assert.ok(evidenced.score>initial.score);
 assert.equal(evidenced.label,'多人验证');
});
void test('skill discovery explains which fields matched the query',()=>{
 const body={...emptySkill,title:'会议复盘',category:'商业',tags:'会议,决策',problem:'帮助团队让决定落地',steps:'记录分歧\n确认负责人',example:'团队案例'};
 const skill={title:body.title,category:body.category,tags:body.tags,body:JSON.stringify(body),author:'王明'};
 const match=explainSkillMatch(skill,'会议 决策');
 assert.ok(match.matchScore>0);
 assert.deepEqual(match.matchFields.slice(0,2),['标题','标签']);
 assert.match(match.matchReason,/标题|标签/);
 const empty=explainSkillMatch(skill,'不存在的词');
 assert.equal(empty.matchScore,0);
 assert.equal(empty.matchFields.length,0);
 assert.match(empty.matchReason,/暂无直接匹配/);
});
