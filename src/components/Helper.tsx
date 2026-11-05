import type { ReactNode } from 'react';
import { helperName, type HelperId } from '../content/helpers';

export type HelperMood = 'idle' | 'happy' | 'thinking' | 'cheer';

interface Palette {
  fur: [string, string];
  dark: string;
  light: string;
  feet: string;
  inner: string;
  scarf: [string, string];
  nose: string;
}

type AnimalId = Exclude<HelperId, 'flower' | 'butterfly'>;

const PALETTES: Record<AnimalId, Palette> = {
  fox: { fur: ['#F7A462', '#EC7F3C'], dark: '#E3702F', light: '#FFF8EE', feet: '#5B4152', inner: '#5B4152', scarf: ['#6FAE6A', '#5A9A57'], nose: '#3E3350' },
  bunny: { fur: ['#F6F1F8', '#E4DAEE'], dark: '#D3C5E2', light: '#FFFFFF', feet: '#D3C5E2', inner: '#F7B6C8', scarf: ['#F08A4B', '#D9733A'], nose: '#F48FA0' },
  bear: { fur: ['#C89466', '#A9744B'], dark: '#94633E', light: '#F3DDC2', feet: '#7A5233', inner: '#E8C3A0', scarf: ['#7EC4CF', '#5FAAB6'], nose: '#4A3428' },
  cat: { fur: ['#C3CAD6', '#9EA8B9'], dark: '#8892A5', light: '#FFFFFF', feet: '#8892A5', inner: '#F7B6C8', scarf: ['#E86A8D', '#C9516F'], nose: '#F48FA0' },
  owl: { fur: ['#BC9473', '#97704F'], dark: '#7F5B3E', light: '#F5E6CF', feet: '#F0A04B', inner: '#7F5B3E', scarf: ['#C9B6E4', '#A994CC'], nose: '#F0A04B' },
};

const ROUND_HEAD = 'M38 88 C38 52 64 38 100 38 C136 38 162 52 162 88 C162 120 134 134 100 134 C66 134 38 120 38 88 Z';
const FOX_HEAD = 'M36 86 C36 50 64 36 100 36 C136 36 164 50 164 86 C164 118 134 132 100 132 C66 132 36 118 36 86 Z';

function Ears({ id, p }: { id: AnimalId; p: Palette }) {
  const fur = `url(#hf-${id})`;
  switch (id) {
    case 'fox':
      return (
        <>
          <g className="helper__ear helper__ear--left">
            <path d="M50 66 L44 10 Q46 6 50 9 L94 44 Z" fill={p.dark} />
            <path d="M57 58 L53 22 L84 46 Z" fill={p.inner} opacity="0.85" />
          </g>
          <g className="helper__ear">
            <path d="M150 66 L156 10 Q154 6 150 9 L106 44 Z" fill={p.dark} />
            <path d="M143 58 L147 22 L116 46 Z" fill={p.inner} opacity="0.85" />
          </g>
        </>
      );
    case 'cat':
      return (
        <>
          <g className="helper__ear helper__ear--left">
            <path d="M48 70 L48 20 Q50 15 55 19 L90 46 Z" fill={p.dark} />
            <path d="M55 62 L55 30 L80 48 Z" fill={p.inner} />
          </g>
          <g className="helper__ear">
            <path d="M152 70 L152 20 Q150 15 145 19 L110 46 Z" fill={p.dark} />
            <path d="M145 62 L145 30 L120 48 Z" fill={p.inner} />
          </g>
        </>
      );
    case 'bunny':
      return (
        <>
          <g className="helper__ear helper__ear--left" transform="rotate(-12 76 56)">
            <ellipse cx="76" cy="14" rx="16" ry="42" fill={fur} />
            <ellipse cx="76" cy="18" rx="8" ry="30" fill={p.inner} />
          </g>
          <g className="helper__ear" transform="rotate(12 124 56)">
            <ellipse cx="124" cy="14" rx="16" ry="42" fill={fur} />
            <ellipse cx="124" cy="18" rx="8" ry="30" fill={p.inner} />
          </g>
        </>
      );
    case 'bear':
      return (
        <>
          <g className="helper__ear helper__ear--left">
            <circle cx="56" cy="50" r="21" fill={p.dark} />
            <circle cx="56" cy="50" r="11" fill={p.inner} />
          </g>
          <g className="helper__ear">
            <circle cx="144" cy="50" r="21" fill={p.dark} />
            <circle cx="144" cy="50" r="11" fill={p.inner} />
          </g>
        </>
      );
    case 'owl':
      return (
        <>
          <path className="helper__ear helper__ear--left" d="M46 64 L40 22 Q42 18 46 21 L80 46 Z" fill={p.dark} />
          <path className="helper__ear" d="M154 64 L160 22 Q158 18 154 21 L120 46 Z" fill={p.dark} />
        </>
      );
  }
}

