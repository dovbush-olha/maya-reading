import { describe, expect, it } from 'vitest';
import { LETTERS, NOT_YET_STUDIED, VOWELS_FIRST, UKRAINIAN_ALPHABET, lettersOf } from './alphabet';
import { GREETINGS, HINTS, INSTRUCTIONS, PRAISE, PRAISE_AFTER_HINT, PRAISE_READING_ALONE, PRAISE_READING_TOGETHER, TRY_AGAIN } from './phrases';
import { validateMission } from './validate';
import { WEEK_1, WEEK_1_MISSIONS } from './week1';
import { ALL_WORDS, isPhrase } from './words';

describe('абетка', () => {
  it('містить 33 українські букви кирилицею', () => {
    expect(UKRAINIAN_ALPHABET).toHaveLength(33);
    for (const l of UKRAINIAN_ALPHABET) {
      expect(l.codePointAt(0)!, `«${l}» має бути кирилицею`).toBeGreaterThanOrEqual(0x400);
      expect(l.codePointAt(0)!).toBeLessThanOrEqual(0x4ff);
      expect(LETTERS[l].id).toBe(l);
    }
  });

  it('відкидає латинські двійники букв', () => {
    expect(() => lettersOf('MA')).toThrow(); // латинські M і A
    expect(() => lettersOf('Iм')).toThrow(); // латинська I
    expect(lettersOf('мама')).toEqual(['М', 'А', 'М', 'А']);
  });

  it('підказки про форму не називають букву (синтезатор прочитав би назву, а не звук)', () => {
    for (const info of Object.values(LETTERS)) {
      expect(info.shapeHint).not.toMatch(new RegExp(`(^|[\\s«(])${info.id}([\\s».,!?)]|$)`));
    }
  });
});

describe('банк слів', () => {
  it.each(ALL_WORDS.map((w) => [w.text, w] as const))('«%s»: склади складаються в слово', (_text, w) => {
    expect(w.split.replace(/-/g, '')).toBe(w.text);
    if (w.clear) expect(isPhrase(w), 'картинка-підказка лише для окремих слів').toBe(false);
    expect(() => lettersOf(w.text)).not.toThrow();
    expect(w.picture.length).toBeGreaterThan(0);
  });

  it('не містить Я, Ю, Є, Ї', () => {
    for (const w of ALL_WORDS) {
      expect(lettersOf(w.text).filter((l) => NOT_YET_STUDIED.includes(l)), w.text).toEqual([]);
    }
  });
});

describe('перший тиждень', () => {
  it('має 7 днів по 2 місії, перша навчає, друга закріплює', () => {
    expect(WEEK_1).toHaveLength(7);
    WEEK_1.forEach((day, i) => {
      expect(day.day).toBe(i + 1);
      expect(day.missions.map((m) => m.order)).toEqual([1, 2]);
      expect(day.missions[1].goal).toBe('reinforce');
      for (const m of day.missions) expect(m.day).toBe(day.day);
    });
  });

  it('ідентифікатори місій унікальні', () => {
    const ids = WEEK_1_MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('перший день - лише голосні, далі першою приголосною йде Л', () => {
    for (const m of WEEK_1[0].missions) expect([...m.requires].sort()).toEqual([...VOWELS_FIRST].sort());
    for (const m of WEEK_1.slice(1, 3).flatMap((d) => d.missions)) {
      expect([...m.requires].sort()).toEqual([...VOWELS_FIRST, 'Л'].sort());
    }
  });

  it('кожна місія з приголосною має багато слів для читання (від дня 3)', () => {
    for (const m of WEEK_1.slice(2).flatMap((d) => d.missions)) {
      const words = m.exercises.filter((e) => e.kind === 'read-word' || e.kind === 'build-word').length;
      expect(words, m.id).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(WEEK_1_MISSIONS.map((m) => [m.id, m] as const))('%s: усі слова й склади з доступних букв', (_id, m) => {
    expect(validateMission(m)).toEqual([]);
  });

  it('нові букви з’являються поступово і лише з плану', () => {
    const introduced = WEEK_1_MISSIONS.flatMap((m) => m.newLetters ?? []);
    expect(introduced).toEqual(['Е', 'И', 'Л', 'М', 'С', 'Н', 'К']);
  });

  it('використовує всі види вправ', () => {
    const kinds = new Set(WEEK_1_MISSIONS.flatMap((m) => m.exercises.map((e) => e.kind)));
    // pick-picture не пишеться вручну - так перетворюється читання, коли дитина грається сама
    expect([...kinds, 'pick-picture'].sort()).toEqual(Object.keys(INSTRUCTIONS).sort());
  });
});

describe('фрази лисички', () => {
  const spoken = [
    ...Object.values(INSTRUCTIONS),
    ...Object.values(HINTS),
    ...PRAISE,
    ...PRAISE_AFTER_HINT,
    ...PRAISE_READING_ALONE,
    ...PRAISE_READING_TOGETHER,
    ...TRY_AGAIN,
    ...GREETINGS,
  ];
  // Однолітерні слова («а», «і», «я», «у»...) - звичайні слова, а не назви букв.
  const ONE_LETTER_WORDS = new Set(['А', 'І', 'Й', 'В', 'У', 'З', 'О', 'Я']);
  it.each(spoken)('«%s» не містить окремих назв букв', (phrase) => {
    const singles = phrase.match(/(?<=^|[\s«(])[А-ЩЬЮЯҐЄІЇ](?=[\s».,!?)]|$)/gu) ?? [];
    expect(singles.filter((s) => !ONE_LETTER_WORDS.has(s))).toEqual([]);
    expect(phrase).not.toMatch(/([Бб]укв|[Зз]вук)\S*\s+«?[А-ЩЬЮЯҐЄІЇ]([\s».,!?)]|$)/u);
  });
});
