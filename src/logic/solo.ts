import type { LetterId } from '../content/alphabet';
import type { Exercise, WordEntry } from '../content/types';
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
      // Якщо картинку не впізнати за текстом, лишаємо просте «прочитай»: воно не пише читання в журнал.
      return toPickPicture(ex.word, rng) ?? ex;
    case 'build-word': {
      // Складати за картинкою можна лише коли картинка однозначна; інакше - читаємо й обираємо картинку.
      if (getWord(ex.word).clear) return ex;
      return toPickPicture(ex.word, rng) ?? { kind: 'read-word', word: ex.word };
    }
    default:
      return ex;
  }
}

/**
 * Чи доводить вибір картинки, що слово прочитане.
 * Ні, якщо на картинці людина: зайві варіанти без людей, тож її вибирають, не читаючи
 * («Алла» 👩 серед 🧼 і 🦙). І ні, якщо картинку за текстом не впізнати («у Олі» 🎀).
 */
export function canPickPicture(entry: WordEntry): boolean {
  return entry.pickable !== false && !PEOPLE.test(entry.picture);
}

/**
 * Наскільки слово-варіант схоже на правильне - менше значить схожіше.
 * Найперше дитина вгадує за першою буквою, тому вона важить найбільше;
 * далі - скільки букв різниться, і чи збігається остання буква.
 */
export function closeness(target: string, candidate: string): [number, number, number] {
  const a = target.toLowerCase();
  const b = candidate.toLowerCase();
  return [a[0] === b[0] ? 0 : 1, editDistance(a, b), a.at(-1) === b.at(-1) ? 0 : 1];
}

function compareCloseness(x: readonly number[], y: readonly number[]): number {
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/** Скільки букв треба замінити, додати чи прибрати, щоб з одного слова вийшло інше (Левенштейн). */
function editDistance(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const row = [i];
    for (let j = 1; j <= y.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[y.length];
}

/**
 * Зайві картинки називають слова, схожі на правильне (СОМ: 🐟, а поруч 🧃 сік і 🦉 сова),
 * щоб відповідь не можна було вгадати за першою буквою - треба дочитати слово.
 * Дитина бачить лише картинки зайвих слів, тож їхні букви можуть бути ще не вивчені,
 * але картинки мусять бути однозначними.
 */
function toPickPicture(word: string, rng: Rng): Exercise | undefined {
  const target = getWord(word);
  if (!canPickPicture(target)) return undefined;
  // У фразі картинка показує зміст, тож слово з самої фрази як зайвий варіант - пастка:
  // «Мама мила» 🧽 поруч із 🧼 мило збиває того, хто прочитав правильно.
  const phraseWords = isPhrase(target) ? word.toLowerCase().split(' ') : [];
  const pool = ALL_WORDS.filter(
    (w) =>
      w.text !== word &&
      w.clear &&
      !isPhrase(w) &&
      w.picture !== target.picture &&
      !PEOPLE.test(w.picture) &&
      !phraseWords.some((p) => editDistance(p, w.text.toLowerCase()) <= 1),
  );
  // Перемішування перед стабільним сортуванням: рівно схожі слова щоразу обираються по-різному.
  const ranked = shuffle(pool, rng)
    .map((w) => ({ w, key: closeness(word, w.text) }))
    .sort((p, q) => compareCloseness(p.key, q.key))
    .map((p) => p.w);
  const seen = new Set<string>([target.picture]);
  const distractors: string[] = [];
  for (const w of ranked) {
    if (seen.has(w.picture)) continue;
    seen.add(w.picture);
    distractors.push(w.text);
    if (distractors.length === 2) break;
  }
  if (distractors.length < 2) return undefined;
  return { kind: 'pick-picture', word, options: shuffle([word, ...distractors], rng) };
}
