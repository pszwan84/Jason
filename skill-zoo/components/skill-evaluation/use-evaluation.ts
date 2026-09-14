'use client';
import { useEffect, useRef, useState } from 'react';
import { canonicalDocument, parseDocument, parseEvaluationReport, type SkillDocument, type EvaluationReport } from '@/lib/evaluation/schema';

export function useEvaluation(skill: SkillDocument) {
  const [configuration, setConfiguration] = useState<{ enabled: boolean; model?: string; message?: string } | null>(null);
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const report = reports.find(r => r.id === selectedId) ?? reports[0];
  const stale = !!report && canonicalDocument(report.snapshot) !== canonicalDocument(skill);

  async function refreshConfiguration() {
    try {
      const response = await fetch('/api/skill-evaluations', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json() as { enabled: boolean; model?: string; message?: string };
      if (typeof data?.enabled !== 'boolean') throw new Error();
      if (mounted.current) setConfiguration(data);
    } catch { if (mounted.current) setConfiguration({ enabled: false, message: '无法连接评估服务，请检查网络后刷新状态。' }); }
  }
  useEffect(() => {
    mounted.current = true;
    void refreshConfiguration();
    return () => { mounted.current = false; requestRef.current?.abort(); };
  }, []);

  async function evaluate() {
    if (busyRef.current) return;
    let snapshot: SkillDocument;
    try { snapshot = parseDocument(skill); }
    catch (error) { setError(error instanceof Error ? error.message : '请检查材料。'); return; }
    busyRef.current = true; setBusy(true); setError('');
    const controller = new AbortController(); requestRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 70000);
    try {
      const response = await fetch('/api/skill-evaluations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot), signal: controller.signal });
      let data;
      try { data = await response.json(); } catch { throw new Error('评估服务返回异常，请稍后重试。'); }
      if (!response.ok) { const failure = data as { error?: { message?: string } }; throw new Error(failure?.error?.message ?? '本次评估失败，请重试。'); }
      const report = parseEvaluationReport(data);
      if (canonicalDocument(report.snapshot) !== canonicalDocument(snapshot)) throw new Error('报告与本次提交的材料不匹配，请重试。');
      if (mounted.current) { setReports(history => [report, ...history].slice(0, 5)); setSelectedId(report.id); }
    } catch (error) {
      if (mounted.current) setError(controller.signal.aborted ? '等待评估超时，材料已保留。稍后可重新评估。' : error instanceof Error ? error.message : '本次评估失败，请重试。');
    } finally { clearTimeout(timer); busyRef.current = false; if (mounted.current) setBusy(false); }
  }
  return { configuration, refreshConfiguration, reports, report, selectReport: setSelectedId, busy, error, stale, evaluate };
}
