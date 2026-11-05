import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/nunito/wght.css';
import './styles/base.css';
import './styles/components.css';
import './styles/exercises.css';
import './styles/screens.css';
import './styles/play.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Офлайн-режим і встановлення на головний екран телефону (лише у зібраній версії).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void setUpOffline());
}

/**
 * Телефон часто не перезапускає застосунок з іконки, а повертає його з пам'яті,
 * тож нову версію шукаємо щоразу, коли гру відкривають. Перезавантажуємося лише
 * одразу після відкриття: посеред місії дитину не перериваємо - тоді оновимося наступного разу.
 */
async function setUpOffline() {
  const FRESH_OPEN_MS = 15_000;
  let openedAt = Date.now();
  let pending = false;
  const hadController = Boolean(navigator.serviceWorker.controller);
  const reg = await navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  if (!reg) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Перше встановлення - не оновлення.
    if (!hadController) return;
    if (Date.now() - openedAt < FRESH_OPEN_MS) window.location.reload();
    else pending = true;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (pending) {
      window.location.reload();
      return;
    }
    openedAt = Date.now();
    void reg.update().catch(() => undefined);
  });
}
