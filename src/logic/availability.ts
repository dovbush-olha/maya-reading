import { BASE_LETTERS, PLANNED_LETTERS, type LetterId } from '../content/alphabet';
import type { Mission } from '../content/types';
import { WEEK_1_MISSIONS } from '../content/week1';
import type { ProgressState } from './progress';

export type MissionAvailability = 'done' | 'available' | 'needs-letters' | 'locked';

/** Якщо в останньому проходженні підказки знадобилися частіше, радимо повторити місію. */
export const STRUGGLE_HINT_RATE = 0.4;
/** Скільки разів поспіль радимо повторити складну місію, перш ніж іти далі. */
export const MAX_SUGGESTED_REPEATS = 3;

export function missingLetters(state: ProgressState, mission: Mission): LetterId[] {
  return mission.requires.filter((l) => !state.unlocked.includes(l));
}

export function missionAvailability(state: ProgressState, mission: Mission, missions = WEEK_1_MISSIONS): MissionAvailability {
  if (state.missions[mission.id]?.completions) return 'done';
  if (missingLetters(state, mission).length) return 'needs-letters';
  const index = missions.findIndex((m) => m.id === mission.id);
  const prev = index > 0 ? missions[index - 1] : undefined;
  if (prev && !state.missions[prev.id]?.completions) return 'locked';
  return 'available';
}

export type Recommendation =
  | { kind: 'mission'; mission: Mission; reason: 'next' | 'repeat' }
  | { kind: 'practice'; reason: 'needs-letters'; letters: LetterId[]; waitingMission: Mission }
  | { kind: 'practice'; reason: 'week-done' };

export function recommend(state: ProgressState, missions = WEEK_1_MISSIONS): Recommendation {
  const index = missions.findIndex((m) => !state.missions[m.id]?.completions);
  if (index === -1) return { kind: 'practice', reason: 'week-done' };
  const next = missions[index];
  const prev = index > 0 ? missions[index - 1] : undefined;
  const prevRecord = prev ? state.missions[prev.id] : undefined;
  if (prev && prevRecord && prevRecord.lastHintRate > STRUGGLE_HINT_RATE && prevRecord.completions < MAX_SUGGESTED_REPEATS) {
    return { kind: 'mission', mission: prev, reason: 'repeat' };
  }
  const missing = missingLetters(state, next);
  if (missing.length) return { kind: 'practice', reason: 'needs-letters', letters: missing, waitingMission: next };
  return { kind: 'mission', mission: next, reason: 'next' };
}

export interface UnlockAdvice {
  letter: LetterId;
  ready: boolean;
  message: string;
}

/** Порада дорослому: чи час відкривати наступну букву з плану. Сама програма букви не відкриває. */
export function adviseNextLetter(state: ProgressState, missions = WEEK_1_MISSIONS): UnlockAdvice | undefined {
  const letter = PLANNED_LETTERS.find((l) => !state.unlocked.includes(l));
  if (!letter) return undefined;

  const newest = [...PLANNED_LETTERS].reverse().find((l) => state.unlocked.includes(l)) ?? BASE_LETTERS[BASE_LETTERS.length - 1];
  const reachable = missions.filter((m) => m.requires.every((l) => state.unlocked.includes(l)));
  const pending = reachable.filter((m) => !state.missions[m.id]?.completions);
  if (pending.length) {
    return {
      letter,
      ready: false,
      message: `Спершу варто пройти доступні місії (залишилось ${pending.length}). Букву ${letter} можна відкрити й зараз, якщо в школі її вже вчили.`,
    };
  }

  const lp = state.letters[newest];
  const recent = lp?.recent ?? [];
  const ratio = recent.length ? recent.filter(Boolean).length / recent.length : 0;
  if (recent.length >= 4 && ratio >= 0.67 && lp?.status !== 'learning') {
    return { letter, ready: true, message: `Майя добре впізнає ${newest}. Можна відкривати ${letter}.` };
  }
  if (recent.length >= 4 && ratio >= 0.67) {
    return {
      letter,
      ready: true,
      message: `Майя здебільшого впізнає ${newest} з першого разу. Якщо погоджуєтесь, позначте ${newest} як «Знає» або «Іноді забуває» і відкривайте ${letter}.`,
    };
  }
  return {
    letter,
    ready: false,
    message: `${newest} поки що іноді плутається. Пограйте «Повторення в лісі» ще раз-два - поспішати не потрібно.`,
  };
}
