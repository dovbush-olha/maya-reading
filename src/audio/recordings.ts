import { useSyncExternalStore } from 'react';
import { tx } from './db';

export { soundKey } from '../logic/voice';

/**
 * Записи голосу дорослого (звуки букв) у IndexedDB на самому пристрої.
 * Коли дитина грається сама, вправа «вибери букву за звуком» відтворює мамин запис.
 */

let keys = new Set<string>();
let listeners: Array<() => void> = [];
const emit = () => listeners.forEach((l) => l());

export async function loadRecordingKeys() {
  try {
    const all = await tx('recordings', 'readonly', (s) => s.getAllKeys());
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
  await tx('recordings', 'readwrite', (s) => s.put(blob, key));
  keys = new Set(keys).add(key);
  emit();
}

export async function deleteRecording(key: string) {
  await tx('recordings', 'readwrite', (s) => s.delete(key));
  const next = new Set(keys);
  next.delete(key);
  keys = next;
  emit();
}

let current: HTMLAudioElement | undefined;

/** Відтворює запис; попередній, якщо ще звучить, зупиняється. */
export async function playBlob(blob: Blob): Promise<boolean> {
  try {
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

export async function playRecording(key: string): Promise<boolean> {
  try {
    const blob = await tx<Blob | undefined>('recordings', 'readonly', (s) => s.get(key));
    return blob ? await playBlob(blob) : false;
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

/** Питаємо дозвіл на мікрофон заздалегідь, у режимі дорослого, щоб дитина не бачила цього питання. */
export async function requestMicrophone(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}
