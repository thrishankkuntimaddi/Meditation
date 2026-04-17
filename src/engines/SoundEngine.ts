/**
 * SoundEngine — synthesized bell sounds via Web Audio API
 * No external audio files needed. All sounds are generated on-device.
 */
export type BellType = 'crystal' | 'bowl' | 'chime';

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

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private bellType: BellType = 'crystal';
  private unlocked = false;

  setBellType(type: BellType) {
    this.bellType = type;
  }

  /** Must be called from a user gesture to unlock AudioContext */
  unlock() {
    if (this.unlocked) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.unlocked = true;
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.unlocked = true;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private synthesizeBell(ctx: AudioContext, config: BellConfig, startTime: number, volume = 0.8) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, startTime);
    masterGain.connect(ctx.destination);

    config.partials.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const envGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(config.fundamental * freq, startTime);

      envGain.gain.setValueAtTime(0, startTime);
      envGain.gain.linearRampToValueAtTime(gain, startTime + 0.005);
      envGain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);

      osc.connect(envGain);
      envGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + decay + 0.01);
    });
  }

  /** Single bell */
  playBell() {
    const ctx = this.getCtx();
    const config = BELL_CONFIGS[this.bellType];
    this.synthesizeBell(ctx, config, ctx.currentTime);
    this.haptic();
  }

  /** Double bell (end of phase) */
  playDoubleBell() {
    const ctx = this.getCtx();
    const config = BELL_CONFIGS[this.bellType];
    const t = ctx.currentTime;
    this.synthesizeBell(ctx, config, t);
    this.synthesizeBell(ctx, config, t + config.totalDecay * 0.4, 0.7);
    this.haptic([100, 50, 100]);
  }

  /** Quad bell (session complete) */
  playQuadBell() {
    const ctx = this.getCtx();
    const config = BELL_CONFIGS[this.bellType];
    const t = ctx.currentTime;
    const gap = config.totalDecay * 0.35;
    [0, gap, gap * 2, gap * 3].forEach((offset, i) => {
      this.synthesizeBell(ctx, config, t + offset, 0.8 - i * 0.06);
    });
    this.haptic([100, 80, 100, 80, 100, 80, 150]);
  }

  private haptic(pattern: number[] | number = 200) {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (_) {}
  }
}

export const soundEngine = new SoundEngine();
