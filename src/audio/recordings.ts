import { useSyncExternalStore } from 'react';
import type { LetterId } from '../content/alphabet';

/**
 * Записи голосу дорослого (звуки букв) у IndexedDB на самому пристрої.
 * Коли дитина грається сама, вправа «вибери букву за звуком» відтворює мамин запис.
 */
const DB_NAME = 'maya-adventures';
const STORE = 'recordings';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req.result);
    t.onerror = () => reject(t.error);
  });
}

export const soundKey = (l: LetterId) => `sound:${l}`;

let keys = new Set<string>();
let listeners: Array<() => void> = [];
const emit = () => listeners.forEach((l) => l());

export async function loadRecordingKeys() {
  try {
    const all = await tx('readonly', (s) => s.getAllKeys());
    keys = new Set(all.map(String));
    emit();
  } catch {
    // IndexedDB недоступна (приватний режим) - просто без записів.
  }
}

export function hasRecording(key: string): boolean {
  return keys.has(key);
}

export async function saveRecording(key: string, blob: Blob) {
  await tx('readwrite', (s) => s.put(blob, key));
  keys = new Set(keys).add(key);
  emit();
}

export async function deleteRecording(key: string) {
  await tx('readwrite', (s) => s.delete(key));
  const next = new Set(keys);
  next.delete(key);
  keys = next;
  emit();
}

let current: HTMLAudioElement | undefined;

export async function playRecording(key: string): Promise<boolean> {
  try {
    const blob = await tx<Blob | undefined>('readonly', (s) => s.get(key));
    if (!blob) return false;
    current?.pause();
    const url = URL.createObjectURL(blob);
    const el = new Audio(url);
    current = el;
    el.onended = () => URL.revokeObjectURL(url);
    await el.play();
    return true;
  } catch {
    return false;
  }
}

function subscribe(l: () => void) {
  listeners.push(l);
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

const getKeys = () => keys;

export function useRecordingKeys(): Set<string> {
  return useSyncExternalStore(subscribe, getKeys, getKeys);
}

/** Чи можна записувати звук на цьому пристрої (потрібне https або localhost). */
export function canRecord(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';
}

/** Записує звук до виклику stop() або максимум maxMs. `done` - готовий запис. */
export async function startRecording(maxMs = 2500): Promise<{ stop: () => void; done: Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
    };
  });
  const stop = () => {
    window.clearTimeout(timer);
    if (rec.state === 'recording') rec.stop();
  };
  rec.start();
  const timer = window.setTimeout(stop, maxMs);
  return { stop, done };
}
