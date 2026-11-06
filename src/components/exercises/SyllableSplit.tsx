import { useState, type CSSProperties } from 'react';
import type { WordEntry } from '../../content/types';
import { wordsOf } from '../../content/words';
import { playRecording, useRecordingKeys } from '../../audio/recordings';
import { sayKey } from '../../logic/voice';
import { ColoredText } from '../ui';
import { caseText, type ReadingCase } from '../text';

interface SyllableProps {
  text: string;
  readingCase: ReadingCase;
  /** Порядковий номер складу: кульки біжать по дужках по черзі, склад за складом. */
  index?: number;
  big?: boolean;
  /** Склад, для якого є запис дорослого, можна торкнути й почути. */
  speak?: boolean;
  onSpeak?: () => void;
}

/**
 * Склад на дужці, як у букварі. Букви складу стоять щільно на одній плашці,
 * а кулька біжить по дужці від першої букви до останньої - так видно,
 * що склад читається разом, одним протяжним звуком, а не по буквах.
 * Торкнувшись складу, можна пустити кульку ще раз (і почути запис, якщо він є).
 */
export function Syllable({ text, readingCase, index = 0, big = false, speak = false, onSpeak }: SyllableProps) {
  const keys = useRecordingKeys();
  const [run, setRun] = useState(0);
  const canSay = speak && keys.has(sayKey(text));

  const replay = () => {
    setRun((r) => r + 1);
    if (canSay) {
      void playRecording(sayKey(text));
      onSpeak?.();
    }
  };

  return (
    <button
      key={run}
      type="button"
      className={['syl', big && 'syl--big', run > 0 && 'syl--replay', canSay && 'syl--say'].filter(Boolean).join(' ')}
      style={{ '--i': index } as CSSProperties}
      onClick={replay}
      aria-label={canSay ? `Послухати склад ${text}` : `Склад ${text}`}
    >
      <ColoredText text={caseText(text, readingCase)} className={`reading-text ${big ? 'reading-text--syllable' : 'reading-text--split'}`} />
      <span className="syl__arc" aria-hidden="true">
        <span className="syl__track">
          <span className="syl__ball" />
        </span>
      </span>
    </button>
  );
}

interface Props {
  entry: WordEntry;
  readingCase: ReadingCase;
  speak?: boolean;
  onSpeak?: () => void;
}

/** Слово або фраза, розділені на склади з дужками під ними. Між словами - широкий проміжок. */
export function SyllableSplit({ entry, readingCase, speak = false, onSpeak }: Props) {
  const words = wordsOf(entry);
  // Номер першого складу кожного слова в усій фразі - щоб кульки бігли по черзі через усю фразу.
  const offsets = words.map((_, w) => words.slice(0, w).reduce((n, syllables) => n + syllables.length, 0));
  return (
    <span className="syllable-split">
      {words.map((syllables, w) => (
        <span key={w} className="syllable-split__word">
          {syllables.map((s, i) => (
            <Syllable key={i} text={s} readingCase={readingCase} index={offsets[w] + i} speak={speak} onSpeak={onSpeak} />
          ))}
        </span>
      ))}
    </span>
  );
}
