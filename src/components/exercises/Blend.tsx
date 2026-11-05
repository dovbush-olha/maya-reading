import { useState } from 'react';
import { LETTERS, toLower, type LetterId } from '../../content/alphabet';
import { HINTS, PRAISE, PRAISE_READING_ALONE, PRAISE_READING_TOGETHER, pick } from '../../content/phrases';
import type { BlendExercise } from '../../content/types';
import { chime } from '../../audio/audio';
import { hasRecording, playRecording, soundKey } from '../../audio/recordings';
import { AdultPrompt, ColoredText, ReadingMarks, SoloReadButton } from '../ui';
import { caseText, stretch } from '../text';
import type { ExerciseProps } from './types';

/** З'єднай два звуки: торкаємося по черзі, і букви «з'їжджаються» в склад. */
export function Blend({ exercise, readingCase, solo, completed, onFeedback, onComplete }: ExerciseProps<BlendExercise>) {
  const [a, b] = exercise.sounds;
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const syllable = toLower(a + b);
  const show = (l: string) => caseText(l, readingCase);
  const sound = (l: LetterId) => {
    if (hasRecording(soundKey(l))) void playRecording(soundKey(l));
  };

  const tap = (which: 0 | 1) => {
    if (completed) return;
    sound(which === 0 ? a : b);
    if (which !== step) {
      if (step < 2) onFeedback({ mood: 'thinking', text: step === 0 ? HINTS.blendStart : HINTS.blendNext });
      return;
    }
    if (which === 0) {
      setStep(1);
      onFeedback({ mood: 'idle', text: HINTS.blendNext });
    } else {
      chime();
      setStep(2);
      onFeedback({ mood: 'happy', text: solo ? HINTS.soloRead : HINTS.blendDone });
    }
  };

  const mark = (alone: boolean) => {
    chime();
    onFeedback({ mood: 'cheer', text: pick(alone ? PRAISE_READING_ALONE : PRAISE_READING_TOGETHER) });
    onComplete({ hinted: !alone, reading: { text: syllable, alone } });
  };

  const soloDone = () => {
    chime();
    onFeedback({ mood: 'cheer', text: pick(PRAISE) });
    onComplete({ hinted: false });
  };

  return (
    <div className="exercise exercise--blend">
      <div className={`blend blend--step-${step}`}>
        <button
          type="button"
          className={`blend__tile blend__tile--a blend__tile--${LETTERS[a].kind} ${step === 0 ? 'blend__tile--next' : ''}`}
          onClick={() => tap(0)}
          aria-label="Перший звук"
        >
          <span className="letter-glyph">{show(a)}</span>
        </button>
        <span className="blend__bridge" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <button
          type="button"
          className={`blend__tile blend__tile--b blend__tile--${LETTERS[b].kind} ${step === 1 ? 'blend__tile--next' : ''}`}
          onClick={() => tap(1)}
          aria-label="Другий звук"
        >
          <span className="letter-glyph">{show(b)}</span>
        </button>
      </div>

      {step === 2 && (
        <div className="blend__result">
          <ColoredText text={show(syllable)} className="reading-text reading-text--syllable" />
        </div>
      )}

      {!solo && (
        <AdultPrompt>
          {step === 0 && (
            <>
              Коли Майя торкнеться першої букви, протягніть разом <b>{LETTERS[a].sound}</b>: {stretch(a)}.
            </>
          )}
          {step === 1 && (
            <>
              Тепер другий звук <b>{LETTERS[b].sound}</b>: {stretch(b)}.
            </>
          )}
          {step === 2 && (
            <>
              З’єднайте без паузи: <b>«{stretch(a)}{toLower(b)}»</b> - <b>«{syllable}»</b>.
            </>
          )}
        </AdultPrompt>
      )}

      {step === 2 && !completed && (solo ? <SoloReadButton onDone={soloDone} /> : <ReadingMarks onMark={mark} />)}
    </div>
  );
}
