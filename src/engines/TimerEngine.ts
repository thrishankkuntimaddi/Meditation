/**
 * TimerEngine — wall-clock timer.
 *
 * Elapsed time is always `Date.now() - startedAt - pausedTotal`, so the timer
 * stays correct even when ticks are throttled (background tab) or suspended
 * (locked phone). Ticks are driven by setInterval rather than
 * requestAnimationFrame because rAF stops completely in hidden tabs, which
 * previously froze the session and silenced its bells.
 */
export class TimerEngine {
  private startedAt = 0;
  private pausedAt = 0;
  private pausedTotal = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private _running = false;
  private _paused = false;
  private readonly totalMs: number;
  private readonly tickMs: number;

  onTick: (elapsedMs: number, totalMs: number) => void = () => {};
  onComplete: () => void = () => {};

  constructor(totalDurationSeconds: number, tickMs = 100) {
    this.totalMs = totalDurationSeconds * 1000;
    this.tickMs = tickMs;
  }

  get running() { return this._running; }
  get paused() { return this._paused; }

  start() {
    if (this._running) return;
    this._running = true;
    this._paused = false;
    this.startedAt = Date.now();
    this.pausedTotal = 0;
    this.loop();
    document.addEventListener('visibilitychange', this.handleVisible);
  }

  pause() {
    if (!this._running || this._paused) return;
    this._paused = true;
    this.pausedAt = Date.now();
    this.clear();
  }

  resume() {
    if (!this._running || !this._paused) return;
    this._paused = false;
    this.pausedTotal += Date.now() - this.pausedAt;
    this.loop();
  }

  stop() {
    this._running = false;
    this._paused = false;
    this.clear();
    document.removeEventListener('visibilitychange', this.handleVisible);
  }

  getElapsedMs(): number {
    if (!this._running) return 0;
    const now = this._paused ? this.pausedAt : Date.now();
    return Math.max(0, Math.min(this.totalMs, now - this.startedAt - this.pausedTotal));
  }

  /** Wall-clock time at which the session will finish (null while paused). */
  getEndsAt(): number | null {
    if (!this._running || this._paused) return null;
    return Date.now() + (this.totalMs - this.getElapsedMs());
  }

  getRemainingMs(): number {
    return Math.max(0, this.totalMs - this.getElapsedMs());
  }

  private handleVisible = () => {
    // Catch up immediately when the user returns to the app
    if (document.visibilityState === 'visible') this.tick();
  };

  private tick = () => {
    if (!this._running || this._paused) return;
    const elapsed = this.getElapsedMs();
    this.onTick(elapsed, this.totalMs);
    if (elapsed >= this.totalMs) {
      this.stop();
      this.onComplete();
    }
  };

  private loop() {
    this.clear();
    this.tick();
    this.intervalId = setInterval(this.tick, this.tickMs);
  }

  private clear() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
