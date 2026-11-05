import type { WordEntry } from './types';

/**
 * Банк коротких справжніх українських слів і фраз.
 * `split` - поділ на склади (дефіс) і слова (пробіл).
 * Тести перевіряють, що поділ збігається зі словом, а в місії слово
 * трапляється лише тоді, коли дитині доступні всі його букви.
 * `clear` - картинка однозначно називає слово (можна просити скласти слово за картинкою).
 */
const LIST: WordEntry[] = [
  // Л + голосні
  { text: 'алло', split: 'ал-ло', picture: '📞', clear: true },
  { text: 'Алла', split: 'Ал-ла', picture: '👩', note: 'Алла - ім’я.' },
  { text: 'Лола', split: 'Ло-ла', picture: '👧', note: 'Лола - ім’я.' },
  { text: 'Елла', split: 'Ел-ла', picture: '👱‍♀️', note: 'Елла - ім’я.' },
  { text: 'Олі', split: 'О-лі', picture: '👧' },
  { text: 'у Олі', split: 'у О-лі', picture: '🎀', note: 'У Олі (є бантик).' },
  { text: 'у Лоли', split: 'у Ло-ли', picture: '🎈', note: 'У Лоли (є кулька).' },
  { text: 'у Алли', split: 'у Ал-ли', picture: '💐', note: 'У Алли (є квіти).' },
  { text: 'у Елли', split: 'у Ел-ли', picture: '👒', note: 'У Елли (є капелюшок).' },

  // М окремо
  { text: 'мама', split: 'ма-ма', picture: '👩‍👧', clear: true },
  { text: 'мамо', split: 'ма-мо', picture: '🙋‍♀️', note: 'Мамо! - кличемо маму.' },
  { text: 'мамі', split: 'ма-мі', picture: '💝', note: 'Подарунок мамі.' },
  { text: 'ми', split: 'ми', picture: '👫' },
  { text: 'Емма', split: 'Ем-ма', picture: '👧🏼', note: 'Емма - ім’я.' },
  { text: 'у мами', split: 'у ма-ми', picture: '👜', note: 'У мами (є сумочка).' },

  // М + Л
  { text: 'мала', split: 'ма-ла', picture: '🐣' },
  { text: 'малі', split: 'ма-лі', picture: '🐥🐥' },
  { text: 'мале', split: 'ма-ле', picture: '🐁' },
  { text: 'мало', split: 'ма-ло', picture: '🤏' },
  { text: 'мило', split: 'ми-ло', picture: '🧼', clear: true },
  { text: 'Міла', split: 'Мі-ла', picture: '👧🏻', note: 'Міла - ім’я.' },
  { text: 'лама', split: 'ла-ма', picture: '🦙', clear: true },
  { text: 'Мама мила', split: 'Ма-ма ми-ла', picture: '🧽' },
  { text: 'Ми малі', split: 'Ми ма-лі', picture: '🧒🧒' },
  { text: 'Лама мала', split: 'Ла-ма ма-ла', picture: '🦙' },
  { text: 'У Міли мило', split: 'У Мі-ли ми-ло', picture: '🫧' },

  // + С
  { text: 'оса', split: 'о-са', picture: '🐝', clear: true },
  { text: 'сом', split: 'сом', picture: '🐟', note: 'Сом - велика річкова риба.' },
  { text: 'сало', split: 'са-ло', picture: '🥓', clear: true },
  { text: 'лис', split: 'лис', picture: '🦊' },
  { text: 'ліс', split: 'ліс', picture: '🌲', clear: true },
  { text: 'лиса', split: 'ли-са', picture: '🦊', note: 'Лиса - лисиця.' },
  { text: 'сила', split: 'си-ла', picture: '💪' },
  { text: 'сума', split: 'су-ма', picture: '👜', note: 'Сума - сумка.' },
  { text: 'Міла сама', split: 'Мі-ла са-ма', picture: '🙋‍♀️' },
  { text: 'Лис у лісі', split: 'Лис у лі-сі', picture: '🌳' },
  { text: 'Оса мала', split: 'О-са ма-ла', picture: '🐝' },

  // + Н
  { text: 'сон', split: 'сон', picture: '😴' },
  { text: 'ніс', split: 'ніс', picture: '👃', clear: true },
  { text: 'сіно', split: 'сі-но', picture: '🌾' },
  { text: 'Ніна', split: 'Ні-на', picture: '👧🏽', note: 'Ніна - ім’я.' },
  { text: 'лимон', split: 'ли-мон', picture: '🍋', clear: true },
  { text: 'сани', split: 'са-ни', picture: '🛷', clear: true },
  { text: 'Олена', split: 'О-ле-на', picture: '👩🏼', note: 'Олена - ім’я.' },
  { text: 'Ніна мала', split: 'Ні-на ма-ла', picture: '👶' },
  { text: 'На сіні лис', split: 'На сі-ні лис', picture: '🦊' },
  { text: 'У Ніни лимон', split: 'У Ні-ни ли-мон', picture: '🍋' },

  // + К
  { text: 'сік', split: 'сік', picture: '🧃', clear: true },
  { text: 'коло', split: 'ко-ло', picture: '⭕', clear: true },
  { text: 'кіно', split: 'кі-но', picture: '🎬' },
  { text: 'миска', split: 'мис-ка', picture: '🥣', clear: true },
  { text: 'молоко', split: 'мо-ло-ко', picture: '🥛', clear: true },
  { text: 'сокіл', split: 'со-кіл', picture: '🦅', clear: true },
  { text: 'калина', split: 'ка-ли-на', picture: '🍒', note: 'Калина - червоні ягідки на кущі.' },
  { text: 'носок', split: 'но-сок', picture: '🧦', clear: true },
  { text: 'колесо', split: 'ко-ле-со', picture: '🛞', clear: true },
  { text: 'Сокіл у лісі', split: 'Со-кіл у лі-сі', picture: '🦅' },
  { text: 'Молоко Мілі', split: 'Мо-ло-ко Мі-лі', picture: '🥛' },
  { text: 'У Ніни носок', split: 'У Ні-ни но-сок', picture: '🧦' },

  // Для вільної практики, коли дорослий відкриє інші букви
  { text: 'тато', split: 'та-то', picture: '👨', clear: true },
  { text: 'кіт', split: 'кіт', picture: '🐈', clear: true },
  { text: 'нота', split: 'но-та', picture: '🎵', clear: true },
  { text: 'рука', split: 'ру-ка', picture: '✋', clear: true },
  { text: 'роса', split: 'ро-са', picture: '💧' },
  { text: 'рот', split: 'рот', picture: '👄', clear: true },
  { text: 'сова', split: 'со-ва', picture: '🦉', clear: true },
  { text: 'вовк', split: 'вовк', picture: '🐺', clear: true },
  { text: 'дім', split: 'дім', picture: '🏠', clear: true },
  { text: 'дуб', split: 'дуб', picture: '🌳' },
];

export const WORDS: Record<string, WordEntry> = Object.fromEntries(LIST.map((w) => [w.text, w]));

export const ALL_WORDS: readonly WordEntry[] = LIST;

export function getWord(key: string): WordEntry {
  const word = WORDS[key];
  if (!word) throw new Error(`Слова «${key}» немає в банку слів`);
  return word;
}

/** Слова фрази, кожне - масив складів: «Ма-ма ми-ла» → [["Ма","ма"],["ми","ла"]]. */
export function wordsOf(entry: WordEntry): string[][] {
  return entry.split.split(' ').map((w) => w.split('-'));
}

export function syllablesOf(entry: WordEntry): string[] {
  return wordsOf(entry).flat();
}

export function isPhrase(entry: WordEntry): boolean {
  return entry.text.includes(' ');
}
