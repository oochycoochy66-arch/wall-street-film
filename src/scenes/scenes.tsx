import { motion, useTransform } from 'framer-motion';
import { Layer, rnd, useFadeIn, useRamp, useTime } from './primitives';

/* ---------- shared pieces ---------- */

function Dust({ count = 40, color = 'rgba(245,235,215,0.5)' }: { count?: number; color?: string }) {
  const t = useTime();
  const dots = Array.from({ length: count }, (_, i) => ({
    x: rnd(i, 1) * 100,
    y: rnd(i, 2) * 100,
    r: 0.6 + rnd(i, 3) * 1.6,
    d: 0.4 + rnd(i, 4) * 0.6,
  }));
  return (
    <svg className="fill" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {dots.map((p, i) => (
        <DustDot key={i} x={p.x} y={p.y} r={p.r} d={p.d} color={color} t={t} />
      ))}
    </svg>
  );
}

function DustDot({ x, y, r, d, color, t }: { x: number; y: number; r: number; d: number; color: string; t: ReturnType<typeof useTime> }) {
  const dy = useTransform(t, (v) => -((v * d * 1.2) % 100));
  const yy = useTransform(dy, (v) => ((y + v + 200) % 100));
  return <motion.circle cx={x} cy={yy} r={r * 0.12} fill={color} />;
}

/* ---------- Scene 01: before the algorithm ---------- */

export function SceneIntro() {
  const t = useTime();
  const beam = useRamp(0, 12, 0.35, 0.75);
  const push = useRamp(0, 12, 1.0, 1.12);
  const title = useFadeIn(3.5, 1.4);
  const titleY = useRamp(3.5, 5, 14, 0);
  const sub = useRamp(6.5, 8, 0, 1);
  const ledgerOpacity = useRamp(0.4, 1.2, 0, 1);
  const pen = useRamp(2.5, 8.5, 0, 1);
  const quillX = useRamp(2.5, 8.5, 42, 64);
  const quillY = useRamp(2.5, 8.5, 56, 62);
  const lineDraw = useRamp(3, 8.5, 0, 1);
  return (
    <Layer start={0} end={12.5}>
      <motion.div className="fill bg-ink" />
      <motion.div className="fill" style={{ scale: push, opacity: useTransform(t, [0, 0.8], [0, 1]) }}>
        <div className="vignette" />
        <motion.div className="beam" style={{ opacity: beam }} />
        <motion.div className="ledger" style={{ opacity: ledgerOpacity }}>
          <div className="ledger-head">
            <span>Registro</span>
            <span>1 · 6 · 0 · 0</span>
          </div>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="ledger-line">
              <span className="ledger-col" />
              <span className="ledger-col wide" />
              <span className="ledger-col sm" />
            </div>
          ))}
          <svg className="signature" viewBox="0 0 300 80" aria-hidden>
            <motion.path
              d="M10 60 C 40 10, 60 75, 90 35 S 130 70, 160 30 S 210 60, 240 25 S 280 60, 292 40"
              fill="none"
              stroke="#c9a46a"
              strokeWidth="2.2"
              strokeLinecap="round"
              style={{ pathLength: pen }}
            />
          </svg>
          <motion.div className="quill" style={{ left: quillX as unknown as number, top: quillY as unknown as number, opacity: pen }} />
        </motion.div>
        <Dust count={60} />
        <motion.div className="title-block" style={{ opacity: title, y: titleY }}>
          <h1 className="serif display">Before the Algorithm</h1>
          <motion.p className="kicker" style={{ opacity: sub }}>
            Paper, trust, and a person on each side of the trade
          </motion.p>
        </motion.div>
        <motion.div className="lw" style={{ opacity: lineDraw, x: quillX }} />
      </motion.div>
    </Layer>
  );
}

/* ---------- Scene 02: first exchanges (Amsterdam, 1600s) ---------- */