function Tail({ id, p }: { id: AnimalId; p: Palette }) {
  switch (id) {
    case 'fox':
      return (
        <g className="helper__tail">
          <path d="M132 196 C190 200 204 150 186 118 C178 104 160 108 158 122 C170 148 150 168 128 176 Z" fill={`url(#hf-${id})`} />
          <path d="M186 118 C178 104 160 108 158 122 C166 120 176 124 184 140 C190 134 190 126 186 118 Z" fill="#FFF8EE" />
        </g>
      );
    case 'cat':
      return (
        <g className="helper__tail">
          <path d="M128 196 C176 198 192 164 176 134 C170 122 178 110 188 114" fill="none" stroke={p.dark} strokeWidth="13" strokeLinecap="round" />
        </g>
      );
    case 'bunny':
      return <circle className="helper__tail" cx="140" cy="192" r="15" fill="#fff" stroke={p.dark} strokeWidth="2" />;
    case 'bear':
      return <circle cx="136" cy="196" r="9" fill={p.dark} />;
    case 'owl':
      return <path d="M86 202 L100 218 L114 202 Z" fill={p.dark} />;
  }
}

function Face({ id, p }: { id: AnimalId; p: Palette }) {
  switch (id) {
    case 'fox':
      return (
        <path
          d="M38 92 C48 104 66 106 80 100 C88 112 94 118 100 118 C106 118 112 112 120 100 C134 106 152 104 162 92 C158 118 132 132 100 132 C68 132 42 118 38 92 Z"
          fill={p.light}
        />
      );
    case 'owl':
      return (
        <>
          <circle cx="77" cy="84" r="24" fill={p.light} />
          <circle cx="123" cy="84" r="24" fill={p.light} />
        </>
      );
    case 'bear':
      return <ellipse cx="100" cy="106" rx="30" ry="22" fill={p.light} />;
    default:
      return <ellipse cx="100" cy="108" rx="27" ry="18" fill={p.light} />;
  }
}

function Nose({ id, p }: { id: AnimalId; p: Palette }) {
  switch (id) {
    case 'owl':
      return <path d="M92 98 Q100 94 108 98 L100 114 Z" fill={p.nose} strokeLinejoin="round" />;
    case 'bear':
      return <ellipse cx="100" cy="99" rx="10" ry="7" fill={p.nose} />;
    case 'bunny':
    case 'cat':
      return <path d="M94 99 Q100 95 106 99 Q104 104 100 106 Q96 104 94 99 Z" fill={p.nose} />;
    default:
      return <path d="M93 98 Q100 94 107 98 Q106 104 100 106 Q94 104 93 98 Z" fill={p.nose} />;
  }
}

