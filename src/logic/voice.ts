import { isReadableWith, lettersOf, toLower, type LetterId } from '../content/alphabet';
import type { Mission } from '../content/types';
import { ALL_WORDS, syllablesOf } from '../content/words';
import { availableSyllables, closedSyllables } from './generate';

/** Ключ запису звуку букви. */
export const soundKey = (l: LetterId) => `sound:${l}`;

/**
 * Ключ запису «як правильно прочитати» склад чи слово. Регістр не важить: «Ма» і «ма» звучать однаково.
 * Склад з однієї букви («О-лі», «у Олі») - це просто її звук, тож береться запис звуку букви.
 */
export function sayKey(text: string): string {
  const letters = lettersOf(text);
  return letters.length === 1 ? soundKey(letters[0]) : `say:${toLower(text)}`;
}

export interface VoiceItems {
  syllables: string[];
  words: string[];
}

/** Склади, які трапляються в місіях окремо (не всередині слів). */
function missionSyllables(missions: readonly Mission[]): string[] {
  return missions.flatMap((m) =>
    m.exercises.flatMap((e) => {
      if (e.kind === 'read-syllable') return [e.syllable];
      if (e.kind === 'blend') return [e.sounds.join('')];
      if (e.kind === 'match-syllables') return e.syllables;
      if (e.kind === 'build-word') return e.distractors;
      return [];
    }),
  );
}

/**
 * Що дорослий може записати своїм голосом, щоб дитина почула, як правильно:
 * склади з місій, усі склади з двох доступних букв (і «ма», і «ам»), склади слів і самі слова.
 * Лише те, що читається доступними буквами.
 */
export function voiceItems(letters: readonly LetterId[], missions: readonly Mission[]): VoiceItems {
  const entries = ALL_WORDS.filter((w) => isReadableWith(w.text, letters));
  const words = new Set(entries.map((w) => toLower(w.text)));
  // Слово з одного складу («ми», «ліс») - вже серед слів, тим самим записом.
  const syllables = new Set(
    [...missionSyllables(missions), ...availableSyllables(letters), ...closedSyllables(letters), ...entries.flatMap(syllablesOf)]
      .map(toLower)
      .filter((s) => isReadableWith(s, letters) && lettersOf(s).length > 1 && !words.has(s)),
  );
  const byAlphabet = (a: string, b: string) => a.localeCompare(b, 'uk');
  return { syllables: [...syllables].sort(byAlphabet), words: [...words].sort(byAlphabet) };
}
