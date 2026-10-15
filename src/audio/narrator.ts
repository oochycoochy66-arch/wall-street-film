import type { Scene, SceneId } from '../timeline';

/**
 * Narration. Per scene, a prerecorded clip at /audio/<file> is used if the server returns audio/*.
 * Otherwise the scene line is spoken with Web Speech Synthesis (word boundaries drive captions).
 * Narration is only started from a user gesture (the start screen), which is when the caller calls enter().
 */
export class Narrator {
  private clips = new Map<SceneId, HTMLAudioElement>();
  private active = new Set<HTMLAudioElement>();
  private busy = 0;
  private enabled = true;
  private paused = false;
  private speechOK = typeof window !== 'undefined' && 'speechSynthesis' in window;
  private onSpeaking: (on: boolean) => void;
  private onCaption: (id: SceneId, chars: number) => void;

  constructor(onSpeaking: (on: boolean) => void, onCaption: (id: SceneId, chars: number) => void) {
    this.onSpeaking = onSpeaking;
    this.onCaption = onCaption;
  }

  /** Check which prerecorded clips exist. Missing or non-audio responses fall back to speech. */
  async probe(scenes: Scene[]): Promise<Record<string, 'clip' | 'speech' | 'none'>> {
    await Promise.all(
      scenes.map(async (s) => {
        try {
          const r = await fetch(s.clip, { method: 'HEAD' });
          const type = r.headers.get('content-type') ?? '';
          if (r.ok && type.startsWith('audio/')) {
            const a = new Audio(s.clip);
            a.preload = 'auto';
            this.clips.set(s.id, a);
          }
        } catch {
          /* no clip for this scene */
        }
      }),
    );
    const out: Record<string, 'clip' | 'speech' | 'none'> = {};
    for (const s of scenes) out[s.id] = this.sourceFor(s);
    return out;
  }

  sourceFor(scene: Scene): 'clip' | 'speech' | 'none' {
    if (this.clips.has(scene.id)) return 'clip';
    if (this.speechOK && scene.narration) return 'speech';
    return 'none';
  }

  private voice(): SpeechSynthesisVoice | null {
    const vs = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
    const prefs = [/Google US English/i, /Microsoft (Guy|Davis|Jason|Mark)/i, /Samantha|Daniel|Alex/i];
    for (const p of prefs) {
      const v = vs.find((x) => p.test(x.name));
      if (v) return v;
    }
    return vs.find((v) => v.lang === 'en-US') ?? null;
  }

  private bump(delta: number) {
    this.busy = Math.max(0, this.busy + delta);
    this.onSpeaking(this.busy > 0);
  }

  /** Start a scene's narration at an offset (seconds into the scene). */
  enter(scene: Scene, offset: number) {
    const full = scene.narration?.length ?? 0;
    if (!scene.narration) return;
    if (!this.enabled || this.paused || offset > 1) {
      this.onCaption(scene.id, full);
      return;
    }
    const clip = this.clips.get(scene.id);
    if (clip) {
      this.onCaption(scene.id, full);
      clip.currentTime = Math.max(0, offset);
      this.active.add(clip);
      this.bump(1);
      clip.onended = () => {
        this.active.delete(clip);
        this.bump(-1);
      };
      clip.onerror = () => {
        this.active.delete(clip);
        this.bump(-1);
        this.onCaption(scene.id, full);
      };
      void clip.play().catch(() => {
        this.active.delete(clip);
        this.bump(-1);
      });
      return;
    }
    if (!this.speechOK) {
      this.onCaption(scene.id, full);
      return;
    }
    this.onCaption(scene.id, 0);
    const u = new SpeechSynthesisUtterance(scene.narration);
    const v = this.voice();
    if (v) u.voice = v;
    u.lang = 'en-US';
    u.rate = 0.92;
    u.pitch = 0.85;
    u.onstart = () => this.bump(1);
    u.onboundary = (e) => {
      if (e.name !== 'word') return;
      const word = /^\S+/.exec(scene.narration!.slice(e.charIndex))?.[0] ?? '';
      this.onCaption(scene.id, Math.min(full, e.charIndex + word.length));
    };
    u.onend = () => {
      this.bump(-1);
      this.onCaption(scene.id, full);
    };
    u.onerror = () => {
      this.bump(-1);
      this.onCaption(scene.id, full);
    };
    window.speechSynthesis.speak(u);
  }

  pause() {
    this.paused = true;
    if (this.speechOK) window.speechSynthesis.pause();
    this.active.forEach((a) => a.pause());
  }

  resume() {
    this.paused = false;
    if (this.speechOK) window.speechSynthesis.resume();
    this.active.forEach((a) => void a.play().catch(() => undefined));
  }

  /** Cancel everything (seek, restart, or narration turned off). */
  stopAll() {
    if (this.speechOK) window.speechSynthesis.cancel();
    this.active.forEach((a) => {
      a.pause();
      a.onended = null;
      a.onerror = null;
    });
    this.active.clear();
    this.busy = 0;
    this.onSpeaking(false);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stopAll();
  }
}
