import { BASE_LETTERS, UKRAINIAN_ALPHABET, isLetterId, type LetterId } from '../content/alphabet';
import { isHelperId, type HelperId } from '../content/helpers';
import { nextReview, type ReviewItem } from './srs';

export type LetterStatus = 'knows' | 'sometimes' | 'learning';

export const LETTER_STATUS_LABEL: Record<LetterStatus, string> = {
  knows: 'Знає',
  sometimes: 'Іноді забуває',
  learning: 'Ще вчить',
};

export interface LetterProgress extends ReviewItem {
  status: LetterStatus;
  seen: number;
  firstTry: number;
  /** Останні результати: true - з першої спроби. */
  recent: boolean[];
}

export interface ReadingLog {
  alone: number;
  helped: number;
  last?: 'alone' | 'helped';
  lastAt?: string;
}

export interface MissionRecord {
  completions: number;
  lastCompletedAt: string;
  /** Частка вправ, де знадобилася підказка, в останньому проходженні. */
  lastHintRate: number;
  lastReadAlone: number;
  lastReadTotal: number;
}

export interface Settings {
  /** Тихі звуки натискань і дзвіночок за правильну відповідь. */
  sounds: boolean;
  /** Склади й слова: усі великими (МАМА) чи як у книжці (Мама). */
  readingCase: 'upper' | 'natural';
  theme: 'day' | 'night';
  helper: HelperId;
  /** «solo» - дитина грається сама на телефоні; «together» - поруч дорослий, який відмічає читання. */
  mode: 'solo' | 'together';
  /** Коли дитина грається сама, її читання записується, щоб дорослий потім послухав і відмітив. */
  recordReading: boolean;
  /** Склади з дужками й кнопка 🔊 видно одразу; вимкнено - лише після «Підказка». */
  openHints: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sounds: true,
  readingCase: 'upper',
  theme: 'day',
  helper: 'fox',
  mode: 'solo',
  recordReading: false,
  openHints: true,
};

function normalizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  return {
    sounds: typeof r.sounds === 'boolean' ? r.sounds : d.sounds,
    readingCase: r.readingCase === 'natural' || r.readingCase === 'upper' ? r.readingCase : d.readingCase,
    theme: r.theme === 'night' || r.theme === 'day' ? r.theme : d.theme,
    helper: isHelperId(r.helper) ? r.helper : d.helper,
    mode: r.mode === 'together' || r.mode === 'solo' ? r.mode : d.mode,
    recordReading: typeof r.recordReading === 'boolean' ? r.recordReading : d.recordReading,
    openHints: typeof r.openHints === 'boolean' ? r.openHints : d.openHints,
  };
}

export interface ProgressState {
  version: 1;
  unlocked: LetterId[];
  letters: Partial<Record<LetterId, LetterProgress>>;
  reading: Record<string, ReadingLog>;
  missions: Record<string, MissionRecord>;
  stickers: string[];
  /** Зірочки за кожне виконане завдання. Лише додаються, ніколи не забираються. */
  stars: number;
  settings: Settings;
}

export interface LetterOutcome {
  id: LetterId;
  firstTry: boolean;
}

export interface ReadingOutcome {
  text: string;
  alone: boolean;
}

export interface ExerciseResult {
  hinted: boolean;
  /** Ознайомчі екрани не враховуються в частці підказок. */
  unscored?: boolean;
  letters?: LetterOutcome[];
  /** Відмітка читання. Записуємо лише перевірене: дорослим (одразу чи потім, за записом) або вибором картинки. */
  reading?: ReadingOutcome;
}

const RECENT_WINDOW = 6;

export function todayISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function freshLetter(status: LetterStatus, today: string): LetterProgress {
  return { status, seen: 0, firstTry: 0, recent: [], box: 1, due: today };
}

export function createInitialState(today = todayISO()): ProgressState {
  const letters: ProgressState['letters'] = {};
  const partlyKnown: LetterId[] = ['А', 'О', 'У', 'І'];
  for (const l of BASE_LETTERS) letters[l] = freshLetter(partlyKnown.includes(l) ? 'sometimes' : 'learning', today);
  return {
    version: 1,
    unlocked: [...BASE_LETTERS],
    letters,
    reading: {},
    missions: {},
    stickers: [],
    stars: 0,
    settings: { ...DEFAULT_SETTINGS },
  };
}

