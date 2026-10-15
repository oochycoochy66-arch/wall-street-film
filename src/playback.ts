import type { MotionValue } from 'framer-motion';
import { SCENES, SFX, TOTAL, musicLevel, sceneAt, type SceneId } from './timeline';
import { Engine } from './audio/engine';
import { Narrator } from './audio/narrator';

export interface PlaybackCallbacks {
  onTick: (t: number) => void;
  onScene: (id: SceneId) => void;
  onPlaying: (playing: boolean) => void;
  onEnd: () => void;
  onCaption: (id: SceneId, chars: number) => void;
  onSources: (s: Record<string, string>) => void;
  onSpeaking: (on: boolean) => void;
}

/**
 * Single source of truth for film time. Visuals read `time` (a MotionValue, updated every frame),
 * sound effects and music are scheduled from the same clock, and narration is started/stopped on
 * scene boundaries and seeks. Nothing here depends on scroll speed.
 */
export class Playback {
  readonly time: MotionValue<number>;
  private cb: PlaybackCallbacks;
  private t = 0;
  private playing = false;
  private needsEnter = true;
  private last = 0;
  private raf = 0;
  private scene: SceneId | null = null;
  private tickAcc = 0;
  private engine: Engine | null = null;
  private narrator: Narrator;
  private muted = false;
  private disposed = false;

  constructor(time: MotionValue<number>, cb: PlaybackCallbacks) {
    this.time = time;
    this.cb = cb;
    this.narrator = new Narrator(
      (on) => {
        this.cb.onSpeaking(on);
        this.engine?.setDuck(on);
      },
      (id, chars) => this.cb.onCaption(id, chars),
    );
    void this.narrator.probe(SCENES).then((s) => {
      if (!this.disposed) this.cb.onSources(s);
    });
  }

  get isPlaying() {
    return this.playing;
  }

  get current() {
    return this.t;
  }

  /** Must run inside a user gesture (click or key press) so the browser allows audio. */
  play() {
    if (this.playing) return;
    if (!this.engine) this.engine = new Engine();
    this.engine.resume();
    this.engine.setMuted(this.muted);
    if (this.t >= TOTAL - 0.05) this.seek(0);
    this.narrator.resume();
    this.flushEnter();
    this.playing = true;

    this.last = performance.now();
    this.cb.onPlaying(true);
    this.raf = requestAnimationFrame(this.frame);
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.narrator.pause();
    this.engine?.suspend();
    this.cb.onPlaying(false);
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  /** Jump to a film time. Stops current narration and starts the new scene's line from its offset. */
  seek(to: number) {
    const v = Math.max(0, Math.min(TOTAL - 0.01, to));
    this.t = v;
    this.time.set(v);
    this.narrator.stopAll();
    const s = sceneAt(v);
    this.scene = s.id;
    this.cb.onScene(s.id);
    this.engine?.setScene(s);
    this.engine?.setMusic(musicLevel(v));
    this.cb.onTick(v);
    this.needsEnter = true;
    if (this.playing) this.flushEnter();
  }

  restart() {
    this.seek(0);
    if (!this.playing) this.play();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.engine?.setMuted(muted);
  }

  setVoice(on: boolean) {
    this.narrator.setEnabled(on);
    if (on && this.playing) {
      this.needsEnter = true;
      this.flushEnter();
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.playing = false;
    this.narrator.stopAll();
    this.engine?.close();
    this.engine = null;
  }

  private flushEnter() {
    if (!this.needsEnter || !this.engine) return;
    this.needsEnter = false;
    const s = sceneAt(this.t);
    this.narrator.enter(s, this.t - s.start);
  }

  private frame = (now: number) => {
    if (!this.playing) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const prev = this.t;
    const next = Math.min(TOTAL, prev + dt);
    this.advance(prev, next, dt);
    if (next >= TOTAL) {
      this.playing = false;
      this.cb.onPlaying(false);
      this.cb.onEnd();
      this.engine?.suspend();
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private advance(prev: number, next: number, dt: number) {
    this.t = next;
    this.time.set(next);
    for (const e of SFX) {
      if (e.t > prev && e.t <= next) this.engine?.sfx(e.kind);
    }
    const s = sceneAt(next);
    if (s.id !== this.scene) {
      this.scene = s.id;
      this.cb.onScene(s.id);
      this.engine?.setScene(s);
      this.narrator.enter(s, next - s.start);
    }
    this.engine?.setMusic(musicLevel(next));
    this.tickAcc += dt;
    if (this.tickAcc >= 0.2) {
      this.tickAcc = 0;
      this.cb.onTick(next);
    }
  }
}
