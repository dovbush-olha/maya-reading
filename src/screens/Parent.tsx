import { useMemo, useState } from 'react';
import { BASE_LETTERS, LETTERS, NOT_YET_STUDIED, PLANNED_LETTERS, UKRAINIAN_ALPHABET, toLower, type LetterId } from '../content/alphabet';
import { CHILD_NAME } from '../content/phrases';
import type { Mission } from '../content/types';
import { WEEK_1, WEEK_1_MISSIONS } from '../content/week1';
import { clearReadings, playReading, removeReading, usePendingReadings } from '../audio/readings';
import { canRecord, deleteRecording, playRecording, requestMicrophone, saveRecording, soundKey, startRecording, useRecordingKeys } from '../audio/recordings';
import { HELPERS } from '../content/helpers';
import { Helper } from '../components/Helper';
import { Modal } from '../components/ui';
import { adviseNextLetter, missingLetters, missionAvailability } from '../logic/availability';
import { availableSyllables } from '../logic/generate';
import {
  LETTER_STATUS_LABEL,
  lockLetter,
  logReading,
  setLetterStatus,
  suggestStatus,
  todayISO,
  unlockLetter,
  updateSettings,
  type LetterStatus,
  type Settings,
} from '../logic/progress';
import { resetProgress, updateProgress, useProgress } from '../store/progressStore';
import { plural } from '../components/text';
import type { PendingReading } from '../logic/readingQueue';

type Tab = 'letters' | 'reading' | 'missions' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'letters', label: 'Букви', icon: '🔤' },
  { id: 'reading', label: 'Читання складів', icon: '📖' },
  { id: 'missions', label: 'Місії й прогрес', icon: '🗺️' },
  { id: 'settings', label: 'Налаштування', icon: '⚙️' },
];

interface Props {
  onBack: () => void;
  onStart: (mission: Mission | 'practice') => void;
}

