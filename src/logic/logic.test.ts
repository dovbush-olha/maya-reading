import { describe, expect, it } from 'vitest';
import { NOT_YET_STUDIED, isReadableWith, type LetterId } from '../content/alphabet';
import type { Exercise } from '../content/types';
import { validateExercise } from '../content/validate';
import { WEEK_1_MISSIONS } from '../content/week1';
import { adviseNextLetter, missionAvailability, recommend } from './availability';
import { buildPracticeMission, makeRng, warmUp } from './generate';
import { adaptForSolo, preferRecordedVoice } from './solo';
import {
  applyExerciseResult,
  completeMission,
  createInitialState,
  normalizeState,
  unlockLetter,
  type ProgressState,
} from './progress';
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

  it('три дні з Л доступні одразу, а день 4 чекає букву М', () => {
    let s = createInitialState(TODAY);
    for (const id of FIRST_THREE_DAYS) {
      expect(missionAvailability(s, WEEK_1_MISSIONS.find((m) => m.id === id)!)).toBe('available');
      s = complete(s, id);
    }
    const day4 = WEEK_1_MISSIONS.find((m) => m.id === 'w1d4m1')!;
    expect(missionAvailability(s, day4)).toBe('needs-letters');
    expect(recommend(s)).toMatchObject({ kind: 'practice', reason: 'needs-letters', letters: ['М'] });
    s = unlockLetter(s, 'М', TODAY);
    expect(missionAvailability(s, day4)).toBe('available');
  });

  it('радить повторити місію, якщо було багато підказок, але не безкінечно', () => {
    let s = complete(createInitialState(TODAY), 'w1d1m1', 4, 6);
    expect(recommend(s)).toMatchObject({ kind: 'mission', reason: 'repeat' });
    s = complete(s, 'w1d1m1', 4, 6);
    s = complete(s, 'w1d1m1', 4, 6);
    const r = recommend(s);
    expect(r.kind === 'mission' && r.mission.id).toBe('w1d1m2');
  });

  it('ніколи не відкриває букви сама, лише радить', () => {
    let s = createInitialState(TODAY);
    for (const id of FIRST_THREE_DAYS) s = complete(s, id);
    expect(adviseNextLetter(s)?.letter).toBe('М');
    expect(s.unlocked).not.toContain('М');
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
          expect(out.kind, `${m.id} ${ex.word}`).toBe('pick-picture');
          expect(validateExercise(out, m.requires), JSON.stringify(out)).toEqual([]);
        }
      });
    }
  });

  it('звук без запису стає пошуком букви за зразком', () => {
    const ex: Exercise = { kind: 'letter-by-sound', target: 'Л', options: ['Л', 'А'] };
    expect(adaptForSolo(ex, never, makeRng('a')).kind).toBe('find-letter');
    expect(adaptForSolo(ex, always, makeRng('a')).kind).toBe('letter-by-sound');
  });

  it('скласти слово сама - лише за однозначною картинкою', () => {
    expect(adaptForSolo({ kind: 'build-word', word: 'мило', distractors: ['ла'] }, never, makeRng('a')).kind).toBe('build-word');
    expect(adaptForSolo({ kind: 'build-word', word: 'Алла', distractors: ['ло'] }, never, makeRng('a')).kind).toBe('pick-picture');
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
