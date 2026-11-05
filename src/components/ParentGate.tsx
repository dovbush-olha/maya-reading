import { useState } from 'react';
import { randomGateNumber } from '../logic/gate';
import { Modal } from './ui';

/**
 * «Замок для дорослих»: число написане словами, а набирати треба цифрами.
 * Дорослий робить це за секунду, а дитина, яка тільки вчиться читати, випадково не відкриє.
 */
export function ParentGate({ onPass, onClose }: { onPass: () => void; onClose: () => void }) {
  const [target, setTarget] = useState(() => randomGateNumber());
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);

  const press = (digit: string) => {
    const next = typed + digit;
    if (next.length < 2) {
      setTyped(next);
      setWrong(false);
      return;
    }
    if (next === target.value) {
      onPass();
      return;
    }
    setWrong(true);
    setTyped('');
    setTarget(randomGateNumber());
  };

  return (
    <Modal title="Для дорослих" onClose={onClose}>
      <div className="gate">
        <p className="gate__task">
          Наберіть цифрами число: <b>{target.words}</b>
        </p>
        <div className={`gate__display ${wrong ? 'gate__display--wrong' : ''}`} aria-live="polite">
          <span>{typed[0] ?? '_'}</span>
          <span>{typed[1] ?? '_'}</span>
        </div>
        {wrong && <p className="gate__hint">Не те число - ось нове.</p>}
        <div className="gate__pad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" className="gate__key" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button type="button" className="gate__key gate__key--muted" onClick={onClose}>
            ✕
          </button>
          <button type="button" className="gate__key" onClick={() => press('0')}>
            0
          </button>
          <button type="button" className="gate__key gate__key--muted" onClick={() => setTyped(typed.slice(0, -1))} aria-label="Стерти">
            ⌫
          </button>
        </div>
      </div>
    </Modal>
  );
}
