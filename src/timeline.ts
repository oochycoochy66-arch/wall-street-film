export type SceneId =
  | 'intro'
  | 'origins'
  | 'brokers'
  | 'electronic'
  | 'internet'
  | 'mobile'
  | 'future'
  | 'closing';

export type SfxKind =
  | 'footstep'
  | 'quill'
  | 'rustle'
  | 'tick'
  | 'phone'
  | 'blip'
  | 'key'
  | 'chime'
  | 'confirm'
  | 'pulse'
  | 'resolve';

export interface Scene {
  id: SceneId;
  label: string;
  start: number;
  end: number;
  /** on-screen display line (spec "Display:" text), if any */
  display?: string;
  /** voice-over line, shown as caption and spoken */
  narration?: string;
  /** prerecorded narration clip path (served from /public/audio). Used only if it exists. */
  clip: string;
  /** ambience bed: lowpass cutoff (Hz) and gain */
  bed: { cutoff: number; gain: number };
}

export interface SfxEvent {
  t: number;
  kind: SfxKind;
}

/** Total film runtime in seconds (hard cap 120). */
export const TOTAL = 120;

export const SCENES: Scene[] = [
  {
    id: 'intro',
    label: 'Before the Algorithm',
    start: 0,
    end: 12,
    display: 'BEFORE THE ALGORITHM',
    narration:
      'Long before trading happened in milliseconds, markets ran on trust, paper, and human judgment. Every transaction began with a person.',
    clip: '/audio/scene-01-intro.mp3',
    bed: { cutoff: 220, gain: 0.06 },
  },
  {
    id: 'origins',
    label: 'The First Exchanges',
    start: 12,
    end: 28,
    display: '1600s — THE FIRST STOCK EXCHANGES',
    narration:
      'In the seventeenth century, Amsterdam helped establish a new model: shares could change hands, allowing investors to participate in the fortunes of a company.',
    clip: '/audio/scene-02-origins.mp3',
    bed: { cutoff: 380, gain: 0.05 },
  },
  {
    id: 'brokers',
    label: 'The Age of the Broker',
    start: 28,
    end: 44,
    display: 'THE HUMAN MARKET',
    narration:
      'Markets grew. Brokers became the link between buyers and sellers, carrying orders, negotiating prices, and turning information into opportunity. Every second depended on human communication.',
    clip: '/audio/scene-03-brokers.mp3',
    bed: { cutoff: 1100, gain: 0.07 },
  },
  {
    id: 'electronic',
    label: 'When Machines Joined the Market',
    start: 44,
    end: 60,
    display: 'THE ELECTRONIC REVOLUTION',
    narration:
      'Then technology changed the rules. Electronic quotes and computer networks accelerated trading. Information moved faster, and the market began shifting from crowded floors to connected machines.',
    clip: '/audio/scene-04-electronic-revolution.mp3',
    bed: { cutoff: 2400, gain: 0.03 },
  },
  {
    id: 'internet',
    label: 'Wall Street Goes Online',
    start: 60,
    end: 76,
    display: 'THE MARKET MOVES HOME',
    narration:
      "Then the internet brought brokerage services into people's homes. Investors gained new ways to research markets and place trades. Access expanded beyond the traditional trading floor.",
    clip: '/audio/scene-05-internet-brokerage.mp3',
    bed: { cutoff: 1800, gain: 0.025 },
  },
  {
    id: 'mobile',
    label: 'Everyone Has a Trading Desk',
    start: 76,
    end: 94,
    display: 'THE MARKET IN YOUR POCKET',
    narration:
      'Mobile platforms put market information and trading tools into people\'s hands. But access brought new responsibility. Prices can move quickly, and opportunity always comes with risk.',
    clip: '/audio/scene-06-mobile-trading.mp3',
    bed: { cutoff: 800, gain: 0.025 },
  },
  {
    id: 'future',
    label: 'The Next Frontier',
    start: 94,
    end: 114,
    narration:
      'Today, algorithms can execute trades in fractions of a second, while artificial intelligence is reshaping how information is analyzed. Yet beneath every system, the same forces remain: people, decisions, uncertainty, and risk.',
    clip: '/audio/scene-07-future-of-markets.mp3',
    bed: { cutoff: 160, gain: 0.04 },
  },
  {
    id: 'closing',
    label: 'The Market Never Stands Still',
    start: 114,
    end: 120,
    clip: '/audio/scene-08-closing.mp3',
    bed: { cutoff: 120, gain: 0.02 },
  },
];

function ticksBetween(a: number, b: number, from: number, to: number, kind: SfxKind): SfxEvent[] {
  const out: SfxEvent[] = [];
  let t = a;
  while (t < b) {
    out.push({ t, kind });
    const f = (t - a) / (b - a);
    t += from + (to - from) * f;
  }
  return out;
}

/** Sound effect schedule. Fired by the playback clock, so it stays in sync and never drifts. */
export const SFX: SfxEvent[] = [
  { t: 2.5, kind: 'footstep' },
  { t: 4.2, kind: 'footstep' },
  { t: 5.5, kind: 'quill' },
  { t: 8.8, kind: 'rustle' },
  { t: 13, kind: 'rustle' },
  { t: 17.5, kind: 'rustle' },
  { t: 22, kind: 'quill' },
  { t: 25, kind: 'rustle' },
  { t: 29, kind: 'phone' },
  { t: 36, kind: 'phone' },
  ...ticksBetween(30, 43, 0.6, 0.14, 'tick'),
  ...ticksBetween(44, 52, 0.25, 0.12, 'tick'),
  ...ticksBetween(50, 59, 0.35, 0.22, 'blip'),
  ...ticksBetween(61, 74, 0.5, 0.3, 'key'),
  { t: 77, kind: 'chime' },
  { t: 84, kind: 'confirm' },
  { t: 90, kind: 'chime' },
  ...ticksBetween(94, 113, 2.0, 1.0, 'pulse'),
  { t: 115, kind: 'resolve' },
];

export function sceneAt(t: number): Scene {
  for (const s of SCENES) {
    if (t >= s.start && t < s.end) return s;
  }
  return SCENES[SCENES.length - 1];
}

/** Music bed level as a function of film time (builds gradually, resolves at the end). */
export function musicLevel(t: number): number {
  if (t < 94) return 0.02 + (0.07 * t) / 94;
  if (t < 114) return 0.09 + (0.04 * (t - 94)) / 20;
  return 0.07 - 0.04 * Math.min(1, (t - 114) / 6);
}
