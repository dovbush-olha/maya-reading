import { useSyncExternalStore } from 'react';
import { createInitialState, normalizeState, todayISO, type ProgressState } from '../logic/progress';

const STORAGE_KEY = 'maya-adventures/progress';

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw), todayISO()) : createInitialState();
  } catch {
    return createInitialState();
  }
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function save(next: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Приватний режим або переповнене сховище: прогрес залишиться до закриття вкладки.
  }
}

export function getProgress(): ProgressState {
  return state;
}

export function updateProgress(fn: (s: ProgressState) => ProgressState) {
  const next = fn(state);
  if (next === state) return;
  state = next;
  save(state);
  listeners.forEach((l) => l());
}

export function resetProgress() {
  updateProgress(() => createInitialState());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getProgress);
}