function Extras({ id, p }: { id: AnimalId; p: Palette }) {
  switch (id) {
    case 'cat':
      return (
        <g stroke="#3E3350" strokeWidth="2" strokeLinecap="round" opacity="0.55">
          <path d="M72 104 L46 98 M72 110 L46 113 M128 104 L154 98 M128 110 L154 113" />
          <path d="M94 44 L94 54 M100 42 L100 54 M106 44 L106 54" stroke={p.dark} strokeWidth="4" opacity="1" />
        </g>
      );
    case 'bunny':
      return <rect x="96" y="114" width="8" height="7" rx="1.5" fill="#fff" stroke="#3E3350" strokeWidth="1.5" />;
    case 'owl':
      return (
        <g fill="none" stroke={p.dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.6">
          <path d="M90 166 Q94 170 98 166 M102 166 Q106 170 110 166 M94 180 Q98 184 102 180 M98 192 Q100 195 102 192" />
        </g>
      );
    default:
      return null;
  }
}

function Arms({ id, p }: { id: AnimalId; p: Palette }) {
  if (id === 'owl') {
    return (
      <g className="helper__paws">
        <ellipse cx="64" cy="168" rx="13" ry="30" fill={p.dark} transform="rotate(14 64 168)" />
        <ellipse cx="136" cy="168" rx="13" ry="30" fill={p.dark} transform="rotate(-14 136 168)" />
      </g>
    );
  }
  return (
    <g className="helper__paws">
      <ellipse cx="84" cy="168" rx="9" ry="12" fill={p.dark} />
      <ellipse cx="116" cy="168" rx="9" ry="12" fill={p.dark} />
    </g>
  );
}

interface HelperProps {
  id: HelperId;
  mood?: HelperMood;
  size?: number;
  className?: string;
}

/** Друг-помічник. Намальований вручну у SVG, анімації - у CSS. */
export function Helper({ id, mood = 'idle', size = 160, className = '' }: HelperProps): ReactNode {
  return (
    <svg
      className={`helper helper--${mood} helper--${id} ${className}`}
      width={size}
      height={size * 1.1}
      viewBox="0 0 200 220"
      role="img"
      aria-label={helperName(id)}
    >
      <ellipse cx="100" cy="210" rx="62" ry="7" fill="#3E3350" opacity="0.12" />
      {id === 'flower' ? <Flower mood={mood} /> : id === 'butterfly' ? <Butterfly mood={mood} /> : <Animal id={id} mood={mood} />}
    </svg>
  );
}

/** Очі, рум’янець і усмішка - спільні для всіх друзів. */
function Expression({ mood, bigEyes = false, mouth = true }: { mood: HelperMood; bigEyes?: boolean; mouth?: boolean }) {
  const closedEyes = mood === 'happy' || mood === 'cheer';
  return (
    <>
      <ellipse cx="62" cy="104" rx="9" ry="5.5" fill="#F48FA0" opacity="0.5" />
      <ellipse cx="138" cy="104" rx="9" ry="5.5" fill="#F48FA0" opacity="0.5" />
      {closedEyes ? (
        <g fill="none" stroke="#3E3350" strokeWidth="5" strokeLinecap="round">
          <path d="M68 86 Q78 76 88 86" />
          <path d="M112 86 Q122 76 132 86" />
        </g>
      ) : (
        <g className={`helper__eyes ${mood === 'thinking' ? 'helper__eyes--side' : ''}`}>
          <ellipse cx="78" cy="84" rx={bigEyes ? 10 : 8} ry={bigEyes ? 11 : 10} fill="#3E3350" />
          <ellipse cx="122" cy="84" rx={bigEyes ? 10 : 8} ry={bigEyes ? 11 : 10} fill="#3E3350" />
          <circle cx="81" cy="80" r="3.4" fill="#fff" />
          <circle cx="125" cy="80" r="3.4" fill="#fff" />
          <circle cx="75.5" cy="88" r="1.4" fill="#fff" opacity="0.8" />
          <circle cx="119.5" cy="88" r="1.4" fill="#fff" opacity="0.8" />
        </g>
      )}
      {mouth &&
        (mood === 'cheer' ? (
          <path d="M90 112 Q100 126 110 112 Z" fill="#C2456A" stroke="#3E3350" strokeWidth="2.5" strokeLinejoin="round" />
        ) : mood === 'thinking' ? (
          <path d="M94 115 Q100 113 106 115" fill="none" stroke="#3E3350" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <path d="M91 112 Q100 120 109 112" fill="none" stroke="#3E3350" strokeWidth="3" strokeLinecap="round" />
        ))}
    </>
  );
}

function Animal({ id, mood }: { id: AnimalId; mood: HelperMood }) {
  const p = PALETTES[id];
  const owl = id === 'owl';
  return (
    <>
      <defs>
        <linearGradient id={`hf-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.fur[0]} />
          <stop offset="1" stopColor={p.fur[1]} />
        </linearGradient>
      </defs>

      <Tail id={id} p={p} />

      <g className="helper__body">
        <path d="M64 204 C56 160 70 132 100 128 C130 132 144 160 136 204 Z" fill={`url(#hf-${id})`} />
        <ellipse cx="100" cy="176" rx={owl ? 26 : 22} ry={owl ? 30 : 27} fill={p.light} />
        <Extras id={owl ? 'owl' : 'fox'} p={p} />
        <ellipse cx="80" cy="204" rx={owl ? 11 : 15} ry={owl ? 6 : 8} fill={p.feet} />
        <ellipse cx="120" cy="204" rx={owl ? 11 : 15} ry={owl ? 6 : 8} fill={p.feet} />
        <Arms id={id} p={p} />
      </g>

      <g className="helper__scarf">
        <path d="M66 132 Q100 150 134 132 L136 144 Q100 164 64 144 Z" fill={p.scarf[0]} />
        <path d="M118 148 L134 176 L120 178 L110 152 Z" fill={p.scarf[1]} />
        <circle cx="84" cy="144" r="2.4" fill="#FFF8EE" opacity="0.8" />
        <circle cx="100" cy="149" r="2.4" fill="#FFF8EE" opacity="0.8" />
        <circle cx="116" cy="144" r="2.4" fill="#FFF8EE" opacity="0.8" />
      </g>

      <g className="helper__head">
        <Ears id={id} p={p} />
        <path d={id === 'fox' ? FOX_HEAD : ROUND_HEAD} fill={`url(#hf-${id})`} />
        <Face id={id} p={p} />
        <Expression mood={mood} bigEyes={owl} mouth={!owl} />
        <Nose id={id} p={p} />
        {id !== 'owl' && id !== 'fox' && id !== 'bear' && <Extras id={id} p={p} />}
      </g>
    </>
  );
}

const PETALS = [0, 45, 90, 135, 180, 225, 270, 315];

/** Квіточка: пелюстки навколо усміхненого личка, стебло з листочками. */
function Flower({ mood }: { mood: HelperMood }) {
  return (
    <>
      <defs>
        <radialGradient id="hf-flower-center" cx="0.45" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#FFE58A" />
          <stop offset="1" stopColor="#F6BC45" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="206" rx="46" ry="9" fill="#7FBF6E" />
      <path d="M100 130 C96 160 104 184 100 206" fill="none" stroke="#5A9A57" strokeWidth="9" strokeLinecap="round" />
      <g className="helper__paws">
        <path className="helper__leaf helper__leaf--left" d="M99 182 C82 164 58 166 48 178 C62 194 86 194 99 182 Z" fill="#6FAE6A" />
        <path className="helper__leaf" d="M101 164 C118 146 142 148 152 160 C138 176 114 176 101 164 Z" fill="#6FAE6A" />
        <path d="M99 182 C82 178 66 178 54 179 M101 164 C118 160 134 160 146 161" fill="none" stroke="#5A9A57" strokeWidth="2" strokeLinecap="round" />
      </g>

      <g className="helper__head">
        <g className="helper__petals">
          {PETALS.map((a, i) => (
            <ellipse key={a} cx="100" cy="42" rx="22" ry="30" fill={i % 2 ? '#F49CBF' : '#F7B6D0'} transform={`rotate(${a} 100 90)`} />
          ))}
        </g>
        <circle cx="100" cy="90" r="47" fill="url(#hf-flower-center)" />
        <circle cx="100" cy="90" r="47" fill="none" stroke="#EAA93A" strokeWidth="2" opacity="0.5" />
        <Expression mood={mood} />
      </g>
    </>
  );
}

/** Метелик: велика голівка з вусиками, смугасте тільце і крильця, що махають. */
function Butterfly({ mood }: { mood: HelperMood }) {
  const wing = (
    <>
      <path d="M100 134 C74 76 10 64 8 112 C6 156 62 166 100 150 Z" fill="url(#hf-wing-top)" />
      <path d="M100 154 C70 152 30 166 38 194 C46 218 86 202 100 168 Z" fill="url(#hf-wing-bottom)" />
      <circle cx="40" cy="114" r="13" fill="#FFF3C9" opacity="0.9" />
      <circle cx="64" cy="98" r="6" fill="#FFF3C9" opacity="0.8" />
      <circle cx="60" cy="186" r="8" fill="#FFF3C9" opacity="0.85" />
    </>
  );
  return (
    <>
      <defs>
        <linearGradient id="hf-wing-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9FD8E4" />
          <stop offset="1" stopColor="#5FAAB6" />
        </linearGradient>
        <linearGradient id="hf-wing-bottom" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C9B6E4" />
          <stop offset="1" stopColor="#A994CC" />
        </linearGradient>
        <linearGradient id="hf-butterfly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E78B8" />
          <stop offset="1" stopColor="#6E5A98" />
        </linearGradient>
      </defs>

      <g className="helper__wings">
        {wing}
        <g transform="matrix(-1 0 0 1 200 0)">{wing}</g>
      </g>

      <g className="helper__body">
        <ellipse cx="100" cy="166" rx="20" ry="40" fill="url(#hf-butterfly)" />
        <g fill="none" stroke="#FFE58A" strokeWidth="5" strokeLinecap="round" opacity="0.9">
          <path d="M84 158 Q100 164 116 158 M85 174 Q100 180 115 174 M89 190 Q100 195 111 190" />
        </g>
      </g>

      <g className="helper__head">
        <g fill="none" stroke="#6E5A98" strokeWidth="4" strokeLinecap="round">
          <path className="helper__ear helper__ear--left" d="M86 50 C80 30 70 18 58 14" />
          <path className="helper__ear" d="M114 50 C120 30 130 18 142 14" />
        </g>
        <circle cx="57" cy="13" r="7" fill="#F49CBF" />
        <circle cx="143" cy="13" r="7" fill="#F49CBF" />
        <circle cx="100" cy="88" r="46" fill="url(#hf-butterfly)" />
        <ellipse cx="100" cy="98" rx="36" ry="30" fill="#B7A6DA" opacity="0.55" />
        <Expression mood={mood} />
      </g>
    </>
  );
}
