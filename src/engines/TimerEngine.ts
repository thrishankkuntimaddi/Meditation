/**
 * TimerEngine — drift-free timer using performance.now() + requestAnimationFrame
 */
export class TimerEngine {
  private startTime: number = 0;
  private pausedAt: number = 0;
  private totalPaused: number = 0;
  private rafId: number | null = null;
  private _running = false;
  private _paused = false;
  private totalDuration: number; // ms

  onTick: (elapsed: number, total: number) => void = () => {};
  onComplete: () => void = () => {};

  constructor(totalDurationSeconds: number) {
    this.totalDuration = totalDurationSeconds * 1000;
  }

  get running() { return this._running; }
  get paused() { return this._paused; }

  start() {
    if (this._running) return;
    this._running = true;
    this._paused = false;
    this.startTime = performance.now();
    this.totalPaused = 0;
    this.pausedAt = 0;
    this.loop();
  }

  pause() {
    if (!this._running || this._paused) return;
    this._paused = true;
    this.pausedAt = performance.now();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    if (!this._running || !this._paused) return;
    this._paused = false;
    this.totalPaused += performance.now() - this.pausedAt;
    this.loop();
  }

  stop() {
    this._running = false;
    this._paused = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset() {
    this.stop();
    this.startTime = 0;
    this.totalPaused = 0;
    this.pausedAt = 0;
  }

  getElapsedMs(): number {
    if (!this._running) return 0;
    const raw = performance.now() - this.startTime - this.totalPaused;
    return Math.max(0, raw);
  }

  private loop() {
    const tick = () => {
      if (!this._running || this._paused) return;
      const elapsed = this.getElapsedMs();
      this.onTick(elapsed, this.totalDuration);
      if (elapsed >= this.totalDuration) {
        this._running = false;
        this.onComplete();
        return;
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
