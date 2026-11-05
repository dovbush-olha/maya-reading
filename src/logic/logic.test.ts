import { describe, expect, it } from 'vitest';
import { NOT_YET_STUDIED, isReadableWith, type LetterId } from '../content/alphabet';
import type { Exercise } from '../content/types';
import { validateExercise } from '../content/validate';
import { WEEK_1_MISSIONS } from '../content/week1';
import { adviseNextLetter, missionAvailability, recommend } from './availability';
import { buildPracticeMission, makeRng, warmUp } from './generate';
import { adaptForSolo, canPickPicture, closeness, preferRecordedVoice } from './solo';
import { ALL_WORDS, getWord, isPhrase, syllablesOf } from '../content/words';
import { sayKey, voiceItems } from './voice';
import {
  applyExerciseResult,
  completeMission,
  createInitialState,
  lockLetter,
  normalizeState,
  unlockLetter,
  updateSettings,
  type ProgressState,
} from './progress';
import { newestFirst, overflow } from './readingQueue';
import { addDays, nextReview } from './srs';

const TODAY = '2026-11-05';

function complete(state: ProgressState, id: string, hinted = 0, scored = 5): ProgressState {
  return completeMission(state, { missionId: id, sticker: id, scored, hinted, readAlone: 0, readTotal: 0 }, TODAY);
}

describe('інтервальне повторення', () => {
  it('підвищує коробку лише раз на день і повертає в першу після підказки', () => {
    const a = nextReview({ box: 1, due: TODAY }, true, TODAY);
    expect(a).toMatchObject({ box: 2, due: addDays(TODAY, 1) });
    const b = nextReview(a, true, TODAY);
    expect(b.box).toBe(2);
    const c = nextReview(b, true, addDays(TODAY, 1));
    expect(c.box).toBe(3);
    expect(nextReview(c, false, TODAY)).toMatchObject({ box: 1, due: TODAY });
  });

  it('addDays коректно переходить через місяць', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });
});

describe('стан прогресу', () => {
  it('на старті відкриті голосні й перша приголосна Л', () => {
    const s = createInitialState(TODAY);
    expect([...s.unlocked].sort()).toEqual(['А', 'О', 'У', 'И', 'І', 'Е', 'Л'].sort());
    expect(s.letters['Л']?.status).toBe('learning');
    expect(s.letters['А']?.status).toBe('sometimes');
    expect(s.settings.mode).toBe('solo');
  });

  it('зірочки лише додаються - і за підказку теж', () => {
    let s = createInitialState(TODAY);
    s = applyExerciseResult(s, { hinted: true }, TODAY);
    s = applyExerciseResult(s, { hinted: false }, TODAY);
    expect(s.stars).toBe(2);
  });

  it('відкидає невідомі налаштування (наприклад, старий голос)', () => {
    const s = normalizeState({ version: 1, settings: { voice: true, theme: 'night', helper: 'dragon' } }, TODAY);
    expect(s.settings).toMatchObject({ theme: 'night', helper: 'fox' });
    expect('voice' in s.settings).toBe(false);
  });

  it('витримує пошкоджені дані з localStorage', () => {
    expect(normalizeState('garbage', TODAY).unlocked).toHaveLength(7);
    expect(normalizeState({ version: 1, unlocked: ['С', 'X', 42] }, TODAY).unlocked).toContain('С');
    expect(normalizeState({ version: 1, unlocked: ['С', 'X'] }, TODAY).unlocked).not.toContain('X');
  });

  it('записує результати букв і читання', () => {
    let s = createInitialState(TODAY);
    s = applyExerciseResult(s, { hinted: false, letters: [{ id: 'Л', firstTry: true }], reading: { text: 'ЛА', alone: true } }, TODAY);
    expect(s.letters['Л']).toMatchObject({ seen: 1, firstTry: 1, box: 2 });
    expect(s.reading['ла']).toMatchObject({ alone: 1, helped: 0, last: 'alone' });
  });
});