export function Parent({ onBack, onStart }: Props) {
  const pending = usePendingReadings().length;
  const [tab, setTab] = useState<Tab>(pending ? 'reading' : 'letters');
  return (
    <div className="screen parent">
      <header className="parent__header">
        <button type="button" className="text-button text-button--back" onClick={onBack}>
          ← До дитячого режиму
        </button>
        <h1 className="parent__title">Для дорослих</h1>
      </header>
      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tabs__tab ${tab === t.id ? 'tabs__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
            {t.id === 'reading' && pending > 0 && (
              <span className="tabs__badge" aria-label={`нових записів: ${pending}`}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </nav>
      <main className="parent__body">
        {tab === 'letters' && <LettersTab />}
        {tab === 'reading' && <ReadingTab />}
        {tab === 'missions' && <MissionsTab onStart={onStart} />}
        {tab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

const STATUSES: LetterStatus[] = ['knows', 'sometimes', 'learning'];

function LettersTab() {
  const progress = useProgress();
  const advice = adviseNextLetter(progress);
  const [confirm, setConfirm] = useState<{ letter: LetterId; action: 'unlock' | 'lock' } | null>(null);
  const locked = UKRAINIAN_ALPHABET.filter((l) => !progress.unlocked.includes(l));
  const lockedPlanned = PLANNED_LETTERS.filter((l) => locked.includes(l));
  const lockedOther = locked.filter((l) => !PLANNED_LETTERS.includes(l));

  return (
    <>
      <section className="panel">
        <h2 className="panel__title">Букви, які {CHILD_NAME} вже вчить</h2>
        <p className="panel__hint">
          Позначте, як {CHILD_NAME} знає кожну букву. Програма лише підказує на основі останніх відповідей - рішення за вами.
        </p>
        <div className="letter-cards">
          {progress.unlocked.map((l) => {
            const lp = progress.letters[l];
            const suggestion = suggestStatus(lp);
            const status = lp?.status ?? 'learning';
            return (
              <article key={l} className={`letter-card letter-card--${status}`}>
                <div className="letter-card__head">
                  <span className={`letter-card__glyph colored__ch--${LETTERS[l].kind}`}>
                    {l}
                    <small>{toLower(l)}</small>
                  </span>
                  <span className="letter-card__sound">{LETTERS[l].sound}</span>
                </div>
                <div className="segmented" role="radiogroup" aria-label={`Статус букви ${l}`}>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={status === s}
                      className={`segmented__item segmented__item--${s} ${status === s ? 'segmented__item--active' : ''}`}
                      onClick={() => updateProgress((st) => setLetterStatus(st, l, s, todayISO()))}
                    >
                      {LETTER_STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
                <p className="letter-card__stats">
                  {lp && lp.seen
                    ? `З першого разу: ${lp.firstTry} з ${lp.seen}. Останні: ${lp.recent.map((r) => (r ? '●' : '○')).join('')}`
                    : 'Ще не траплялася у вправах'}
                </p>
                {suggestion && suggestion !== status && (
                  <button
                    type="button"
                    className="suggestion"
                    onClick={() => updateProgress((st) => setLetterStatus(st, l, suggestion, todayISO()))}
                  >
                    Схоже на «{LETTER_STATUS_LABEL[suggestion]}» - позначити?
                  </button>
                )}
                {!BASE_LETTERS.includes(l) && (
                  <button type="button" className="text-button text-button--small" onClick={() => setConfirm({ letter: l, action: 'lock' })}>
                    Сховати букву
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Додати наступну букву</h2>
        {advice ? (
          <div className={`advice ${advice.ready ? 'advice--ready' : ''}`}>
            <span className="advice__icon" aria-hidden="true">
              {advice.ready ? '🌟' : '🌱'}
            </span>
            <p>{advice.message}</p>
          </div>
        ) : (
          <p className="panel__hint">Усі букви першого тижня відкрито. Далі можна додавати букви, які вчать у школі.</p>
        )}
        {lockedPlanned.length > 0 && (
          <>
            <h3 className="panel__subtitle">План першого тижня</h3>
            <div className="unlock-grid">
              {lockedPlanned.map((l) => (
                <button key={l} type="button" className="unlock-tile unlock-tile--planned" onClick={() => setConfirm({ letter: l, action: 'unlock' })}>
                  <span className="unlock-tile__glyph">{l}</span>
                  <span className="unlock-tile__label">{l === advice?.letter ? 'наступна' : 'з місіями'}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <h3 className="panel__subtitle">Інші букви шкільної програми</h3>
        <p className="panel__hint">
          Для цих букв ще немає окремих місій: вони з’являться в «Повторенні в лісі» разом зі словами, які можна ними прочитати.
        </p>
        <div className="unlock-grid">
          {lockedOther.map((l) => (
            <button
              key={l}
              type="button"
              className={`unlock-tile ${NOT_YET_STUDIED.includes(l) ? 'unlock-tile--later' : ''}`}
              onClick={() => setConfirm({ letter: l, action: 'unlock' })}
            >
              <span className="unlock-tile__glyph">{l}</span>
              {NOT_YET_STUDIED.includes(l) && <span className="unlock-tile__label">ще не вчили</span>}
            </button>
          ))}
        </div>
      </section>

      {confirm && (
        <Modal
          title={confirm.action === 'unlock' ? `Відкрити букву ${confirm.letter}?` : `Сховати букву ${confirm.letter}?`}
          onClose={() => setConfirm(null)}
          actions={
            <>
              <button type="button" className="text-button" onClick={() => setConfirm(null)}>
                Скасувати
              </button>
              <button
                type="button"
                className="big-button big-button--small"
                onClick={() => {
                  const { letter, action } = confirm;
                  updateProgress((s) => (action === 'unlock' ? unlockLetter(s, letter, todayISO()) : lockLetter(s, letter)));
                  setConfirm(null);
                }}
              >
                {confirm.action === 'unlock' ? 'Відкрити' : 'Сховати'}
              </button>
            </>
          }
        >
          {confirm.action === 'unlock' ? (
            <>
              <p>
                Звук {LETTERS[confirm.letter].sound}: {LETTERS[confirm.letter].say}. Буква з’явиться у вправах, а нові місії з нею
                стануть доступними.
              </p>
              {NOT_YET_STUDIED.includes(confirm.letter) && (
                <p className="warning">Цю букву в школі ще не вивчали. Відкривайте, лише якщо {CHILD_NAME} вже з нею знайома.</p>
              )}
            </>
          ) : (
            <p>Буква зникне з вправ. Прогрес по ній збережеться, і її можна буде відкрити знову.</p>
          )}
        </Modal>
      )}
    </>
  );
}

function weekSyllables(): string[] {
  const set = new Set<string>();
  for (const m of WEEK_1_MISSIONS) {
    for (const e of m.exercises) {
      if (e.kind === 'read-syllable') set.add(e.syllable);
      if (e.kind === 'blend') set.add(toLower(e.sounds.join('')));
      if (e.kind === 'match-syllables') e.syllables.forEach((s) => set.add(s));
    }
  }
  return [...set];
}

function ReadingTab() {
  const progress = useProgress();
  const items = useMemo(() => {
    const syllables = new Set([...weekSyllables(), ...availableSyllables(progress.unlocked)]);
    const readable = [...syllables].filter((s) => [...s.toLocaleUpperCase('uk-UA')].every((l) => progress.unlocked.includes(l as LetterId)));
    const extra = Object.keys(progress.reading).filter((k) => !syllables.has(k));
    return { syllables: readable.sort((a, b) => a.localeCompare(b, 'uk')), words: extra.sort((a, b) => a.localeCompare(b, 'uk')) };
  }, [progress.unlocked, progress.reading]);

  const row = (text: string) => {
    const log = progress.reading[text];
    const total = (log?.alone ?? 0) + (log?.helped ?? 0);
    const state = !log ? 'new' : log.last === 'alone' ? 'alone' : 'helped';
    return (
      <li key={text} className={`read-row read-row--${state}`}>
        <span className="read-row__text">{text.toLocaleUpperCase('uk-UA')}</span>
        <span className="read-row__stats">
          {total ? (
            <>
              <b>{log!.alone}</b> сама · <b>{log!.helped}</b> з допомогою
              <small>востаннє: {log!.last === 'alone' ? 'сама' : 'з допомогою'}</small>
            </>
          ) : (
            'ще не читала'
          )}
        </span>
        <span className="read-row__actions">
          <button type="button" className="chip chip--alone" onClick={() => updateProgress((s) => logReading(s, text, true, todayISO()))}>
            ⭐ Сама
          </button>
          <button type="button" className="chip" onClick={() => updateProgress((s) => logReading(s, text, false, todayISO()))}>
            🤝 Разом
          </button>
        </span>
      </li>
    );
  };

  return (
    <>
      <ReadingReview />
      <section className="panel">
      <h2 className="panel__title">Чи читає {CHILD_NAME} склади без допомоги</h2>
      <p className="panel__hint">
        Під час місій ви відмічаєте результат кнопками «Прочитала сама» / «Прочитали разом». Тут можна побачити підсумок і додати
        відмітку, якщо читали в книжці чи зошиті.
      </p>
      <ul className="read-list">{items.syllables.map(row)}</ul>
      {items.words.length > 0 && (
        <>
          <h3 className="panel__subtitle">Слова</h3>
          <ul className="read-list">{items.words.map(row)}</ul>
        </>
      )}
      </section>
    </>
  );
}

/** Записи того, як дитина читала сама: дорослий слухає й відмічає, і відмітка йде в журнал читання. */
function ReadingReview() {
  const { recordReading, mode } = useProgress().settings;
  const items = usePendingReadings();
  const [busy, setBusy] = useState<string | null>(null);
  if (!items.length && !(recordReading && mode === 'solo')) return null;

  const resolve = async (r: PendingReading, ok?: boolean) => {
    setBusy(r.id);
    try {
      // Спершу видаляємо запис: якщо не вийде, відмітка не задвоїться при повторному натисканні.
      await removeReading(r.id);
      if (ok !== undefined) updateProgress((s) => logReading(s, r.text, ok, todayISO(new Date(r.at))));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="panel">
      <h2 className="panel__title">Послухайте, як {CHILD_NAME} читала сама</h2>
      <p className="panel__hint">
        Натисніть ▶ і відмітьте, чи прочитала правильно. Відмітка потрапить у журнал нижче й допоможе вибирати, що повторювати, а запис
        видалиться. Записи зберігаються лише на цьому пристрої.
      </p>
      {items.length ? (
        <ul className="read-list">
          {items.map((r) => (
            <li key={r.id} className="read-row review-row">
              <button type="button" className="review-row__play" onClick={() => void playReading(r.id)} aria-label={`Послухати «${r.text}»`}>
                <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                  <path d="M6 3.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 6 3.5Z" fill="currentColor" />
                </svg>
              </button>
              <span className="review-row__info">
                <span className="read-row__text">{r.text.toLocaleUpperCase('uk-UA')}</span>
                <small className="review-row__when">{formatWhen(r.at)}</small>
              </span>
              <span className="read-row__actions">
                <button type="button" className="chip chip--alone" disabled={busy === r.id} onClick={() => void resolve(r, true)}>
                  ⭐ Правильно
                </button>
                <button type="button" className="chip" disabled={busy === r.id} onClick={() => void resolve(r, false)}>
                  🤝 Ще вчимо
                </button>
                <button
                  type="button"
                  className="chip chip--icon"
                  disabled={busy === r.id}
                  onClick={() => void resolve(r)}
                  aria-label={`Видалити запис «${r.text}» без відмітки`}
                  title="Не чути - видалити без відмітки"
                >
                  🗑
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="review-empty">Нових записів немає. Вони з’являться, коли {CHILD_NAME} пограється сама.</p>
      )}
    </section>
  );
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  const day = todayISO(d);
  if (day === todayISO()) return `сьогодні о ${time}`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === todayISO(yesterday)) return `учора о ${time}`;
  return `${formatDate(day)} о ${time}`;
}

function MissionsTab({ onStart }: { onStart: Props['onStart'] }) {
  const progress = useProgress();
  const done = WEEK_1_MISSIONS.filter((m) => progress.missions[m.id]?.completions).length;
  const letterStats = progress.unlocked.map((l) => progress.letters[l]).filter(Boolean);
  const seen = letterStats.reduce((a, l) => a + (l?.seen ?? 0), 0);
  const first = letterStats.reduce((a, l) => a + (l?.firstTry ?? 0), 0);
  const reading = Object.values(progress.reading);
  const alone = reading.reduce((a, r) => a + r.alone, 0);
  const readTotal = reading.reduce((a, r) => a + r.alone + r.helped, 0);

  return (
    <>
      <section className="stats">
        <div className="stat">
          <span className="stat__value">
            {done}
            <small>/{WEEK_1_MISSIONS.length}</small>
          </span>
          <span className="stat__label">місій пройдено</span>
        </div>
        <div className="stat">
          <span className="stat__value">{seen ? Math.round((first / seen) * 100) : 0}%</span>
          <span className="stat__label">букв упізнано з першого разу</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {alone}
            <small>/{readTotal}</small>
          </span>
          <span className="stat__label">прочитано без допомоги</span>
        </div>
        <div className="stat">
          <span className="stat__value">{progress.stickers.length}</span>
          <span className="stat__label">лісових друзів</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel__row">
          <h2 className="panel__title">Повторити будь-яку місію</h2>
          <button type="button" className="big-button big-button--small" onClick={() => onStart('practice')}>
            🍄 Повторення в лісі
          </button>
        </div>
        <p className="panel__hint">
          Місії не прив’язані до календаря: переходьте далі, коли матеріал дається легко. Якщо підказок було багато, дитячий екран
          сам запропонує повторити.
        </p>
        <div className="day-list">
          {WEEK_1.map((day) => (
            <article key={day.day} className="day-row">
              <h3 className="day-row__title">
                День {day.day}. {day.title}
              </h3>
              {day.missions.map((m) => {
                const rec = progress.missions[m.id];
                const missing = missingLetters(progress, m);
                const av = missionAvailability(progress, m);
                return (
                  <div key={m.id} className={`mission-row mission-row--${av}`}>
                    <span className="mission-row__icon" aria-hidden="true">
                      {rec ? m.sticker : m.goal === 'learn' ? '🌱' : '🍃'}
                    </span>
                    <span className="mission-row__info">
                      <b>{m.title}</b>
                      <small>
                        {m.goal === 'learn' ? 'вчимося' : 'закріплюємо'} · {m.exercises.length} завдань
                        {rec &&
                          ` · пройдено ${rec.completions} ${plural(rec.completions, 'раз', 'рази', 'разів')}, востаннє ${formatDate(rec.lastCompletedAt)} · підказки ${Math.round(rec.lastHintRate * 100)}%${rec.lastReadTotal ? ` · сама прочитала ${rec.lastReadAlone}/${rec.lastReadTotal}` : ''}`}
                      </small>
                    </span>
                    {missing.length ? (
                      <span className="mission-row__need">потрібна {missing.join(', ')}</span>
                    ) : (
                      <button type="button" className="chip chip--go" onClick={() => onStart(m)}>
                        {rec ? 'Повторити' : 'Почати'}
                      </button>
                    )}
                  </div>
                );
              })}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function SettingsTab() {
  const progress = useProgress();
  const { settings } = progress;
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (patch: Partial<Settings>) => updateProgress((s) => updateSettings(s, patch));
  return (
    <>
      <section className="panel settings">
        <h2 className="panel__title">Як грається {CHILD_NAME}</h2>
        <Choice
          title="Хто поруч"
          hint={
            settings.mode === 'solo'
              ? `Сама: слова перевіряються вибором картинки, склади - ${settings.recordReading ? 'записом читання, який ви послухаєте потім' : 'кнопкою «Прочитала!»'}, звук букви - вашим записом (якщо є).`
              : 'З дорослим: ви бачите підказки, що сказати, і відмічаєте, чи прочитала сама.'
          }
          value={settings.mode}
          options={[
            ['solo', '📱 Сама'],
            ['together', '🧑‍🏫 З дорослим'],
          ]}
          onChange={(mode) => set({ mode })}
        />
        {settings.mode === 'solo' && <RecordReadingSwitch />}
        <Choice
          title="Букви для читання складів і слів"
          hint="Усі великими, як на початку букваря, або як пишеться в книжці (імена з великої)."
          value={settings.readingCase}
          options={[
            ['upper', 'МАМА'],
            ['natural', 'мама, Міла'],
          ]}
          onChange={(readingCase) => set({ readingCase })}
        />
        <Choice
          title="Ліс"
          value={settings.theme}
          options={[
            ['day', '☀️ День'],
            ['night', '🌙 Ніч'],
          ]}
          onChange={(theme) => set({ theme })}
        />
        <label className="switch-row">
          <span>
            <b>Звуки натискань</b>
            <small>М’який звук на кожне натискання і дзвіночок за правильну відповідь. Звуків за помилку немає.</small>
          </span>
          <input type="checkbox" checked={settings.sounds} onChange={(e) => set({ sounds: e.target.checked })} />
        </label>
        <div className="switch-row switch-row--column">
          <span>
            <b>Друг у подорожі</b>
          </span>
          <div className="helper-picker helper-picker--inline">
            {HELPERS.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`helper-picker__item ${settings.helper === h.id ? 'helper-picker__item--active' : ''}`}
                onClick={() => set({ helper: h.id })}
              >
                <Helper id={h.id} size={64} />
                <span>{h.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <Recordings />

      <section className="panel">
        <button type="button" className="text-button text-button--danger" onClick={() => setConfirmReset(true)}>
          Почати спочатку (стерти прогрес)
        </button>
      </section>
      <p className="app-version">Версія {__APP_VERSION__} · {formatWhen(__BUILD_DATE__)}</p>
      {confirmReset && (
        <Modal
          title="Стерти весь прогрес?"
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <button type="button" className="text-button" onClick={() => setConfirmReset(false)}>
                Скасувати
              </button>
              <button
                type="button"
                className="big-button big-button--small big-button--danger"
                onClick={() => {
                  resetProgress();
                  void clearReadings();
                  setConfirmReset(false);
                }}
              >
                Стерти
              </button>
            </>
          }
        >
          <p>Зникнуть пройдені місії, зірочки, наліпки, статуси букв, відмітки й записи читання. Ваш голос для звуків залишиться.</p>
        </Modal>
      )}
    </>
  );
}

/** Дорослий вмикає запис читання - і одразу дає дозвіл на мікрофон, щоб дитина цього питання не бачила. */
function RecordReadingSwitch() {
  const { recordReading } = useProgress().settings;
  const [error, setError] = useState<string | null>(null);
  const available = canRecord();

  const toggle = async (on: boolean) => {
    setError(null);
    if (on && !(await requestMicrophone())) {
      setError('Не вдалося ввімкнути мікрофон. Дозвольте доступ до мікрофона в браузері й спробуйте ще раз.');
      return;
    }
    updateProgress((s) => updateSettings(s, { recordReading: on }));
  };

  return (
    <>
      <label className="switch-row">
        <span>
          <b>Записувати, як {CHILD_NAME} читає</b>
          <small>
            Замість зірочки «Прочитала!» - кнопка 🎙️: {CHILD_NAME} читає вголос і одразу чує себе. Ви послухаєте записи на вкладці
            «Читання складів» і відмітите, чи правильно. Записи залишаються лише на цьому пристрої.
          </small>
        </span>
        <input type="checkbox" checked={recordReading && available} disabled={!available} onChange={(e) => void toggle(e.target.checked)} />
      </label>
      {!available && (
        <p className="warning">Запис доступний, коли застосунок відкрито через захищене з’єднання (https) або на цьому комп’ютері (localhost).</p>
      )}
      {error && <p className="warning">{error}</p>}
    </>
  );
}

function Choice<T extends string>({
  title,
  hint,
  value,
  options,
  onChange,
}: {
  title: string;
  hint?: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="switch-row switch-row--choice">
      <span>
        <b>{title}</b>
        {hint && <small>{hint}</small>}
      </span>
      <div className="segmented segmented--compact" role="radiogroup" aria-label={title}>
        {options.map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            className={`segmented__item ${value === v ? 'segmented__item--active' : ''}`}
            onClick={() => onChange(v)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Дорослий записує звуки букв своїм голосом - їх чує дитина, коли грається сама. */
function Recordings() {
  const progress = useProgress();
  const keys = useRecordingKeys();
  const [recording, setRecording] = useState<{ letter: LetterId; stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const letters = UKRAINIAN_ALPHABET.filter((l) => progress.unlocked.includes(l) || PLANNED_LETTERS.includes(l));
  const done = letters.filter((l) => keys.has(soundKey(l))).length;

  const start = async (letter: LetterId) => {
    setError(null);
    try {
      const r = await startRecording(2500);
      setRecording({ letter, stop: r.stop });
      const blob = await r.done;
      await saveRecording(soundKey(letter), blob);
      void playRecording(soundKey(letter));
    } catch {
      setError('Не вдалося ввімкнути мікрофон. Дозвольте доступ до мікрофона в браузері.');
    } finally {
      setRecording(null);
    }
  };

  return (
    <section className="panel">
      <h2 className="panel__title">Ваш голос для звуків</h2>
      <p className="panel__hint">
        Коли {CHILD_NAME} грається сама, вона чує звук букви вашим голосом. Натисніть 🎙️, скажіть сам звук (не назву букви):
        протяжне «м-м-м», коротке «к!». Запис зупиниться сам за 2 секунди. Записано: {done} з {letters.length}.
      </p>
      {!canRecord() && (
        <p className="warning">
          Запис доступний, коли застосунок відкрито через захищене з’єднання (https) або на цьому комп’ютері (localhost).
        </p>
      )}
      {error && <p className="warning">{error}</p>}
      <div className="rec-grid">
        {letters.map((l) => {
          const has = keys.has(soundKey(l));
          const isRec = recording?.letter === l;
          return (
            <div key={l} className={`rec-tile ${has ? 'rec-tile--has' : ''} ${isRec ? 'rec-tile--recording' : ''}`}>
              <span className={`rec-tile__glyph colored__ch--${LETTERS[l].kind}`}>{l}</span>
              <span className="rec-tile__sound">{LETTERS[l].sound}</span>
              <span className="rec-tile__actions">
                {isRec ? (
                  <button type="button" className="chip chip--rec" onClick={() => recording.stop()}>
                    ⏹ Стоп
                  </button>
                ) : (
                  <button type="button" className="chip" disabled={!canRecord() || Boolean(recording)} onClick={() => void start(l)} aria-label={`Записати звук ${l}`}>
                    🎙️
                  </button>
                )}
                {has && !isRec && (
                  <>
                    <button type="button" className="chip" onClick={() => void playRecording(soundKey(l))} aria-label={`Послухати звук ${l}`}>
                      ▶
                    </button>
                    <button type="button" className="chip" onClick={() => void deleteRecording(soundKey(l))} aria-label={`Видалити запис ${l}`}>
                      🗑
                    </button>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
}
