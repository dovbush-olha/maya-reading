import { useState } from 'react';
import { HINTS, PRAISE_AFTER_HINT, PRAISE_READING_ALONE, TRY_AGAIN, pick } from '../../content/phrases';
import type { PickPictureExercise } from '../../content/types';
import { getWord } from '../../content/words';
import { chime } from '../../audio/audio';
import { ColoredText, HintButton } from '../ui';
import { caseText } from '../text';
import { SyllableSplit } from './SyllableSplit';
import type { ExerciseProps } from './types';

/**
 * Прочитай слово і знайди картинку. Так дитина, яка грається сама,
 * показує, що справді прочитала: результат іде в журнал читання.
 */
export function PickPicture({ exercise, readingCase, completed, onFeedback, onComplete }: ExerciseProps<PickPictureExercise>) {
  const word = getWord(exercise.word);
  const [tried, setTried] = useState<string[]>([]);
  const [level, setLevel] = useState(0);

  const raise = (afterMistake: boolean) => {
    const next = Math.min(2, level + 1);
    setLevel(next);
    const text = next === 1 ? HINTS.pickWrong : HINTS.pickGlow;
    onFeedback({ mood: 'thinking', text: afterMistake && next === 1 ? `${pick(TRY_AGAIN)} ${text}` : text });
  };

  const choose = (key: string) => {
    if (completed || tried.includes(key)) return;
    if (key === exercise.word) {
      const hinted = level > 0 || tried.length > 0;
      chime();
      onFeedback({ mood: 'cheer', text: pick(hinted ? PRAISE_AFTER_HINT : PRAISE_READING_ALONE) });
      onComplete({ hinted, reading: { text: word.text, alone: !hinted } });
    } else {
      setTried((t) => [...t, key]);
      raise(true);
    }
  };

  return (
    <div className="exercise exercise--pick">
      <div className={`read-card ${completed ? 'read-card--revealed' : ''}`}>
        {level >= 1 && !completed ? (
          <SyllableSplit entry={word} readingCase={readingCase} />
        ) : (
          <ColoredText text={caseText(word.text, readingCase)} className={`reading-text reading-text--word ${word.text.length > 6 ? 'reading-text--long' : ''}`} />
        )}
      </div>

      <div className="picture-row">
        {exercise.options.map((key) => {
          const isTarget = key === exercise.word;
          const isTried = tried.includes(key);
          return (
            <button
              key={key}
              type="button"
              className={[
                'picture-tile',
                isTried && 'picture-tile--tried',
                level >= 2 && !completed && !isTarget && 'picture-tile--dim',
                level >= 2 && !completed && isTarget && 'picture-tile--glow',
                completed && isTarget && 'picture-tile--correct',
                completed && !isTarget && 'picture-tile--rest',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => choose(key)}
              disabled={completed || isTried}
              aria-label="Картинка"
            >
              <span>{getWord(key).picture}</span>
            </button>
          );
        })}
      </div>

      <div className="exercise__tools">
        <HintButton onClick={() => raise(false)} disabled={completed || level >= 2} />
      </div>
    </div>
  );
}
