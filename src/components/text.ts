import { toLower, toUpper } from '../content/alphabet';

export type ReadingCase = 'upper' | 'natural';

/** «upper» - усе великими (МАМА), «natural» - як пишеться в книжці (мама, Міла). */
export function caseText(text: string, readingCase: ReadingCase): string {
  return readingCase === 'upper' ? toUpper(text) : text;
}

const SHORT_SOUNDS = ['к', 'п', 'т', 'б', 'д', 'ґ', 'ц', 'ч'];

/** Як протягнути звук: голосні й протяжні приголосні - тричі, короткі (вибухові) - один раз. */
export function stretch(letter: string): string {
  const l = toLower(letter);
  return SHORT_SOUNDS.includes(l) ? l : `${l}-${l}-${l}`;
}

/**
 * Як прочитати склад злито, без пауз між звуками: «л-л-ла», «а-а-ал».
 * Короткий звук не протягнеш, тож одразу переходимо в голосну і тягнемо її: «ко-о-о».
 */
export function glide(syllable: string): string {
  const [first, ...rest] = [...syllable.toLocaleLowerCase('uk-UA')];
  if (!rest.length) return stretch(first);
  if (!SHORT_SOUNDS.includes(first)) return `${stretch(first)}${rest.join('')}`;
  const [next, ...tail] = rest;
  return `${first}${next}-${next}-${next}${tail.join('')}`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
