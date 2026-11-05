import { getProgress } from '../store/progressStore';

/**
 * Усі звуки синтезуються в браузері (Web Audio) - без файлів і без синтезатора мовлення.
 * Звуки букв говорить дорослий наживо або власним записом (див. recordings.ts).
 */
let ctx: AudioContext | undefined;
let sfxBus: GainNode | undefined;

function audio(): AudioContext | undefined {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      sfxBus = ctx.createGain();
      sfxBus.gain.value = 1;
      sfxBus.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return undefined;
  }
}

function tone(freq: number, start: number, duration: number, gain: number, type: OscillatorType = 'sine', out?: AudioNode) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(out ?? sfxBus!);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

const sfxOn = () => getProgress().settings.sounds;

/** М'який «бульк» на кожне натискання. */
export function tap() {
  if (!sfxOn()) return;
  tone(880, 0, 0.12, 0.05);
  tone(1320, 0.01, 0.09, 0.02);
}

/** Дзвіночок за правильну відповідь. */
export function chime() {
  if (!sfxOn()) return;
  tone(1047, 0, 0.5, 0.09);
  tone(1568, 0.09, 0.6, 0.07);
  tone(2093, 0.18, 0.7, 0.04);
}

/** Зірочка летить у баночку. */
export function sparkle() {
  if (!sfxOn()) return;
  [1760, 2217, 2637].forEach((f, i) => tone(f, i * 0.05, 0.25, 0.025));
}

/** Свято в кінці місії. */
export function fanfare() {
  if (!sfxOn()) return;
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.12, 0.6, 0.07, 'triangle'));
}

// ---------------- Фонова музика: тиха «музична скринька» ----------------

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
/** Акорди: до мажор - ля мінор - фа мажор - соль мажор (частоти баса й квінти). */
const CHORDS = [
  { bass: [130.81, 196.0], tones: [0, 2, 3, 5] },
  { bass: [110.0, 164.81], tones: [0, 2, 4, 5] },
  { bass: [87.31, 130.81], tones: [0, 1, 4, 5] },
  { bass: [98.0, 146.83], tones: [1, 3, 4, 6] },
];
const BEAT = 0.75;
const BEATS_PER_CHORD = 8;

let music: { master: GainNode; timer: number; nextTime: number; beat: number; last: number } | undefined;

function scheduleBeat(m: NonNullable<typeof music>) {
  const c = ctx!;
  const chord = CHORDS[Math.floor(m.beat / BEATS_PER_CHORD) % CHORDS.length];
  const t = m.nextTime;
  const at = t - c.currentTime;

  if (m.beat % BEATS_PER_CHORD === 0) {
    for (const f of chord.bass) {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 1.6);
      g.gain.linearRampToValueAtTime(0.0001, t + BEAT * BEATS_PER_CHORD + 0.8);
      osc.connect(g).connect(m.master);
      osc.start(t);
      osc.stop(t + BEAT * BEATS_PER_CHORD + 1);
    }
  }

  // Мелодія: м'які ноти з пауз, без різких стрибків.
  if (Math.random() < 0.62) {
    const options = chord.tones.filter((i) => Math.abs(i - m.last) <= 2);
    const idx = options.length ? options[Math.floor(Math.random() * options.length)] : chord.tones[0];
    m.last = idx;
    tone(PENTATONIC[idx], at, 1.8, 0.16, 'sine', m.master);
    tone(PENTATONIC[idx] * 2, at, 0.6, 0.03, 'sine', m.master);
  }
  m.beat += 1;
  m.nextTime += BEAT;
}

export function startMusic() {
  if (music || !getProgress().settings.music) return;
  const c = audio();
  if (!c) return;
  const master = c.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.11, c.currentTime + 3);
  // Невелике «відлуння», щоб музика звучала м'якше.
  const delay = c.createDelay();
  delay.delayTime.value = 0.42;
  const feedback = c.createGain();
  feedback.gain.value = 0.3;
  const wet = c.createGain();
  wet.gain.value = 0.35;
  master.connect(c.destination);
  master.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(c.destination);

  const m = { master, timer: 0, nextTime: c.currentTime + 0.3, beat: 0, last: 2 };
  m.timer = window.setInterval(() => {
    while (m.nextTime < c.currentTime + 1.2) scheduleBeat(m);
  }, 250);
  music = m;
}

export function stopMusic() {
  if (!music || !ctx) return;
  const m = music;
  music = undefined;
  window.clearInterval(m.timer);
  m.master.gain.cancelScheduledValues(ctx.currentTime);
  m.master.gain.setValueAtTime(m.master.gain.value, ctx.currentTime);
  m.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  window.setTimeout(() => m.master.disconnect(), 1200);
}

export function isMusicPlaying(): boolean {
  return Boolean(music);
}

/** Пауза, коли вкладку сховано (телефон заблоковано) - щоб музика не грала в кишені. */
export function suspendAudio(hidden: boolean) {
  if (!ctx) return;
  if (hidden) void ctx.suspend();
  else void ctx.resume();
}