export function SceneOrigins() {
  const t = useTime();
  const arch = useRamp(12, 20, 0, 1);
  const grid = useRamp(13, 22, 0, 1);
  const contract = useRamp(12, 16, 1, 0.35);
  const pan = useRamp(12, 28, -2, 3);
  const label = useFadeIn(16, 0.8);
  const inkDraw = useRamp(12, 17, 0, 1);
  const paperLift = useRamp(18, 24, 0, 1);
  const ledgerMove = useTransform(t, [12, 24], [0, -16]);
  return (
    <Layer start={12} end={28}>
      <motion.div className="fill paper" style={{ scale: contract, opacity: useTransform(t, [12, 13], [0, 1]) }} />
      <motion.svg className="fill" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ x: pan as unknown as number }} aria-hidden>
        <motion.path
          d="M8 80 V46 Q8 18 50 16 Q92 18 92 46 V80"
          fill="none"
          stroke="#8b6b3a"
          strokeWidth="0.45"
          style={{ pathLength: arch }}
        />
        <motion.path d="M20 80 V52 Q20 32 50 30 Q80 32 80 52 V80" fill="none" stroke="#8b6b3a" strokeWidth="0.3" style={{ pathLength: arch }} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <motion.line key={i} x1={12 + i * 10} y1={20} x2={12 + i * 10} y2={80} stroke="rgba(201,164,106,0.28)" strokeWidth="0.15" style={{ opacity: grid }} />
        ))}
        <motion.line x1="0" y1="82" x2="100" y2="82" stroke="rgba(201,164,106,0.4)" strokeWidth="0.25" style={{ pathLength: grid }} />
      </motion.svg>
      <motion.div className="fill figures" style={{ y: ledgerMove as unknown as number, opacity: paperLift }}>
        <div className="figure f1" />
        <div className="figure f2" />
        <div className="figure f3" />
      </motion.div>
      <motion.svg className="fill" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <motion.path d="M30 70 Q50 60 70 70" fill="none" stroke="#e6cf9a" strokeWidth="0.25" style={{ pathLength: inkDraw }} />
      </motion.svg>
      <Dust count={26} color="rgba(230,207,154,0.4)" />
      <motion.div className="dateline" style={{ opacity: label }}>
        1600s — The First Stock Exchanges
      </motion.div>
    </Layer>
  );
}

/* ---------- Scene 03: age of the broker ---------- */

const TAPE = 'AMSTERDAM 1602  ·  LONDON  ·  NEW YORK  ·  ORDER 4410  ·  HOLD  ·  SELL 300  ·  BUY 1200  ·  PAPER TICKET  ·  ';

export function SceneBrokers() {
  const t = useTime();
  const cam = useRamp(28, 44, 1, 1.18);
  const tapeX = useTransform(t, [28, 44], [0, -1400]);
  const label = useFadeIn(31, 0.9);
  const shake = useTransform(t, (v) => (v > 30 && v < 44 ? Math.sin(v * 18) * 0.6 : 0));
  const crowd = Array.from({ length: 14 }, (_, i) => ({ x: 4 + i * 7, h: 36 + rnd(i, 7) * 26, d: rnd(i, 9) * 0.4 }));
  return (
    <Layer start={28} end={44}>
      <motion.div className="fill floor" style={{ scale: cam, x: shake as unknown as number }} />
      <motion.div className="fill" style={{ scale: cam }}>
        <div className="floor-lights" />
        {crowd.map((p, i) => (
          <motion.div
            key={i}
            className="silhouette"
            style={{
              left: `${p.x}%`,
              height: `${p.h}%`,
              opacity: useTransform(t, [28 + p.d, 29.5 + p.d], [0, 1]),
            }}
          />
        ))}
        <div className="phone-stack">
          <span className="handset" />
          <span className="handset h2" />
        </div>
      </motion.div>
      <div className="tape-wrap" aria-hidden>
        <motion.div className="tape" style={{ x: tapeX as unknown as number }}>
          {TAPE.repeat(4)}
        </motion.div>
      </div>
      <motion.div className="sectional" style={{ opacity: label }}>
        The Human Market
      </motion.div>
    </Layer>
  );
}

/* ---------- Scene 04: electronic revolution ---------- */

