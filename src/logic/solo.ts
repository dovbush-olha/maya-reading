import type { LetterId } from '../content/alphabet';
import type { Exercise } from '../content/types';
import { ALL_WORDS, getWord, isPhrase } from '../content/words';
import { shuffle, type Rng } from './generate';

/** Картинки-люди схожі між собою - як зайві варіанти не годяться. */
const PEOPLE = /[👩👧👨👶🧒🙋👫👱]/u;

/**
 * Є запис голосу дорослого для букви - шукаємо її на слух, а не за зразком.
 * Звук → буква важливіший зв'язок для читання, ніж зорове порівняння.
 * Діє в обох режимах.
 */
export function preferRecordedVoice(ex: Exercise, hasSound: (l: LetterId) => boolean): Exercise {
  if (ex.kind === 'find-letter' && hasSound(ex.target)) {
    return { kind: 'letter-by-sound', target: ex.target, options: ex.options, letterCase: ex.letterCase };
  }
  return ex;
}

/**
 * Дитина грається сама: вправи, де дорослий мав говорити або відмічати читання,
 * перетворюємо так, щоб їх можна було виконати й перевірити без дорослого.
 * Контент місій при цьому не змінюється.
 */
export function adaptForSolo(ex: Exercise, hasSound: (l: LetterId) => boolean, rng: Rng): Exercise {
  switch (ex.kind) {
    case 'letter-by-sound':
      // Без запису голосу звук ніхто не вимовить - шукаємо букву за зразком.
      return hasSound(ex.target) ? ex : { kind: 'find-letter', target: ex.target, options: ex.options, letterCase: ex.letterCase };
    case 'read-word':
      return toPickPicture(ex.word, rng) ?? ex;
    case 'build-word': {
      // Складати за картинкою можна лише коли картинка однозначна; інакше - читаємо й обираємо картинку.
      if (getWord(ex.word).clear) return ex;
      return toPickPicture(ex.word, rng) ?? ex;
    }
    default:
      return ex;
  }
}

function toPickPicture(word: string, rng: Rng): Exercise | undefined {
  const target = getWord(word);
  const pool = ALL_WORDS.filter(
    (w) => w.text !== word && w.clear && !isPhrase(w) && w.picture !== target.picture && !PEOPLE.test(w.picture),
  );
  const seen = new Set<string>([target.picture]);
  const distractors: string[] = [];
  for (const w of shuffle(pool, rng)) {
    if (seen.has(w.picture)) continue;
    seen.add(w.picture);
    distractors.push(w.text);
    if (distractors.length === 2) break;
  }
  if (distractors.length < 2) return undefined;
  return { kind: 'pick-picture', word, options: shuffle([word, ...distractors], rng) };
}
