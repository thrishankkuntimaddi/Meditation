/**
 * SoundEngine — synthesized bells via the Web Audio API.
 * No audio files: every sound is generated on-device, so it works offline
 * and inside the native shells without bundling assets.
 */
import type { BellSound, BreathStep } from '../types';

export type BellType = BellSound;

interface BellConfig {
  fundamental: number;
  partials: { freq: number; gain: number; decay: number }[];
  totalDecay: number;
}

const BELL_CONFIGS: Record<BellType, BellConfig> = {
  crystal: {
    fundamental: 880,
    partials: [
      { freq: 1, gain: 0.6, decay: 2.5 },
      { freq: 2.756, gain: 0.3, decay: 1.8 },
      { freq: 5.404, gain: 0.15, decay: 1.2 },
      { freq: 8.933, gain: 0.07, decay: 0.8 },
    ],
    totalDecay: 3,
  },
  bowl: {
    fundamental: 220,
    partials: [
      { freq: 1, gain: 0.7, decay: 4 },
      { freq: 2.756, gain: 0.25, decay: 3 },
      { freq: 5.404, gain: 0.1, decay: 2 },
    ],
    totalDecay: 5,
  },
  chime: {
    fundamental: 660,
    partials: [
      { freq: 1, gain: 0.5, decay: 1.5 },
      { freq: 2.0, gain: 0.35, decay: 1.0 },
      { freq: 3.0, gain: 0.2, decay: 0.7 },
      { freq: 4.5, gain: 0.1, decay: 0.4 },
    ],
    totalDecay: 2,
  },
};

// Soft breath cues — gentle sine tones, distinct per step
const CUE_FREQ: Record<BreathStep, number> = {
  inhale: 523.25,          // C5
  hold: 392,               // G4
  exhale: 329.63,          // E4
  holdAfterExhale: 392,
};

type AudioCtor = typeof AudioContext;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private bellType: BellType = 'crystal';
  private volume = 0.8;
  private silenced = false;  // forced silence (another device is meditating)

  setBellType(type: BellType) { this.bellType = type; }
  getBellType(): BellType { return this.bellType; }
  setVolume(v: number) { this.volume = Math.max(0, Math.min(1, v)); }

  /** When true, nothing plays — used while another synced device is meditating. */
  setSilenced(s: boolean) {
    this.silenced = s;
    if (s && this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }

  get isSilenced() { return this.silenced; }

  private createCtx(): AudioContext | null {
    const Ctor: AudioCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    return Ctor ? new Ctor() : null;
  }

  /**
   * Must be called from a user gesture to unlock audio (iOS/Safari/Chrome autoplay
   * policies). Plays a one-sample silent buffer, which is what iOS needs.
   */
  unlock() {
    if (!this.ctx) this.ctx = this.createCtx();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === 'suspended' && !this.silenced) ctx.resume().catch(() => {});
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch { /* ignore */ }
  }

  private async getCtx(): Promise<AudioContext | null> {
    if (this.silenced) return null;
    if (!this.ctx) this.ctx = this.createCtx();
    if (this.ctx && this.ctx.state !== 'running') {
      try { await this.ctx.resume(); } catch { /* ignore */ }
    }
    return this.ctx;
  }

  private synthesizeBell(ctx: AudioContext, config: BellConfig, startTime: number, level = 1) {
    const master = ctx.createGain();
    master.gain.setValueAtTime(this.volume * level, startTime);
    master.connect(ctx.destination);

    config.partials.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(config.fundamental * freq, startTime);
      env.gain.setValueAtTime(0, startTime);
      env.gain.linearRampToValueAtTime(gain, startTime + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + decay);
      osc.connect(env);
      env.connect(master);
      osc.start(startTime);
      osc.stop(startTime + decay + 0.02);
    });
  }

  private play(fn: (ctx: AudioContext, t: number) => void) {
    this.getCtx().then(ctx => { if (ctx) fn(ctx, ctx.currentTime + 0.02); }).catch(() => {});
  }

  /** Single bell (interval bell, preview, session start) */
  playBell(type: BellType = this.bellType) {
    this.play((ctx, t) => this.synthesizeBell(ctx, BELL_CONFIGS[type], t));
    this.haptic(120);
  }

  /** Double bell (phase change) */
  playDoubleBell() {
    const config = BELL_CONFIGS[this.bellType];
    this.play((ctx, t) => {
      this.synthesizeBell(ctx, config, t);
      this.synthesizeBell(ctx, config, t + config.totalDecay * 0.4, 0.85);
    });
    this.haptic([100, 60, 100]);
  }

  /** Four bells (session complete) */
  playQuadBell() {
    const config = BELL_CONFIGS[this.bellType];
    const gap = config.totalDecay * 0.35;
    this.play((ctx, t) => {
      [0, 1, 2, 3].forEach(i => this.synthesizeBell(ctx, config, t + gap * i, 1 - i * 0.08));
    });
    this.haptic([100, 80, 100, 80, 100, 80, 160]);
  }

  /** Soft tone marking a breath-step change */
  playBreathCue(step: BreathStep) {
    this.play((ctx, t) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(CUE_FREQ[step], t);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.18 * this.volume, t + 0.06);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.connect(env);
      env.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1);
    });
    this.haptic(30);
  }

  private haptic(pattern: number[] | number) {
    if (this.silenced) return;
    try {
      if ('vibrate' in navigator) navigator.vibrate(pattern);
    } catch { /* ignore */ }
  }
}

export const soundEngine = new SoundEngine();
