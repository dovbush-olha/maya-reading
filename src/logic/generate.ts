import { BASE_LETTERS, LETTERS, isReadableWith, toLower, type LetterId } from '../content/alphabet';
import type { Exercise, LetterCase, Mission } from '../content/types';
import { ALL_WORDS, isPhrase, syllablesOf } from '../content/words';
import type { ProgressState } from './progress';
import { isDue } from './srs';

export type Rng = () => number;

/** Детермінований генератор випадкових чисел (mulberry32), щоб місія не перемішувалася під час перемальовування. */
export function makeRng(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Перемішує варіанти відповідей, щоб правильна не стояла завжди першою. */
export function prepareExercise(ex: Exercise, rng: Rng): Exercise {
  switch (ex.kind) {
    case 'find-letter':
    case 'letter-by-sound':
      return { ...ex, options: shuffle(ex.options, rng) };
    case 'match-syllables':
      return { ...ex, syllables: shuffle(ex.syllables, rng) };
    case 'build-word':
      return { ...ex, distractors: shuffle(ex.distractors, rng) };
    default:
      return ex;
  }
}

/** Букви, які дитина вже бачила (базові вважаються знайомими зі школи). */
function introducedLetters(state: ProgressState): LetterId[] {
  return state.unlocked.filter((l) => BASE_LETTERS.includes(l) || (state.letters[l]?.seen ?? 0) > 0);
}

const STATUS_WEIGHT = { learning: 0, sometimes: 1, knows: 2 } as const;

/** Букви, яким час повторення, від найважчих. */
export function dueLetters(state: ProgressState, today: string, exclude: LetterId[] = []): LetterId[] {
  return introducedLetters(state)
    .filter((l) => LETTERS[l].kind !== 'sign' && !exclude.includes(l))
    .filter((l) => {
      const lp = state.letters[l];
      return !lp || isDue(lp, today);
    })
    .sort((a, b) => {
      const la = state.letters[a];
      const lb = state.letters[b];
      const sa = STATUS_WEIGHT[la?.status ?? 'learning'];
      const sb = STATUS_WEIGHT[lb?.status ?? 'learning'];
      return sa - sb || (la?.box ?? 1) - (lb?.box ?? 1);
    });
}

function letterExercise(
  target: LetterId,
  pool: LetterId[],
  rng: Rng,
  variant: 'find-letter' | 'letter-by-sound',
  letterCase?: LetterCase,
): Exercise {
  const distractors = shuffle(
    pool.filter((l) => l !== target && LETTERS[l].kind !== 'sign'),
    rng,
  ).slice(0, 2);
  return { kind: variant, target, options: shuffle([target, ...distractors], rng), letterCase };
}

/**
 * Розминка перед місією: одна буква, якій настав час повторення за інтервалами.
 * Використовує лише букви, доступні в цій місії.
 */
export function warmUp(state: ProgressState, mission: Mission, today: string, rng: Rng): Exercise[] {
  const alreadyPractised = new Set<LetterId>(
    mission.exercises.flatMap((e) => (e.kind === 'find-letter' || e.kind === 'letter-by-sound' ? [e.target] : [])),
  );
  const pool = mission.requires.filter((l) => state.unlocked.includes(l));
  const candidate = dueLetters(state, today, [...(mission.newLetters ?? []), ...alreadyPractised]).find((l) =>
    pool.includes(l),
  );
  if (!candidate) return [];
  return [letterExercise(candidate, pool, rng, rng() < 0.5 ? 'find-letter' : 'letter-by-sound')];
}

/** Усі відкриті склади «приголосний + голосний» із доступних букв. */
export function availableSyllables(letters: readonly LetterId[]): string[] {
  const vowels = letters.filter((l) => LETTERS[l].kind === 'vowel');
  const consonants = letters.filter((l) => LETTERS[l].kind === 'consonant' && l !== 'Й');
  return consonants.flatMap((c) => vowels.map((v) => toLower(c + v)));
}

function readingScore(state: ProgressState, text: string): number {
  const log = state.reading[text];
  if (!log) return -1;
  const total = log.alone + log.helped;
  return total ? log.alone / total + total * 0.05 : -1;
}

const PRACTICE_STICKERS = ['🍄', '🌸', '🍁', '🌰', '🐌', '🐢', '🐦', '🦆', '🐻', '🐺', '🦡', '🌻'];

/**
 * «Повторення в лісі» - місія, яку щоразу складаємо з того, що дитині вже доступно:
 * букви, яким час повторення, склади, що читаються найважче, і слово з банку слів.
 */
export function buildPracticeMission(state: ProgressState, today: string, rng: Rng): Mission {
  const letters = state.unlocked;
  const exercises: Exercise[] = [];

  const fresh = letters.find((l) => !BASE_LETTERS.includes(l) && (state.letters[l]?.seen ?? 0) === 0);
  if (fresh) exercises.push({ kind: 'intro-letter', letter: fresh }, letterExercise(fresh, letters, rng, 'find-letter'));

  const due = dueLetters(state, today, fresh ? [fresh] : []);
  const focus = (due.length ? due : shuffle(introducedLetters(state), rng)).slice(0, 2);
  focus.forEach((l, i) =>
    exercises.push(letterExercise(l, letters, rng, i % 2 === 0 ? 'letter-by-sound' : 'find-letter', i === 1 ? 'lower' : undefined)),
  );

  const syllables = availableSyllables(letters.filter((l) => l !== fresh));
  const byDifficulty = shuffle(syllables, rng).sort((a, b) => readingScore(state, a) - readingScore(state, b));
  const [s1, s2] = byDifficulty;
  if (s1) {
    const [c, v] = [...s1.toLocaleUpperCase('uk-UA')] as LetterId[];
    exercises.push({ kind: 'blend', sounds: [c, v] }, { kind: 'read-syllable', syllable: s1 });
  }
  if (s2) exercises.push({ kind: 'read-syllable', syllable: s2 });
  if (syllables.length >= 3) exercises.push({ kind: 'match-syllables', syllables: shuffle(syllables, rng).slice(0, 3) });

  const readable = ALL_WORDS.filter((w) => isReadableWith(w.text, letters.filter((l) => l !== fresh)));
  const word = shuffle(readable, rng).sort((a, b) => readingScore(state, a.text) - readingScore(state, b.text))[0];
  if (word) {
    const parts = syllablesOf(word);
    if (parts.length >= 2 && !isPhrase(word)) {
      const distractors = shuffle(
        syllables.filter((s) => !parts.includes(s)),
        rng,
      ).slice(0, 2);
      exercises.push(
        distractors.length
          ? { kind: 'build-word', word: word.text, distractors }
          : { kind: 'read-word', word: word.text },
      );
    } else {
      exercises.push({ kind: 'read-word', word: word.text });
    }
  }

  const sticker = PRACTICE_STICKERS.find((s) => !state.stickers.includes(s)) ?? PRACTICE_STICKERS[Math.floor(rng() * PRACTICE_STICKERS.length)];

  return {
    id: 'practice',
    day: 0,
    order: 1,
    title: 'Повторення в лісі',
    goal: 'practice',
    requires: [...letters],
    newLetters: fresh ? [fresh] : [],
    sticker,
    adultNote: fresh
      ? 'Ця місія знайомить з новою відкритою буквою і повторює те, що Майя вже знає.'
      : 'Місія складається щоразу заново: букви, яким час повторення, і склади, що даються найважче.',
    exercises,
  };
}
