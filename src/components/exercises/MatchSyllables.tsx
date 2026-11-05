import { useState } from 'react';
import { HINTS, PRAISE, PRAISE_AFTER_HINT, pick } from '../../content/phrases';
import type { MatchSyllablesExercise } from '../../content/types';
import { chime } from '../../audio/audio';
import { makeRng, shuffle } from '../../logic/generate';
import { ColoredText, HintButton } from '../ui';
import { caseText } from '../text';
import type { ExerciseProps } from './types';

interface Card {
  id: number;
  text: string;
}

/** Знайди однакові склади: усі картки відкриті - тренуємо читання й уважність, а не пам'ять. */
export function MatchSyllables({ exercise, seed, readingCase, completed, onFeedback, onComplete }: ExerciseProps<MatchSyllablesExercise>) {
  const [cards] = useState<Card[]>(() =>
    shuffle(
      exercise.syllables.flatMap((text, i) => [
        { id: i * 2, text },
        { id: i * 2 + 1, text },
      ]),
      makeRng(seed),
    ),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const show = (t: string) => caseText(t, readingCase);

  const selectedCard = cards.find((c) => c.id === selected);
  const showPairHint = (hintUsed || mistakes >= 2) && selectedCard;

  const tap = (card: Card) => {
    if (completed || matched.includes(card.id) || wrong.length) return;
    if (selected === null) {
      setSelected(card.id);
      return;
    }
    if (selected === card.id) {
      setSelected(null);
      return;
    }
    const first = cards.find((c) => c.id === selected)!;
    if (first.text === card.text) {
      chime();
      const next = [...matched, first.id, card.id];
      setMatched(next);
      setSelected(null);
      if (next.length === cards.length) {
        const hinted = mistakes > 0 || hintUsed;
        onFeedback({ mood: 'cheer', text: pick(hinted ? PRAISE_AFTER_HINT : PRAISE) });
        onComplete({ hinted });
      } else {
        onFeedback({ mood: 'happy', text: pick(PRAISE) });
      }
    } else {
      setWrong([first.id, card.id]);
      setMistakes((m) => m + 1);
      onFeedback({ mood: 'thinking', text: HINTS.matchWrong });
      window.setTimeout(() => {
        setWrong([]);
        setSelected(null);
      }, 650);
    }
  };

  const hint = () => {
    setHintUsed(true);
    onFeedback({ mood: 'thinking', text: selected === null ? HINTS.matchPickFirst : HINTS.matchGlow });
  };

  return (
    <div className="exercise exercise--match">
      <div className={`match-grid match-grid--${cards.length}`}>
        {cards.map((c) => {
          const isMatched = matched.includes(c.id);
          const isSelected = selected === c.id;
          const isWrong = wrong.includes(c.id);
          const isPair = showPairHint && c.id !== selected && c.text === selectedCard!.text && !isMatched;
          return (
            <button
              key={c.id}
              type="button"
              className={[
                'match-card',
                isMatched && 'match-card--matched',
                isSelected && 'match-card--selected',
                isWrong && 'match-card--wrong',
                isPair && 'match-card--glow',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => tap(c)}
              disabled={isMatched || completed}
              aria-pressed={isSelected}
              aria-label={`Склад ${c.text}`}
            >
              <ColoredText text={show(c.text)} className="reading-text reading-text--card" />
              {isMatched && (
                <span className="match-card__check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="exercise__tools">
        <HintButton onClick={hint} disabled={completed} />
      </div>
    </div>
  );
}
