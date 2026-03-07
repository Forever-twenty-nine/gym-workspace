import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StopwatchService {
  private readonly _seconds = signal(0);
  private readonly _isActive = signal(false);
  private readonly _isPaused = signal(false);
  private _intervalId?: any;

  readonly seconds = this._seconds.asReadonly();
  readonly isActive = this._isActive.asReadonly();
  readonly isPaused = this._isPaused.asReadonly();

  readonly formattedTime = computed(() => {
    const s = this._seconds();
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  start() {
    if (this._isActive()) return;
    
    this._isActive.set(true);
    this._isPaused.set(false);
    this._startInterval();
  }

  pause() {
    if (!this._isActive() || this._isPaused()) return;
    
    this._isPaused.set(true);
    this._clearInterval();
  }

  resume() {
    if (!this._isActive() || !this._isPaused()) return;
    
    this._isPaused.set(false);
    this._startInterval();
  }

  stop() {
    this._isActive.set(false);
    this._isPaused.set(false);
    this._clearInterval();
    const totalSeconds = this._seconds();
    return totalSeconds;
  }

  reset() {
    this.stop();
    this._seconds.set(0);
  }

  private _startInterval() {
    this._clearInterval();
    this._intervalId = setInterval(() => {
      this._seconds.update(s => s + 1);
    }, 1000);
  }

  private _clearInterval() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
  }
}