/** Відновлює стан із localStorage, терпимо до пошкоджених або старих даних. */
export function normalizeState(raw: unknown, today = todayISO()): ProgressState {
  const base = createInitialState(today);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ProgressState>;
  if (r.version !== 1) return base;

  const unlocked = new Set<LetterId>(BASE_LETTERS);
  for (const l of Array.isArray(r.unlocked) ? r.unlocked : []) if (isLetterId(l)) unlocked.add(l);

  const letters: ProgressState['letters'] = { ...base.letters };
  if (r.letters && typeof r.letters === 'object') {
    for (const [k, v] of Object.entries(r.letters)) {
      if (!isLetterId(k) || !v || typeof v !== 'object') continue;
      const lp = v as Partial<LetterProgress>;
      letters[k] = {
        ...freshLetter('learning', today),
        ...lp,
        recent: Array.isArray(lp.recent) ? lp.recent.slice(-RECENT_WINDOW) : [],
      };
    }
  }

  return {
    version: 1,
    unlocked: UKRAINIAN_ALPHABET.filter((l) => unlocked.has(l)),
    letters,
    reading: r.reading && typeof r.reading === 'object' ? r.reading : {},
    missions: r.missions && typeof r.missions === 'object' ? r.missions : {},
    stickers: Array.isArray(r.stickers) ? r.stickers : [],
    stars: typeof r.stars === 'number' && r.stars >= 0 ? Math.floor(r.stars) : 0,
    settings: normalizeSettings(r.settings),
  };
}

function letterOf(state: ProgressState, id: LetterId, today: string): LetterProgress {
  return state.letters[id] ?? freshLetter('learning', today);
}

export function applyExerciseResult(state: ProgressState, result: ExerciseResult, today = todayISO()): ProgressState {
  let next: ProgressState = { ...state, stars: state.stars + 1 };
  if (result.letters?.length) {
    const letters = { ...next.letters };
    for (const o of result.letters) {
      const cur = letterOf(next, o.id, today);
      const review = nextReview(cur, o.firstTry, today);
      letters[o.id] = {
        ...cur,
        ...review,
        seen: cur.seen + 1,
        firstTry: cur.firstTry + (o.firstTry ? 1 : 0),
        recent: [...cur.recent, o.firstTry].slice(-RECENT_WINDOW),
      };
    }
    next = { ...next, letters };
  }
  if (result.reading) next = logReading(next, result.reading.text, result.reading.alone, today);
  return next;
}

export function logReading(state: ProgressState, text: string, alone: boolean, today = todayISO()): ProgressState {
  const key = text.toLocaleLowerCase('uk-UA');
  const cur = state.reading[key] ?? { alone: 0, helped: 0 };
  return {
    ...state,
    reading: {
      ...state.reading,
      [key]: {
        alone: cur.alone + (alone ? 1 : 0),
        helped: cur.helped + (alone ? 0 : 1),
        last: alone ? 'alone' : 'helped',
        lastAt: today,
      },
    },
  };
}

export interface MissionSummary {
  missionId: string;
  sticker: string;
  scored: number;
  hinted: number;
  readAlone: number;
  readTotal: number;
}

export function completeMission(state: ProgressState, s: MissionSummary, today = todayISO()): ProgressState {
  const prev = state.missions[s.missionId];
  return {
    ...state,
    missions: {
      ...state.missions,
      [s.missionId]: {
        completions: (prev?.completions ?? 0) + 1,
        lastCompletedAt: today,
        lastHintRate: s.scored ? s.hinted / s.scored : 0,
        lastReadAlone: s.readAlone,
        lastReadTotal: s.readTotal,
      },
    },
    stickers: state.stickers.includes(s.sticker) ? state.stickers : [...state.stickers, s.sticker],
  };
}

export function setLetterStatus(state: ProgressState, id: LetterId, status: LetterStatus, today = todayISO()): ProgressState {
  return { ...state, letters: { ...state.letters, [id]: { ...letterOf(state, id, today), status } } };
}

export function unlockLetter(state: ProgressState, id: LetterId, today = todayISO()): ProgressState {
  if (state.unlocked.includes(id)) return state;
  const unlocked = UKRAINIAN_ALPHABET.filter((l) => l === id || state.unlocked.includes(l));
  return {
    ...state,
    unlocked,
    letters: { ...state.letters, [id]: state.letters[id] ?? freshLetter('learning', today) },
  };
}

export function lockLetter(state: ProgressState, id: LetterId): ProgressState {
  if (BASE_LETTERS.includes(id)) return state;
  return { ...state, unlocked: state.unlocked.filter((l) => l !== id) };
}

export function updateSettings(state: ProgressState, patch: Partial<Settings>): ProgressState {
  return { ...state, settings: { ...state.settings, ...patch } };
}

/** Порада для дорослого щодо статусу букви на основі останніх відповідей. */
export function suggestStatus(lp: LetterProgress | undefined): LetterStatus | undefined {
  if (!lp || lp.recent.length < 4) return undefined;
  const ok = lp.recent.filter(Boolean).length;
  const ratio = ok / lp.recent.length;
  if (ratio >= 0.85) return 'knows';
  if (ratio >= 0.5) return 'sometimes';
  return 'learning';
}