export function SceneElectronic() {
  const t = useTime();
  const morph = useRamp(44, 52, 0, 1);
  const crt = useRamp(50, 54, 0, 1);
  const label = useFadeIn(51, 0.9);
  const rows = Array.from({ length: 14 }, (_, i) => i);
  const mono = 'mono';
  const tickerY = useTransform(t, [44, 60], [0, -600]);
  return (
    <Layer start={44} end={60}>
      <motion.div className="fill crt-base" style={{ opacity: useTransform(morph, (v) => 1 - v * 0.6) }}>
        <motion.div className="ticker-roll" style={{ opacity: useTransform(morph, (v) => 1 - v) }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i} className="ticker-line">
              {`${String(4410 + i)}  ${(100 + rnd(i, 3) * 80).toFixed(2)}  ${rnd(i, 5) > 0.5 ? '▲' : '▼'}`}
            </span>
          ))}
        </motion.div>
      </motion.div>
      <motion.div className={`fill terminal ${mono}`} style={{ opacity: morph }}>
        <motion.div style={{ y: tickerY as unknown as number }}>
          {rows.map((i) => (
            <div key={i} className="term-row">
              <span className="dim">{`0${i + 1}:${String(14 + (i % 7)).padStart(2, '0')}:${String(i * 4).padStart(2, '0')}`}</span>
              <span> QUOTE </span>
              <span className="bright">{(40 + rnd(i, 11) * 90).toFixed(2)}</span>
              <span className="dim"> {rnd(i, 13) > 0.5 ? '+0.42' : '-0.18'}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
      <motion.div className="fill scan" style={{ opacity: crt }} />
      <motion.div className="sectional" style={{ opacity: label }}>
        The Electronic Revolution
      </motion.div>
    </Layer>
  );
}

/* ---------- Scene 05: wall street goes online (1990s era, then modern) ---------- */

export function SceneInternet() {
  const crtFade = useRamp(60, 63, 1, 0);
  const win = useRamp(61, 64, 0, 1);
  const modern = useRamp(66, 71, 0, 1);
  const pulse = useRamp(68, 74, 0, 1);
  const label = useFadeIn(64.5, 0.9);
  const travel = useRamp(69, 74, 0, 1);
  return (
    <Layer start={60} end={76}>
      <motion.div className="fill" style={{ opacity: crtFade }}>
        <div className="crt-monitor" />
      </motion.div>
      <motion.div className="fill desk" style={{ opacity: win }}>
        <div className="win95">
          <div className="win-title">Brokerage Online v1.0</div>
          <div className="win-body">
            <div className="win-row">
              <span>Symbol</span>
              <span>Last</span>
              <span>Chg</span>
            </div>
            {['ACME', 'BLUEC', 'HARB', 'NRTH'].map((s, i) => (
              <div className="win-row" key={s}>
                <span>{s}</span>
                <span>{(20 + i * 7.3).toFixed(2)}</span>
                <span>{i % 2 ? '-0.14' : '+0.31'}</span>
              </div>
            ))}
            <div className="win-btn">Place Order</div>
          </div>
        </div>
      </motion.div>
      <motion.div className="fill modern" style={{ opacity: modern }}>
        <div className="browser">
          <div className="browser-bar">account · research · trade</div>
          <div className="browser-body">
            <div className="chart-line" />
            <div className="order-ticket">
              <span>BUY 50 · market · day</span>
              <span className="mono">est. $1,240.00</span>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div className="fill route" style={{ opacity: pulse }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="fill" aria-hidden>
          <motion.path d="M24 62 C 40 20, 60 20, 78 44" fill="none" stroke="#76E3A1" strokeWidth="0.25" style={{ pathLength: travel }} />
          <motion.circle cx="78" cy="44" r="0.9" fill="#76E3A1" style={{ opacity: travel }} />
        </svg>
      </motion.div>
      <motion.div className="sectional" style={{ opacity: label }}>
        The Market Moves Home
      </motion.div>
    </Layer>
  );
}

/* ---------- Scene 06: everyone has a trading desk (phone) ---------- */

export function SceneMobile() {
  const t = useTime();
  const narrow = useRamp(76, 82, 0, 1);
  const float = useTransform(t, [76, 94], [0, -6]);
  const ui = useRamp(82, 86, 0, 1);
  const confirm = useRamp(86, 88, 0, 1);
  const pull = useRamp(89, 94, 1, 0.75);
  const label = useFadeIn(78, 0.9);
  const candles = [22, 38, 30, 52, 44, 60, 48, 66, 58, 72, 64, 78];
  return (
    <Layer start={76} end={94}>
      <div className="fill deep" />
      <motion.div className="fill" style={{ scale: pull }}>
        <motion.div className="phone" style={{ y: float as unknown as number, width: useTransform(narrow, (v) => `${40 - v * 14}%`) }}>
          <div className="phone-notch" />
          <motion.div className="phone-screen" style={{ opacity: ui }}>
            <div className="watch">
              <div className="watch-row">
                <span>ACME</span>
                <span className="mono">44.82</span>
                <span className="mono up">+1.07%</span>
              </div>
              <div className="watch-row">
                <span>NRTH</span>
                <span className="mono">21.40</span>
                <span className="mono down">-0.38%</span>
              </div>
            </div>
            <svg viewBox="0 0 120 60" className="candles" aria-hidden>
              {candles.map((h, i) => (
                <g key={i}>
                  <line x1={6 + i * 9} y1={60 - h} x2={6 + i * 9} y2={60 - h - 10} stroke="#76E3A1" strokeWidth="0.5" />
                  <rect x={4 + i * 9} y={60 - h - 4} width="4" height={6 + (i % 3)} fill={i % 3 ? '#76E3A1' : '#92949B'} />
                </g>
              ))}
            </svg>
            <div className="fine">Illustrative prices. Not market data.</div>
            <motion.div className="confirm" style={{ opacity: confirm }}>
              Order filled · 10 shares
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div className="sectional" style={{ opacity: label }}>
        The Market In Your Pocket
      </motion.div>
    </Layer>
  );
}

/* ---------- Scene 07: the next frontier (network) ---------- */

export function SceneFuture() {
  const t = useTime();
  const net = useRamp(94, 104, 0, 1);
  const converge = useRamp(106, 114, 0, 1);
  const nodes = [
    [20, 30],
    [40, 22],
    [68, 28],
    [82, 56],
    [60, 74],
    [30, 66],
    [12, 50],
    [50, 48],
  ];
  return (
    <Layer start={94} end={114.5}>
      <motion.div className="fill deep" />
      <svg className="fill" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {nodes.map(([x, y], i) =>
          nodes.slice(i + 1).map(([x2, y2], j) => (
            <motion.line
              key={`${i}-${j}`}
              x1={x}
              y1={y}
              x2={x2}
              y2={y2}
              stroke="rgba(118,227,161,0.28)"
              strokeWidth="0.15"
              style={{
                pathLength: net,
                opacity: useTransform(converge, [0, 1], [1, 0.1]),
              }}
            />
          )),
        )}
        {nodes.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="0.6"
            fill="#76E3A1"
            style={{
              opacity: net,
              cx: useTransform(converge, [0, 1], [x, 50]) as unknown as number,
              cy: useTransform(converge, [0, 1], [y, 50]) as unknown as number,
            }}
          />
        ))}
      </svg>
      <motion.div className="fill candle-field" style={{ opacity: useTransform(t, [94, 96], [0, 1]) }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className="fcandle" style={{ height: `${20 + rnd(i, 17) * 40}%`, left: `${6 + i * 5.8}%` }} />
        ))}
      </motion.div>
      <motion.div className="future-copy" style={{ opacity: useFadeIn(96, 1) }}>
        <p>Algorithms execute in fractions of a second.</p>
        <p className="muted">Beneath every system: people, decisions, uncertainty, risk.</p>
      </motion.div>
    </Layer>
  );
}

/* ---------- Scene 08: closing ---------- */

export function SceneClosing() {
  const t = useTime();
  const line = useRamp(114, 118, 0, 1);
  const first = useFadeIn(115.5, 0.9);
  const second = useFadeIn(117, 0.9);
  const fade = useRamp(114, 115, 1, 1);
  return (
    <Layer start={114} end={120.5}>
      <motion.div className="fill bg-ink" style={{ opacity: fade }} />
      <motion.svg className="fill" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <motion.path d="M4 70 L18 62 L28 66 L42 46 L56 52 L70 36 L84 42 L96 30" fill="none" stroke="#76E3A1" strokeWidth="0.3" style={{ pathLength: line, opacity: useTransform(t, [114, 118], [0.2, 0.7]) }} />
      </motion.svg>
      <motion.div className="closing" style={{ opacity: first }}>
        <p className="closing-1">The market never stopped evolving.</p>
        <motion.p className="closing-2" style={{ opacity: second }}>
          Neither did the people behind it.
        </motion.p>
      </motion.div>
    </Layer>
  );
}
