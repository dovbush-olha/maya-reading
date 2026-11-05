import { useState } from 'react';
import { LETTERS, lettersOf } from '../../content/alphabet';
import { HINTS, PRAISE, PRAISE_READING_ALONE, PRAISE_READING_TOGETHER, pick } from '../../content/phrases';
import type { ReadSyllableExercise, ReadWordExercise } from '../../content/types';
import { getWord } from '../../content/words';
import { chime } from '../../audio/audio';
import { playRecording, soundKey, useRecordingKeys } from '../../audio/recordings';
import { SoloRead } from '../SoloRead';
import { AdultPrompt, ColoredText, HintButton, ReadingMarks, SayButton } from '../ui';
import { caseText, stretch } from '../text';
import { SyllableSplit } from './SyllableSplit';
import type { ExerciseProps } from './types';

type Props = ExerciseProps<ReadSyllableExercise | ReadWordExercise>;

/**
 * Прочитай склад / слово. Картинка слова - тільки після читання.
 * Поділ на склади (звуки) і 🔊 - одразу або після «Підказка», як обрав дорослий.
 * Послухати, як правильно, - це підказка: так і рахуємо.
 */
export function ReadItem({ exercise, readingCase, solo, openHints, completed, onFeedback, onComplete }: Props) {
  const isWord = exercise.kind === 'read-word';
  const text = isWord ? exercise.word : exercise.syllable;
  const word = isWord ? getWord(exercise.word) : undefined;
  const [hint, setHint] = useState(false);
  const [listened, setListened] = useState(false);
  const keys = useRecordingKeys();
  const split = hint || openHints;
  const helped = hint || listened;
  const show = (t: string) => caseText(t, readingCase);
  const listen = () => setListened(true);

  const showHint = () => {
    setHint(true);
    onFeedback({ mood: 'thinking', text: isWord ? HINTS.readWordSplit : HINTS.readSplit });
  };

  const mark = (alone: boolean) => {
    chime();
    onFeedback({ mood: 'cheer', text: pick(alone ? PRAISE_READING_ALONE : PRAISE_READING_TOGETHER) });
    onComplete({ hinted: helped || !alone, reading: { text, alone } });
  };

  // Сама: читання ніхто не перевіряє, тому не пишемо його в журнал читання.
  const soloDone = () => {
    chime();
    onFeedback({ mood: 'cheer', text: pick(PRAISE) });
    onComplete({ hinted: helped });
  };

  return (
    <div className={`exercise exercise--read ${isWord ? 'exercise--read-word' : ''}`}>
      <div className={`read-card ${completed && word ? 'read-card--revealed' : ''}`}>
        {!split || completed ? (
          <ColoredText text={show(text)} className={`reading-text ${isWord ? 'reading-text--word' : 'reading-text--syllable'} ${text.length > 6 ? 'reading-text--long' : ''}`} />
        ) : word ? (
          <SyllableSplit entry={word} readingCase={readingCase} speak onSpeak={listen} />
        ) : (
          <span className="sound-split">
            {lettersOf(text).map((l, i, all) => (
              <span key={i} className="sound-split__part">
                {keys.has(soundKey(l)) ? (
                  <button
                    type="button"
                    className={`sound-split__letter sound-split__letter--say colored__ch--${LETTERS[l].kind}`}
                    onClick={() => {
                      void playRecording(soundKey(l));
                      listen();
                    }}
                    aria-label={`Послухати звук ${LETTERS[l].sound}`}
                  >
                    {show(l)}
                  </button>
                ) : (
                  <span className={`sound-split__letter colored__ch--${LETTERS[l].kind}`}>{show(l)}</span>
                )}
                <span className="sound-split__say">{stretch(l)}</span>
                {i < all.length - 1 && <span className="sound-split__arrow" aria-hidden="true" />}
              </span>
            ))}
          </span>
        )}

        {completed && word && (
          <div className="word-reveal" aria-live="polite">
            <span className="word-reveal__picture">{word.picture}</span>
          </div>
        )}
      </div>

      {!completed && (
        <>
          {!solo && (
            <AdultPrompt>
              {word ? (
                <>
                  Нехай Майя прочитає по складах{split ? <>: <b>{word.split}</b></> : ''}. Не підказуйте одразу - картинка з’явиться після читання.
                </>
              ) : (
                <>Нехай Майя протягне перший звук і плавно перейде до другого. Не називайте склад першими.</>
              )}
            </AdultPrompt>
          )}
          <div className="exercise__tools">
            {split ? <SayButton text={text} onPlay={listen} /> : <HintButton onClick={showHint} />}
          </div>
          {solo ? <SoloRead text={text} onDone={soloDone} /> : <ReadingMarks onMark={mark} />}
        </>
      )}
      {completed && word?.note && !solo && <p className="word-note">{word.note}</p>}
    </div>
  );
}
