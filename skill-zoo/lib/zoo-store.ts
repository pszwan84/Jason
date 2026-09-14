'use client';
import { useSyncExternalStore } from 'react';
import { initialState } from './fixtures';
import type { ZooState } from './model';
import { readStore, writeStore, STORAGE_KEY, LEGACY_KEY } from './storage';

type Snapshot = { state: ZooState; ready: boolean; error: string; temporary: boolean; migrated: boolean };
const server: Snapshot = { state: initialState(), ready: false, error: '', temporary: false, migrated: false };
let snapshot = server;
let initialized = false;
let writable = true;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
function initialize() {
  if (initialized) return;
  initialized = true;
  try {
    const result = readStore(window.localStorage);
    writable = !result.error;
    snapshot = { ...result, ready: true, temporary: false };
  } catch {
    writable = false;
    snapshot = { ...server, ready: true, error: '浏览器禁止本地存储。可使用临时演示并导出备份。' };
  }
  emit();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  initialize();
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && !snapshot.temporary) {
      initialized = false;
      initialize();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
}
export function useZoo() { return useSyncExternalStore(subscribe, () => snapshot, () => server); }
export function updateZoo(change: (state: ZooState) => ZooState) {
  if (!snapshot.ready) throw new Error('数据正在加载，请稍后。');
  if (!writable && !snapshot.temporary) throw new Error('请先导出原始数据或选择临时演示。');
  const state = change(snapshot.state);
  let error = '';
  if (!snapshot.temporary) {
    try { error = writeStore(window.localStorage, state); }
    catch { error = '本地存储不可用，请导出当前数据备份。'; }
  }
  snapshot = { ...snapshot, state, error };
  emit();
}
export function temporaryDemo() {
  snapshot = { ...snapshot, temporary: true, error: '' };
  emit();
}
export function retryStorage() {
  if (!writable) {
    initialized = false;
    initialize();
    return;
  }
  let error = '';
  try { error = writeStore(window.localStorage, snapshot.state); }
  catch { error = '本地存储仍不可用，请导出备份。'; }
  snapshot = { ...snapshot, error };
  emit();
}
export function exportBackup() {
  let existing: unknown = null;
  try { existing = { current: localStorage.getItem(STORAGE_KEY), legacy: localStorage.getItem(LEGACY_KEY) }; }
  catch { existing = 'Storage unavailable'; }
  const data = { exportedAt: new Date().toISOString(), workingState: snapshot.state, originalStorage: existing };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'skill-zoo-backup.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
