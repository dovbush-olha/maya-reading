/**
 * `far` - далека ялинка: без стовбура, крона стоїть просто на пагорбі.
 * На телефоні картка з вправою часто закриває крони далекого ряду,
 * і темний стовбур під нею стирчав би окремою паличкою.
 */
const Pine = ({ x, y, s, c, far = false }: { x: number; y: number; s: number; c: string; far?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {!far && <rect x="-4" y="-6" width="8" height="18" rx="3" fill="#8A6A55" />}
    <g transform={far ? 'translate(0 14)' : undefined}>
      <path d="M0 -92 C14 -70 30 -48 34 -30 C36 -18 24 -8 0 -8 C-24 -8 -36 -18 -34 -30 C-30 -48 -14 -70 0 -92 Z" fill={c} />
      <path d="M0 -92 C10 -74 20 -58 24 -44 C14 -40 6 -42 0 -48 Z" fill="#fff" opacity="0.12" />
    </g>
  </g>
);

const RoundTree = ({ x, y, s, c }: { x: number; y: number; s: number; c: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-5" y="-30" width="10" height="34" rx="4" fill="#8A6A55" />
    <circle cx="0" cy="-58" r="36" fill={c} />
    <circle cx="-14" cy="-70" r="12" fill="#fff" opacity="0.1" />
  </g>
);

const Mushroom = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-6 0 Q-7 -14 -4 -18 L4 -18 Q7 -14 6 0 Z" fill="#FFF3DE" />
    <path d="M-18 -16 Q0 -40 18 -16 Z" fill="#E86A6A" />
    <circle cx="-7" cy="-24" r="2.6" fill="#FFF3DE" />
    <circle cx="5" cy="-27" r="2" fill="#FFF3DE" />
    <circle cx="10" cy="-20" r="1.8" fill="#FFF3DE" />
  </g>
);

const Flower = ({ x, y, c }: { x: number; y: number; c: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 0 L0 -16" stroke="#6FAE6A" strokeWidth="2.5" strokeLinecap="round" />
    {[0, 72, 144, 216, 288].map((a) => (
      <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 5} cy={-18 + Math.sin((a * Math.PI) / 180) * 5} r="4" fill={c} />
    ))}
    <circle cx="0" cy="-18" r="3" fill="#FFD36E" />
  </g>
);

const FIREFLIES = [
  [140, 420, 0],
  [380, 360, 1.6],
  [620, 440, 3.1],
  [900, 380, 0.8],
  [1160, 430, 2.3],
  [1320, 350, 4],
  [260, 520, 2.8],
  [1040, 520, 1.2],
];

const DAY = {
  sky: ['#FFF1DC', '#FCF4E6', '#E7F2DE'],
  far: '#D8EACB',
  farTree: '#BCDCAD',
  mid: '#B5D8A1',
  midTree: '#8CC07B',
  midRound: '#9CCB88',
  midTree2: '#97C886',
  near: '#9ACB86',
};

const NIGHT = {
  sky: ['#1B1F3F', '#2C2D5C', '#3E4A6B'],
  far: '#34506A',
  farTree: '#2E4860',
  mid: '#2A4A55',
  midTree: '#1F3A45',
  midRound: '#244350',
  midTree2: '#21404A',
  near: '#22403F',
};

const STARS = Array.from({ length: 46 }, (_, i) => {
  const x = (i * 197) % 1440;
  const y = 30 + ((i * 89) % 380);
  return { x, y, r: 1 + (i % 3) * 0.7, d: (i % 7) * 0.6 };
});

/** Чарівний ліс на тлі. Свідомо приглушений, щоб не відволікати від букв. */
export function ForestBackground({ night = false }: { night?: boolean }) {
  const c = night ? NIGHT : DAY;
  return (
    <div className="forest" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.sky[0]} />
            <stop offset="0.55" stopColor={c.sky[1]} />
            <stop offset="1" stopColor={c.sky[2]} />
          </linearGradient>
          <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFE3A3" />
            <stop offset="1" stopColor="#FFE3A3" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#sky)" />
        {night ? (
          <>
            {STARS.map((st) => (
              <circle key={`${st.x}-${st.y}`} className="forest__star" cx={st.x} cy={st.y} r={st.r} fill="#FFF6D8" style={{ animationDelay: `${st.d}s` }} />
            ))}
            <circle cx="1180" cy="150" r="170" fill="url(#sun)" opacity="0.35" />
            <circle cx="1180" cy="150" r="50" fill="#FFF3C9" />
            <circle cx="1202" cy="136" r="44" fill={c.sky[0]} />
          </>
        ) : (
          <>
            <circle cx="1180" cy="150" r="190" fill="url(#sun)" />
            <circle cx="1180" cy="150" r="54" fill="#FFE2A0" opacity="0.8" />
          </>
        )}

        <g className="forest__clouds" fill="#fff" opacity={night ? 0.12 : 0.85}>
          <g className="forest__cloud forest__cloud--a">
            <ellipse cx="560" cy="70" rx="70" ry="24" />
            <ellipse cx="600" cy="54" rx="44" ry="26" />
            <ellipse cx="532" cy="60" rx="32" ry="20" />
          </g>
          <g className="forest__cloud forest__cloud--b">
            <ellipse cx="820" cy="96" rx="58" ry="20" />
            <ellipse cx="852" cy="82" rx="36" ry="22" />
          </g>
        </g>

        <path d="M0 560 C200 470 380 520 560 480 C760 436 940 520 1140 470 C1280 436 1380 470 1440 460 L1440 900 L0 900 Z" fill={c.far} />
        {[60, 170, 300, 470, 640, 820, 990, 1130, 1290, 1400].map((x, i) => (
          <Pine key={x} x={x} y={560 - (i % 3) * 18} s={0.75 + (i % 2) * 0.15} c={c.farTree} far />
        ))}

        <path d="M0 650 C220 590 420 640 640 610 C860 580 1060 650 1260 610 C1350 594 1410 600 1440 604 L1440 900 L0 900 Z" fill={c.mid} />
        <Pine x={40} y={680} s={1.5} c={c.midTree} />
        <RoundTree x={150} y={690} s={1.25} c={c.midRound} />
        <Pine x={1300} y={670} s={1.6} c={c.midTree} />
        <RoundTree x={1400} y={690} s={1.3} c={c.midRound} />
        <Pine x={1190} y={700} s={1.1} c={c.midTree2} />

        <path d="M0 760 C260 720 520 770 760 748 C1000 726 1220 770 1440 744 L1440 900 L0 900 Z" fill={c.near} />
        <Mushroom x={210} y={790} s={1.4} />
        <Mushroom x={250} y={800} s={0.9} />
        <Mushroom x={1250} y={792} s={1.2} />
        <Flower x={120} y={800} c="#F6B4C6" />
        <Flower x={330} y={812} c="#C9B6E4" />
        <Flower x={1120} y={806} c="#F6B4C6" />
        <Flower x={1360} y={812} c="#FFF3DE" />

        {FIREFLIES.map(([x, y, d]) => (
          <circle
            key={`${x}-${y}`}
            className={`forest__firefly ${night ? 'forest__firefly--night' : ''}`}
            cx={x}
            cy={y}
            r={night ? 5 : 4}
            fill="#FFE08A"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
