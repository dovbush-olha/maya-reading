import type { HelperMood } from '../Helper';
import type { ExerciseResult } from '../../logic/progress';
import type { ReadingCase } from '../text';

export interface HelperFeedback {
  mood: HelperMood;
  text: string;
}

export interface ExerciseProps<E> {
  exercise: E;
  seed: string;
  readingCase: ReadingCase;
  /** Дитина грається сама: без підказок для дорослого і без його відміток. */
  solo: boolean;
  /** Склади з дужками й кнопка 🔊 видно одразу, без натискання «Підказка». */
  openHints: boolean;
  completed: boolean;
  onFeedback: (f: HelperFeedback) => void;
  onComplete: (r: ExerciseResult) => void;
}
