import type { Scene, SfxKind } from '../timeline';

/**
 * Layered Web Audio soundscape: room/crowd bed (brown noise, filtered per era),
 * a slow music bed (detuned oscillators through a lowpass), and one-shot effects.
 * Everything is synthesized in the browser. No external audio files or paid APIs.
 */
export class Engine {
  readonly ctx: AudioContext;
  private master: GainNode;
  private duck: GainNode;
  private bedFilter: BiquadFilterNode;
  private bedGain: GainNode;
  private music: GainNode;
  private live = new Set<AudioScheduledSourceNode>();

  constructor() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);

    this.duck = ctx.createGain();
    this.duck.gain.value = 1;
    this.duck.connect(this.master);

    this.bedFilter = ctx.createBiquadFilter();
    this.bedFilter.type = 'lowpass';
    this.bedFilter.frequency.value = 220;
    this.bedGain = ctx.createGain();
    this.bedGain.gain.value = 0.06;
    this.bedFilter.connect(this.bedGain);
    this.bedGain.connect(this.duck);

    const musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass';
    musicFilter.frequency.value = 900;
    this.music = ctx.createGain();
    this.music.gain.value = 0.02;
    this.music.connect(musicFilter);
    musicFilter.connect(this.duck);

    this.startBed();
    this.startMusic();
  }

  private startBed() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.bedFilter);
    src.start();
  }

  private startMusic() {
    const ctx = this.ctx;
    const freqs = [73.42, 110, 146.83, 220];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.value = 0.25 / (i + 1);
      o.connect(g);
      g.connect(this.music);
      o.start();
    });
  }

  setScene(scene: Scene) {
    const now = this.ctx.currentTime;
    this.bedFilter.frequency.setTargetAtTime(scene.bed.cutoff, now, 1.5);
    this.bedGain.gain.setTargetAtTime(scene.bed.gain, now, 1.5);
  }

  setMusic(level: number) {
    this.music.gain.setTargetAtTime(level, this.ctx.currentTime, 0.5);
  }

  /** Lower the music and bed while narration is speaking so the voice stays intelligible. */
  setDuck(on: boolean) {
    this.duck.gain.setTargetAtTime(on ? 0.35 : 1, this.ctx.currentTime, 0.15);
  }

  setMuted(muted: boolean) {
    this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  suspend() {
    void this.ctx.suspend();
  }

  resume() {
    void this.ctx.resume();
  }

  stopAll() {
    for (const n of this.live) {
      try {
        n.stop();
      } catch {
        /* already stopped */
      }
    }
    this.live.clear();
  }

  private burst(o: { type: BiquadFilterType; freq: number; q?: number; dur: number; gain: number; at?: number }) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (o.at ?? 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * o.dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = o.type;
    f.frequency.value = o.freq;
    f.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(o.gain, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.duck);
    src.start(t0);
    src.stop(t0 + o.dur + 0.02);
    this.live.add(src);
    src.onended = () => this.live.delete(src);
  }

  private tone(o: { freq: number; dur: number; gain: number; type?: OscillatorType; at?: number }) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (o.at ?? 0);
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.value = o.freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(o.gain, t0 + Math.min(0.02, o.dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g);
    g.connect(this.duck);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.02);
    this.live.add(osc);
    osc.onended = () => this.live.delete(osc);
  }

  /** One-shot sound effect. Layer ids match the SfxKind names in the timeline. */
  sfx(kind: SfxKind) {
    switch (kind) {
      case 'footstep':
        this.burst({ type: 'lowpass', freq: 400, dur: 0.15, gain: 0.35 });
        break;
      case 'quill':
        for (let i = 0; i < 6; i++) this.burst({ type: 'highpass', freq: 3500, dur: 0.05, gain: 0.05, at: i * 0.09 });
        break;
      case 'rustle':
        this.burst({ type: 'bandpass', freq: 1400, q: 0.8, dur: 0.45, gain: 0.1 });
        break;
      case 'tick':
        this.burst({ type: 'bandpass', freq: 2800, q: 6, dur: 0.035, gain: 0.18 });
        break;
      case 'phone':
        for (const at of [0, 1.2]) {
          this.tone({ freq: 440, dur: 0.9, gain: 0.04, at });
          this.tone({ freq: 480, dur: 0.9, gain: 0.04, at });
        }
        break;
      case 'blip':
        this.tone({ freq: 1200, dur: 0.06, gain: 0.05 });
        break;
      case 'key':
        this.burst({ type: 'highpass', freq: 4000, dur: 0.02, gain: 0.12 });
        break;
      case 'chime':
        this.tone({ freq: 880, dur: 0.7, gain: 0.06 });
        this.tone({ freq: 1320, dur: 0.9, gain: 0.05, at: 0.12 });
        break;
      case 'confirm':
        this.tone({ freq: 1046, dur: 0.25, gain: 0.05 });
        this.tone({ freq: 1568, dur: 0.4, gain: 0.05, at: 0.12 });
        break;
      case 'pulse':
        this.tone({ freq: 110, dur: 1.6, gain: 0.07 });
        this.tone({ freq: 880, dur: 0.2, gain: 0.015, at: 0.05 });
        break;
      case 'resolve':
        this.tone({ freq: 146.83, dur: 4, gain: 0.06 });
        this.tone({ freq: 220, dur: 4, gain: 0.04 });
        break;
    }
  }

  close() {
    this.stopAll();
    void this.ctx.close();
  }
}