describe('доступність місій', () => {
  it('рекомендує першу місію на старті', () => {
    const r = recommend(createInitialState(TODAY));
    expect(r).toMatchObject({ kind: 'mission', reason: 'next' });
    if (r.kind === 'mission') expect(r.mission.id).toBe('w1d1m1');
  });

  const FIRST_THREE_DAYS = ['w1d1m1', 'w1d1m2', 'w1d2m1', 'w1d2m2', 'w1d3m1', 'w1d3m2'];

  it('три дні з Л доступні одразу, а М відкривається сама після третього дня', () => {
    let s = createInitialState(TODAY);
    const day4 = WEEK_1_MISSIONS.find((m) => m.id === 'w1d4m1')!;
    for (const id of FIRST_THREE_DAYS) {
      expect(missionAvailability(s, WEEK_1_MISSIONS.find((m) => m.id === id)!)).toBe('available');
      expect(missionAvailability(s, day4)).toBe('locked');
      expect(s.unlocked).not.toContain('М');
      s = complete(s, id);
    }
    expect(s.unlocked).toContain('М');
    expect(s.letters.М).toMatchObject({ status: 'learning', box: 1, due: TODAY });
    expect(missionAvailability(s, day4)).toBe('available');
    expect(recommend(s)).toMatchObject({ kind: 'mission', mission: { id: 'w1d4m1' } });
  });

  it('після кожного дня відкривається наступна буква плану', () => {
    let s = createInitialState(TODAY);
    for (const m of WEEK_1_MISSIONS) {
      expect(missionAvailability(s, m)).toBe('available');
      s = complete(s, m.id);
    }
    expect(s.unlocked).toEqual(expect.arrayContaining(['М', 'С', 'Н', 'К']));
    expect(recommend(s)).toMatchObject({ kind: 'practice', reason: 'week-done' });
  });

  it('прогрес, збережений до автовідкриття, після завантаження одразу веде в день 4', () => {
    let s = createInitialState(TODAY);
    for (const id of FIRST_THREE_DAYS) s = complete(s, id);
    const old = JSON.parse(JSON.stringify({ ...s, unlocked: s.unlocked.filter((l) => l !== 'М'), autoUnlocked: undefined }));
    const loaded = normalizeState(old, TODAY);
    expect(loaded.unlocked).toContain('М');
    expect(recommend(loaded)).toMatchObject({ kind: 'mission', mission: { id: 'w1d4m1' } });
  });

  it('букву, яку сховав дорослий, гра сама вже не відкриває', () => {
    let s = createInitialState(TODAY);
    for (const id of FIRST_THREE_DAYS) s = complete(s, id);
    s = lockLetter(s, 'М');
    const day4 = WEEK_1_MISSIONS.find((m) => m.id === 'w1d4m1')!;
    expect(missionAvailability(s, day4)).toBe('needs-letters');
    s = complete(s, 'w1d3m2');
    s = normalizeState(JSON.parse(JSON.stringify(s)), TODAY);
    expect(s.unlocked).not.toContain('М');
    expect(recommend(s)).toMatchObject({ kind: 'practice', reason: 'needs-letters', letters: ['М'] });
    s = unlockLetter(s, 'М', TODAY);
    expect(missionAvailability(s, day4)).toBe('available');
  });

  it('не відкриває букву, поки не пройдено всі попередні місії', () => {
    let s = createInitialState(TODAY);
    for (const id of FIRST_THREE_DAYS.filter((id) => id !== 'w1d2m1')) s = complete(s, id);
    expect(s.unlocked).not.toContain('М');
    s = complete(s, 'w1d2m1');
    expect(s.unlocked).toContain('М');
  });

  it('радить повторити місію, якщо було багато підказок, але не безкінечно', () => {
    let s = complete(createInitialState(TODAY), 'w1d1m1', 4, 6);
    expect(recommend(s)).toMatchObject({ kind: 'mission', reason: 'repeat' });
    s = complete(s, 'w1d1m1', 4, 6);
    s = complete(s, 'w1d1m1', 4, 6);
    const r = recommend(s);
    expect(r.kind === 'mission' && r.mission.id).toBe('w1d1m2');
  });

  it('радить про сховану букву лише тоді, коли доступні місії пройдено', () => {
    let s = createInitialState(TODAY);
    for (const id of FIRST_THREE_DAYS.slice(0, 2)) s = complete(s, id);
    expect(adviseNextLetter(s)).toMatchObject({ letter: 'М', ready: false });
    expect(adviseNextLetter(s)?.message).toContain('відкриється сама');
    for (const id of FIRST_THREE_DAYS) s = complete(s, id);
    s = lockLetter(s, 'М');
    expect(adviseNextLetter(s)?.letter).toBe('М');
    expect(adviseNextLetter(s)?.message).not.toContain('відкриється сама');
  });
});

