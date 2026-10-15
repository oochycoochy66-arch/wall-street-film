import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { motion, useMotionValue } from 'framer-motion';
import { Playback } from './playback';
import { SCENES, TOTAL, type SceneId } from './timeline';
import { TimeContext } from './scenes/primitives';
import {
  SceneBrokers,
  SceneClosing,
  SceneElectronic,
  SceneFuture,
  SceneInternet,
  SceneIntro,
  SceneMobile,
  SceneOrigins,
} from './scenes/scenes';


const SCENE_COMPONENTS: Record<SceneId, () => ReactElement> = {
  intro: SceneIntro,
  origins: SceneOrigins,
  brokers: SceneBrokers,
  electronic: SceneElectronic,
  internet: SceneInternet,
  mobile: SceneMobile,
  future: SceneFuture,
  closing: SceneClosing,
};

function fmt(t: number) {
  const s = Math.floor(t);
  return `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function App() {
  const time = useMotionValue(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [scene, setScene] = useState<SceneId>('intro');
  const [clock, setClock] = useState(0);
  const [caption, setCaption] = useState<{ id: SceneId; chars: number } | null>(null);
  const [voice, setVoice] = useState(true);
  const [muted, setMuted] = useState(false);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [ended, setEnded] = useState(false);
  const pb = useRef<Playback | null>(null);

  useEffect(() => {
    const p = new Playback(time, {
      onTick: (t) => setClock(t),
      onScene: (id) => setScene(id),
      onPlaying: (on) => setPlaying(on),
      onEnd: () => setEnded(true),
      onCaption: (id, chars) => setCaption({ id, chars }),
      onSources: (s) => setSources(s),
      onSpeaking: () => {},
    });
    pb.current = p;
    return () => p.dispose();
  }, [time]);

  // keyboard: space toggles, arrows seek by 5s
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        pb.current?.toggle();
      } else if (e.code === 'ArrowRight') pb.current?.seek(pb.current.current + 5);
      else if (e.code === 'ArrowLeft') pb.current?.seek(pb.current.current - 5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started]);

  const begin = () => {
    setStarted(true);
    pb.current?.play();
  };

  const captionText = useMemo(() => {
    if (!caption) return '';
    const s = SCENES.find((x) => x.id === caption.id);
    return s?.narration?.slice(0, caption.chars) ?? '';
  }, [caption]);

  const current = SCENES.find((x) => x.id === scene)!;

  return (
    <div className="stage" role="application" aria-label="Before the Algorithm">
      <TimeContext.Provider value={time}>
        {started && (
          <div className="scenes">
            {SCENES.map((s) => {
              const C = SCENE_COMPONENTS[s.id];
              return <C key={s.id} />;
            })}
          </div>
        )}
      </TimeContext.Provider>

      {started && current.display && scene === 'intro' && clock < 12 && (
        <div className="display-line" aria-hidden>
          {current.display}
        </div>
      )}

      {started && captionText && (
        <motion.div className="caption" key={caption?.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {captionText}
        </motion.div>
      )}

      {!started && (
        <div className="start" role="dialog" aria-modal="true" aria-label="Start">
          <h1 className="serif">Before the Algorithm</h1>
          <p className="muted">A 2 minute film. Sound and narration start when you press play.</p>
          <button className="btn" onClick={begin}>
            Start film
          </button>
        </div>
      )}

      {started && (
        <div className="controls">
          <button className="btn small" onClick={() => pb.current?.toggle()} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? 'Pause' : ended ? 'Replay' : 'Play'}
          </button>
          <input
            type="range"
            min={0}
            max={TOTAL}
            step={0.1}
            value={clock}
            onChange={(e) => pb.current?.seek(Number(e.target.value))}
            aria-label="Seek"
          />
          <span className="clock mono">
            {fmt(clock)} / {fmt(TOTAL)}
          </span>
          <button
            className="link"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              pb.current?.setMuted(next);
            }}
          >
            {muted ? 'sound off' : 'sound on'}
          </button>
          <button
            className="link"
            onClick={() => {
              const next = !voice;
              setVoice(next);
              pb.current?.setVoice(next);
            }}
          >
            {voice ? 'narration on' : 'narration off'}
          </button>
          {Object.keys(sources).length > 0 && (
            <span className="muted tiny">
              voice: {Object.values(sources).includes('clip') ? 'clips' : 'web speech'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
