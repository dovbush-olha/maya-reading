import type { WordEntry } from '../../content/types';
import { wordsOf } from '../../content/words';
import { ColoredText } from '../ui';
import { caseText, type ReadingCase } from '../text';

/** Слово або фраза, розділені на склади з дужками під ними - як у букварі. */
export function SyllableSplit({ entry, readingCase }: { entry: WordEntry; readingCase: ReadingCase }) {
  return (
    <span className="syllable-split">
      {wordsOf(entry).map((syllables, w) => (
        <span key={w} className="syllable-split__word">
          {syllables.map((s, i) => (
            <span key={i} className="syllable-split__part">
              <ColoredText text={caseText(s, readingCase)} className="reading-text reading-text--split" />
              <span className="syllable-split__arc" aria-hidden="true" />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