describe('згенеровані вправи', () => {
  const letterSets: LetterId[][] = [
    [],
    ['М'],
    ['С'],
    ['М', 'С', 'Н', 'К'],
    ['М', 'С', 'Н', 'К', 'Т', 'Р', 'В'],
  ];

  it.each(letterSets.map((ls) => [ls.join('') || 'базовими', ls] as const))('практика з %s містить лише відкриті букви', (_k, ls) => {
    let s = createInitialState(TODAY);
    for (const l of ls) s = unlockLetter(s, l, TODAY);
    for (let seed = 0; seed < 25; seed++) {
      const m = buildPracticeMission(s, TODAY, makeRng(`seed-${seed}`));
      expect(m.exercises.length).toBeGreaterThanOrEqual(5);
      for (const ex of m.exercises) {
        expect(validateExercise(ex, s.unlocked), JSON.stringify(ex)).toEqual([]);
      }
    }
  });

  it('розминка не використовує Я, Ю, Є, Ї і недоступні в місії букви', () => {
    let s = createInitialState(TODAY);
    for (const l of ['М', 'С', 'Н', 'К', 'Я'] as LetterId[]) s = unlockLetter(s, l, TODAY);
    for (const l of s.unlocked) s = applyExerciseResult(s, { hinted: true, letters: [{ id: l, firstTry: false }] }, TODAY);
    for (const m of WEEK_1_MISSIONS) {
      for (let seed = 0; seed < 10; seed++) {
        for (const ex of warmUp(s, m, TODAY, makeRng(`${m.id}-${seed}`))) {
          expect(validateExercise(ex, m.requires), `${m.id} ${JSON.stringify(ex)}`).toEqual([]);
          if (ex.kind === 'find-letter' || ex.kind === 'letter-by-sound') {
            expect(ex.options.some((o) => NOT_YET_STUDIED.includes(o))).toBe(false);
          }
        }
      }
    }
  });

  it('слова в практиці читаються відкритими буквами', () => {
    const s = createInitialState(TODAY);
    const m = buildPracticeMission(s, TODAY, makeRng('x'));
    for (const ex of m.exercises) {
      if (ex.kind === 'read-word' || ex.kind === 'build-word') expect(isReadableWith(ex.word, s.unlocked)).toBe(true);
    }
  });
});

