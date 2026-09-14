'use client';
import { ArrowRight, ArrowUpRight, Bookmark, BookOpen, Scale, Palette, BriefcaseBusiness, Wrench, GraduationCap, Sprout } from 'lucide-react';
import type { Skill } from '@/lib/model';
import { useZoo } from '@/lib/zoo-store';
export function SkillIcon({ category, size = 26 }: { category: string; size?: number }) {
  const Icon = ({ 科研馆: BookOpen, 法律馆: Scale, 设计馆: Palette, 商业馆: BriefcaseBusiness, 工程馆: Wrench, 教育馆: GraduationCap })[category] ?? BookOpen;
  return <Icon size={size} strokeWidth={1.5} />;
}
export function Mascot({ pose = 'idle', className = '' }: { pose?: 'idle' | 'working' | 'hello'; className?: string }) {
  const { state } = useZoo();
  return <picture className={'kanshan ' + className}><source media="(prefers-reduced-motion: reduce)" srcSet={`/kanshan/${pose}.png`} /><img src={`/kanshan/${pose}.${state.motionPaused ? 'png' : 'gif'}`} width={320} height={320} alt={pose === 'working' ? '刘看山正在认真工作' : '刘看山陪你一起探索'} decoding="async" /></picture>;
}
export function Avatar({ name, color = 'sage' }: { name: string; color?: string }) { return <span className={'avatar ' + color}>{name.slice(-1)}</span>; }
export function Heading({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return <div className="page-heading with-kanshan"><div><span className="eyebrow">{tag}</span><h1>{title}</h1><p>{sub}</p></div><Mascot pose={tag.includes('INCUBATOR') || tag.includes('CO-LAB') ? 'working' : 'idle'} className="heading-mascot" /></div>;
}
export function SkillCard({ skill, saved, onSave, onOpen }: { skill: Skill; saved: boolean; onSave: () => void; onOpen: () => void }) {
  return <article className="skill-card"><div className="card-top"><span className={'skill-icon ' + skill.color}><SkillIcon category={skill.category} /></span><span className="access"><i />{skill.label}</span><button className={'icon-btn bookmark ' + (saved ? 'selected' : '')} aria-label={(saved ? '取消收藏' : '收藏') + skill.title} aria-pressed={saved} onClick={onSave}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /></button></div><button className="card-title" onClick={onOpen}>{skill.title}<ArrowUpRight size={20} /></button><div className="author-line"><Avatar name={skill.author} color={skill.color} /><span>由 <b>{skill.author}</b> 培养 · {skill.owner === 'sample' ? '示例' : '本地发布'}</span></div><p className="skill-story">{skill.desc}</p><p className="tags">{skill.tag || '方法正在生长'}</p><div className="card-bottom"><span><Sprout size={14} />{skill.update}</span><button aria-label={'查看' + skill.title} onClick={onOpen}><ArrowRight size={18} /></button></div></article>;
}
export function Empty({ title, children }: { title: string; children?: React.ReactNode }) { return <div className="empty"><Sprout size={35} /><h3>{title}</h3>{children}</div>; }
