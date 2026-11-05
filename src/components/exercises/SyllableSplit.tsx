import type { WordEntry } from '../../content/types';
import { wordsOf } from '../../content/words';
import { playRecording, useRecordingKeys } from '../../audio/recordings';
import { sayKey } from '../../logic/voice';
import { ColoredText } from '../ui';
import { caseText, type ReadingCase } from '../text';

interface Props {
  entry: WordEntry;
  readingCase: ReadingCase;
  /** Склад, для якого є запис дорослого, можна торкнути й почути. */
  speak?: boolean;
  onSpeak?: () => void;
}

/** Слово або фраза, розділені на склади з дужками під ними - як у букварі. */
export function SyllableSplit({ entry, readingCase, speak = false, onSpeak }: Props) {
  const keys = useRecordingKeys();
  return (
    <span className="syllable-split">
      {wordsOf(entry).map((syllables, w) => (
        <span key={w} className="syllable-split__word">
          {syllables.map((s, i) => {
            const content = (
              <>
                <ColoredText text={caseText(s, readingCase)} className="reading-text reading-text--split" />
                <span className="syllable-split__arc" aria-hidden="true" />
              </>
            );
            return speak && keys.has(sayKey(s)) ? (
              <button
                key={i}
                type="button"
                className="syllable-split__part syllable-split__part--say"
                onClick={() => {
                  void playRecording(sayKey(s));
                  onSpeak?.();
                }}
                aria-label={`Послухати склад ${s}`}
              >
                {content}
              </button>
            ) : (
              <span key={i} className="syllable-split__part">
                {content}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