describe('режим «сама»', () => {
  const always = () => true;
  const never = () => false;

  it('читання слова перетворюється на вибір картинки з різними картинками', () => {
    for (const m of WEEK_1_MISSIONS) {
      m.exercises.forEach((ex, i) => {
        const out = adaptForSolo(ex, never, makeRng(`${m.id}-${i}`));
        if (ex.kind === 'read-word') {
          expect(out.kind, `${m.id} ${ex.word}`).toBe(canPickPicture(getWord(ex.word)) ? 'pick-picture' : 'read-word');
          expect(validateExercise(out, m.requires), JSON.stringify(out)).toEqual([]);
        }
      });
    }
  });

  it('людей і картинки, яких не впізнати за текстом, не вгадують - лишається просте читання', () => {
    for (const word of ['Алла', 'Ніна', 'мамо', 'Ми малі', 'Ніна мала', 'у Олі', 'мамі', 'мале']) {
      expect(adaptForSolo({ kind: 'read-word', word }, never, makeRng(word)).kind, word).toBe('read-word');
    }
    expect(adaptForSolo({ kind: 'read-word', word: 'сом' }, never, makeRng('a')).kind).toBe('pick-picture');
  });

  it('у вибір картинки потрапляють лише слова, які видно з картинки', () => {
    const pickable = ALL_WORDS.filter(canPickPicture).map((w) => w.text);
    expect(pickable).toContain('лама');
    expect(pickable).not.toContain('Олена');
    expect(pickable).not.toContain('у мами');
  });

  it('зайві картинки називають схожі слова, щоб не вгадати за першою буквою', () => {
    const out = adaptForSolo({ kind: 'read-word', word: 'сом' }, never, makeRng('a'));
    if (out.kind !== 'pick-picture') throw new Error(out.kind);
    expect(out.options).toHaveLength(3);
    for (const o of out.options) expect(o[0]).toBe('с');
  });

  it('якщо є хоча б два схожі за першою буквою слова - обидва зайві варіанти на ту саму букву', () => {
    for (const m of WEEK_1_MISSIONS) {
      m.exercises.forEach((ex, i) => {
        const out = adaptForSolo(ex, never, makeRng(`${m.id}-${i}`));
        if (out.kind !== 'pick-picture') return;
        const first = out.word[0].toLowerCase();
        const target = getWord(out.word);
        const sameFirst = new Set(
          ALL_WORDS.filter((w) => w.clear && !isPhrase(w) && w.text !== out.word && w.picture !== target.picture && w.text[0].toLowerCase() === first)
            .map((w) => w.picture),
        );
        if (sameFirst.size < 2) return;
        for (const o of out.options) expect(o[0].toLowerCase(), `${m.id} ${out.word}: ${out.options.join(', ')}`).toBe(first);
      });
    }
  });

  it('у фразі зайвий варіант не схожий на її слова', () => {
    for (const word of ['Мама мила', 'Лис у лісі']) {
      for (let seed = 0; seed < 20; seed++) {
        const out = adaptForSolo({ kind: 'read-word', word }, never, makeRng(`${word}-${seed}`));
        if (out.kind !== 'pick-picture') throw new Error(out.kind);
        expect(out.options, word).not.toContain('мило');
        expect(out.options, word).not.toContain('ліс');
      }
    }
  });

  it('схожість: перша буква важливіша за решту слова', () => {
    expect(closeness('сом', 'сік')).toEqual([0, 2, 1]);
    expect(closeness('сом', 'дім')).toEqual([1, 2, 0]);
    expect(closeness('Мама', 'мама')).toEqual([0, 0, 0]);
  });

  it('звук без запису стає пошуком букви за зразком', () => {
    const ex: Exercise = { kind: 'letter-by-sound', target: 'Л', options: ['Л', 'А'] };
    expect(adaptForSolo(ex, never, makeRng('a')).kind).toBe('find-letter');
    expect(adaptForSolo(ex, always, makeRng('a')).kind).toBe('letter-by-sound');
  });

  it('скласти слово сама - лише за однозначною картинкою', () => {
    expect(adaptForSolo({ kind: 'build-word', word: 'мило', distractors: ['ла'] }, never, makeRng('a')).kind).toBe('build-word');
    expect(adaptForSolo({ kind: 'build-word', word: 'сом', distractors: ['са'] }, never, makeRng('a')).kind).toBe('pick-picture');
    expect(adaptForSolo({ kind: 'build-word', word: 'Алла', distractors: ['ло'] }, never, makeRng('a'))).toEqual({ kind: 'read-word', word: 'Алла' });
  });
});

