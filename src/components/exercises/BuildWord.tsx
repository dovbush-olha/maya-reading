import { useState } from 'react';
import { HINTS, PRAISE, PRAISE_READING_ALONE, PRAISE_READING_TOGETHER, TRY_AGAIN, pick } from '../../content/phrases';
import type { BuildWordExercise } from '../../content/types';
import { getWord, syllablesOf } from '../../content/words';
import { chime } from '../../audio/audio';
import { makeRng, shuffle } from '../../logic/generate';
import { SoloRead } from '../SoloRead';
import { AdultPrompt, ColoredText, HintButton, ReadingMarks } from '../ui';
import { caseText } from '../text';
import type { ExerciseProps } from './types';

interface Tile {
  id: number;
  text: string;
}

/**
 * Склади слово зі складів по порядку, а потім прочитай його.
 * З дорослим - він каже слово по складах. Сама - підказкою є однозначна картинка.
 */
export function BuildWord({ exercise, seed, readingCase, solo, completed, onFeedback, onComplete }: ExerciseProps<BuildWordExercise>) {
  const word = getWord(exercise.word);
  const parts = syllablesOf(word);
  const [tiles] = useState<Tile[]>(() =>
    shuffle(
      [...parts, ...exercise.distractors].map((text, id) => ({ id, text })),
      makeRng(seed),
    ),
  );
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [glow, setGlow] = useState(false);
  const show = (t: string) => caseText(t, readingCase);
  const showPicture = solo && word.clear;

  const built = placed.length === parts.length;
  const expected = parts[placed.length];
  const glowTile = glow && !built ? tiles.find((t) => !placed.includes(t.id) && t.text === expected)?.id : undefined;

  const tap = (tile: Tile) => {
    if (built || placed.includes(tile.id)) return;
    if (tile.text === expected) {
      const next = [...placed, tile.id];
      setPlaced(next);
      setGlow(false);
      if (next.length === parts.length) {
        chime();
        onFeedback({ mood: 'happy', text: HINTS.buildDone });
      } else {
        onFeedback({ mood: 'happy', text: HINTS.buildMore });
      }
    } else {
      setShake(tile.id);
      window.setTimeout(() => setShake(null), 500);
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= 2) setGlow(true);
      onFeedback({ mood: 'thinking', text: m >= 2 ? HINTS.buildGlow : `${pick(TRY_AGAIN)} ${HINTS.buildNext}` });
    }
  };

  const hint = () => {
    setGlow(true);
    setMistakes((m) => Math.max(m, 1));
    onFeedback({ mood: 'thinking', text: HINTS.buildGlow });
  };

  const mark = (alone: boolean) => {
    chime();
    onFeedback({ mood: 'cheer', text: pick(alone ? PRAISE_READING_ALONE : PRAISE_READING_TOGETHER) });
    onComplete({ hinted: mistakes > 0 || !alone, reading: { text: word.text, alone } });
  };

  const soloDone = () => {
    chime();
    onFeedback({ mood: 'cheer', text: pick(PRAISE) });
    onComplete({ hinted: mistakes > 0 });
  };

  return (
    <div className="exercise exercise--build">
      {showPicture && !completed && (
        <div className="picture-prompt" aria-label="Яке це слово?">
          <span>{word.picture}</span>
        </div>
      )}
      {!solo && !built && (
        <AdultPrompt>
          Скажіть слово по складах: <b>«{word.split}»</b>. Потім повторіть перший склад, коли Майя шукатиме.
        </AdultPrompt>
      )}

      <div className={`word-slots ${built ? 'word-slots--built' : ''} ${completed ? 'word-slots--revealed' : ''}`}>
        {parts.map((_, i) => {
          const tile = tiles.find((t) => t.id === placed[i]);
          return (
            <span key={i} className={`word-slot ${tile ? 'word-slot--filled' : ''} ${i === placed.length && !built ? 'word-slot--next' : ''}`}>
              {tile && <ColoredText text={show(tile.text)} className="reading-text reading-text--tile" />}
            </span>
          );
        })}
        {completed && (
          <span className="word-reveal word-reveal--inline" aria-live="polite">
            <span className="word-reveal__picture">{word.picture}</span>
          </span>
        )}
      </div>

      {!built && (
        <>
          <div className="tile-pool">
            {tiles.map((t) => {
              const used = placed.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={[
                    'syllable-tile',
                    used && 'syllable-tile--used',
                    shake === t.id && 'syllable-tile--shake',
                    glowTile === t.id && 'syllable-tile--glow',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => tap(t)}
                  disabled={used}
                  aria-label={`Склад ${t.text}`}
                >
                  <ColoredText text={show(t.text)} className="reading-text reading-text--tile" />
                </button>
              );
            })}
          </div>
          <div className="exercise__tools">
            <HintButton onClick={hint} disabled={glow} />
          </div>
        </>
      )}

      {built && !completed && (
        <>
          {!solo && <AdultPrompt>Нехай Майя прочитає складене слово. Картинка з’явиться після читання.</AdultPrompt>}
          {solo ? <SoloRead text={word.text} onDone={soloDone} /> : <ReadingMarks onMark={mark} />}
        </>
      )}
      {completed && word.note && !solo && <p className="word-note">{word.note}</p>}
    </div>
  );
}
