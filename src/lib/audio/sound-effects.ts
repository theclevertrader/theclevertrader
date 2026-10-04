// =====================================================================
// THE CLEVER TRADER — PROFESSIONAL TRADING SOUND & CHIME ENGINE
// High-fidelity, zero-latency Web Audio API synthesizers producing
// authentic TradingView "Ding", Order Execution, TP Hit, SL, and BE chimes.
// Works 100% offline with zero external audio assets required.
// =====================================================================

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.8;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('clever_trader_sound_muted');
        if (savedMute !== null) this.muted = savedMute === 'true';
        const savedVol = localStorage.getItem('clever_trader_sound_volume');
        if (savedVol !== null) this.volume = parseFloat(savedVol);
      } catch (e) {}
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('clever_trader_sound_muted', String(muted));
      } catch (e) {}
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('clever_trader_sound_volume', String(this.volume));
      } catch (e) {}
    }
  }

  /**
   * 1. THE SIGNATURE TRADINGVIEW "DING" / BELL CHIME
   * Clean, crystal, resonant bell alert: 1318.5Hz (E6) with harmonic overtone & warm reverb tail
   */
  public playTradingViewDing(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.7, now);
    masterGain.connect(ctx.destination);

    // Fundamental Bell Sine: E6 (1318.51 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now);
    // Subtle initial strike pitch bend down to settle
    osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.05);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.8, now + 0.008); // ultra fast strike
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); // sweet 1.2s bell ring

    osc1.connect(gain1);
    gain1.connect(masterGain);

    // Overtone: 2nd harmonic 2637 Hz (sparkle)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2637.02, now);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    // High shimmer: 3955 Hz (glassy shine)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(3955.53, now);

    gain3.gain.setValueAtTime(0.001, now);
    gain3.gain.linearRampToValueAtTime(0.15, now + 0.003);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc3.connect(gain3);
    gain3.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 1.25);
    osc2.stop(now + 0.5);
    osc3.stop(now + 0.3);
  }

  /**
   * 2. ORDER PLACED / EXECUTED CHIME (Crisp Upward Fill Ping)
   * Two quick rising glassy notes: 987.77 Hz (B5) -> 1318.51 Hz (E6)
   */
  public playOrderExecutedChime(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.75, now);
    masterGain.connect(ctx.destination);

    // Note 1: 987.77 Hz (B5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.7, now + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Note 2: 1318.51 Hz (E6) at +0.09s
    const t2 = now + 0.09;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, t2);
    gain2.gain.setValueAtTime(0.001, t2);
    gain2.gain.linearRampToValueAtTime(0.9, t2 + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.9);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.95);

    // Overtone sparkle on Note 2 (2637 Hz)
    const osc2H = ctx.createOscillator();
    const gain2H = ctx.createGain();
    osc2H.type = 'triangle';
    osc2H.frequency.setValueAtTime(2637.02, t2);
    gain2H.gain.setValueAtTime(0.001, t2);
    gain2H.gain.linearRampToValueAtTime(0.25, t2 + 0.005);
    gain2H.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.4);
    osc2H.connect(gain2H);
    gain2H.connect(masterGain);
    osc2H.start(t2);
    osc2H.stop(t2 + 0.45);
  }

  /**
   * 3. TAKE PROFIT (TP) HIT — CELEBRATION CASH CHIME
   * Glorious 3-tone arpeggio (C6 -> E6 -> G6 -> High C7 bell with lingering golden sustain)
   */
  public playTakeProfitChime(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.8, now);
    masterGain.connect(ctx.destination);

    const notes = [
      { freq: 1046.50, delay: 0.00, dur: 0.4, vol: 0.6 },  // C6
      { freq: 1318.51, delay: 0.10, dur: 0.5, vol: 0.7 },  // E6
      { freq: 1567.98, delay: 0.20, dur: 0.6, vol: 0.8 },  // G6
      { freq: 2093.00, delay: 0.30, dur: 1.5, vol: 1.0 },  // C7 (Grand Finale Ding)
    ];

    notes.forEach(n => {
      const startTime = now + n.delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(n.vol, startTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + n.dur);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + n.dur + 0.05);

      // Add harmonic shimmer to the top note
      if (n.freq === 2093.00) {
        const oscH = ctx.createOscillator();
        const gainH = ctx.createGain();
        oscH.type = 'triangle';
        oscH.frequency.setValueAtTime(4186.01, startTime);
        gainH.gain.setValueAtTime(0.001, startTime);
        gainH.gain.linearRampToValueAtTime(0.3, startTime + 0.005);
        gainH.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);
        oscH.connect(gainH);
        gainH.connect(masterGain);
        oscH.start(startTime);
        oscH.stop(startTime + 0.65);
      }
    });
  }

  /**
   * 4. STOP LOSS (SL) HIT — SUBTLE RISK ALERT
   * Dual descending gentle warning: 523Hz -> 392Hz (C5 -> G4)
   */
  public playStopLossTone(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.6, now);
    masterGain.connect(ctx.destination);

    // Tone 1: 523.25 Hz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2: 392.00 Hz at +0.12s
    const t2 = now + 0.12;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(392.00, t2);
    gain2.gain.setValueAtTime(0.001, t2);
    gain2.gain.linearRampToValueAtTime(0.6, t2 + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.5);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.55);
  }

  /**
   * 5. BREAK-EVEN (BE) SHIFT — ZERO RISK SHIELD LOCK
   * Crisp metallic security click + clean bell lock: 880Hz click + 1760Hz pure chime
   */
  public playBreakEvenChime(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.7, now);
    masterGain.connect(ctx.destination);

    // Metallic click transient
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.003);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Shield Lock Chime (1760 Hz - A6) at +0.03s
    const t2 = now + 0.03;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, t2);
    gain2.gain.setValueAtTime(0.001, t2);
    gain2.gain.linearRampToValueAtTime(0.8, t2 + 0.006);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.9);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.95);
  }

  /**
   * 6. 50% PARTIAL CLOSE — COIN / PROFIT HARVEST CHIME
   * Sparkling dual coin ping: 1567.98 Hz (G6) + 1975.53 Hz (B6)
   */
  public playPartialCloseChime(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.75, now);
    masterGain.connect(ctx.destination);

    // Coin 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1567.98, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.7, now + 0.006);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Coin 2
    const t2 = now + 0.08;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1975.53, t2);
    gain2.gain.setValueAtTime(0.001, t2);
    gain2.gain.linearRampToValueAtTime(0.8, t2 + 0.006);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.8);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.85);
  }

  /**
   * 7. MT5 DISCONNECT EMERGENCY WARNING SIREN
   * Pulsing dual-tone urgent warning alarm: 880 Hz -> 587.33 Hz (A5 -> D5)
   * Plays an authentic 2-pulse alert: BEEP-BEEP BEEP-BEEP
   */
  public playDisconnectWarningAlarm(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.85, now);
    masterGain.connect(ctx.destination);

    const tones = [
      { start: now, freq: 880, dur: 0.15 },
      { start: now + 0.18, freq: 587.33, dur: 0.18 },
      { start: now + 0.45, freq: 880, dur: 0.15 },
      { start: now + 0.63, freq: 587.33, dur: 0.25 },
    ];

    tones.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(t.freq, t.start);
      gain.gain.setValueAtTime(0.001, t.start);
      gain.gain.linearRampToValueAtTime(0.5, t.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t.start + t.dur);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t.start);
      osc.stop(t.start + t.dur + 0.05);
    });
  }

  /**
   * 8. DYNAMIC TRAILING STOP — STEP-BY-STEP PROFIT LOCK CHIME
   * Ascending 3-note harmonic staircase: 698.46 Hz (F5) -> 880 Hz (A5) -> 1046.5 Hz (C6)
   * Plays a crisp, satisfying mechanical ratchet/profit-lock chime
   */
  public playTrailingStopChime(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.8, now);
    masterGain.connect(ctx.destination);

    const steps = [
      { start: now, freq: 698.46, dur: 0.18 },
      { start: now + 0.07, freq: 880.00, dur: 0.22 },
      { start: now + 0.14, freq: 1046.50, dur: 0.45 },
    ];

    steps.forEach((s, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(s.freq, s.start);
      gain.gain.setValueAtTime(0.001, s.start);
      gain.gain.linearRampToValueAtTime(0.6 + (idx * 0.1), s.start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, s.start + s.dur);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(s.start);
      osc.stop(s.start + s.dur + 0.05);
    });
  }
}

export const soundEngine = new SoundEngine();