describe('голос дорослого', () => {
  const find: Exercise = { kind: 'find-letter', target: 'Л', options: ['Л', 'А', 'О'], letterCase: 'lower' };

  it('«знайди букву» стає «послухай і знайди», коли є запис', () => {
    expect(preferRecordedVoice(find, (l) => l === 'Л')).toEqual({ ...find, kind: 'letter-by-sound' });
  });

  it('без запису вправа не змінюється, і режим «сама» її не зіпсує', () => {
    expect(preferRecordedVoice(find, () => false)).toBe(find);
    const voiced = preferRecordedVoice(find, () => true);
    expect(adaptForSolo(voiced, () => true, makeRng('x')).kind).toBe('letter-by-sound');
  });
});

describe('записи читання для дорослого', () => {
  const at = (minute: number) => `2026-11-05T10:${String(minute).padStart(2, '0')}:00.000Z`;
  const item = (id: string, minute: number) => ({ id, text: 'ма', at: at(minute) });

  it('найновіші зверху', () => {
    expect(newestFirst([item('a', 1), item('c', 3), item('b', 2)]).map((r) => r.id)).toEqual(['c', 'b', 'a']);
  });

  it('понад ліміт видаляються найстаріші', () => {
    expect(overflow([item('a', 1), item('b', 2), item('c', 3)], 2)).toEqual(['a']);
    expect(overflow([item('a', 1)], 2)).toEqual([]);
  });

  it('запис читання вимкнений, доки дорослий його не ввімкне, і переживає перезавантаження', () => {
    expect(createInitialState(TODAY).settings.recordReading).toBe(false);
    const on = updateSettings(createInitialState(TODAY), { recordReading: true });
    expect(normalizeState(JSON.parse(JSON.stringify(on)), TODAY).settings.recordReading).toBe(true);
    expect(normalizeState({ ...on, settings: { recordReading: 'так' } }, TODAY).settings.recordReading).toBe(false);
  });
});

describe('голос дорослого для складів і слів', () => {
  const letters: LetterId[] = ['А', 'О', 'У', 'И', 'І', 'Е', 'Л', 'М'];
  const items = voiceItems(letters, WEEK_1_MISSIONS);

  it('один запис на склад незалежно від регістру', () => {
    expect(sayKey('Ма')).toBe(sayKey('ма'));
    expect(sayKey('Мама мила')).toBe('say:мама мила');
  });

  it('склад з однієї букви - це звук букви, окремо його не записуємо', () => {
    expect(sayKey('О')).toBe('sound:О');
    expect(sayKey('у')).toBe('sound:У');
    expect(items.syllables).not.toContain('о');
  });

  it('слово з одного складу - лише серед слів', () => {
    expect(items.words).toContain('ми');
    expect(items.syllables).not.toContain('ми');
  });

  it('містить склади з місій, склади слів і самі слова', () => {
    expect(items.syllables).toEqual(expect.arrayContaining(['ла', 'ма', 'ал', 'ло']));
    expect(items.words).toEqual(expect.arrayContaining(['мама', 'мама мила', 'алла']));
  });

  it('лише те, що читається доступними буквами, без повторів', () => {
    for (const t of [...items.syllables, ...items.words]) expect(isReadableWith(t, letters), t).toBe(true);
    expect(items.words).not.toContain('оса');
    expect(new Set(items.syllables).size).toBe(items.syllables.length);
  });

  it('кожен склад кожного доступного слова можна записати', () => {
    for (const w of ALL_WORDS.filter((x) => isReadableWith(x.text, letters))) {
      for (const s of syllablesOf(w)) {
        const key = s.toLocaleLowerCase('uk-UA');
        if (key.length > 1) expect([...items.syllables, ...items.words], `${w.text}: ${s}`).toContain(key);
      }
    }
  });
});
