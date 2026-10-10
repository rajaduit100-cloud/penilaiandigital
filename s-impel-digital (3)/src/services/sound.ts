/**
 * Sound and BGM service for S-IMPEL DIGITAL
 * Includes Web Audio API procedural melodic chime loop as fallback when no MP3 is supplied,
 * plus support for local audio files and audio elements with looping and volume controls.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;
  private bgmAudioElement: HTMLAudioElement | null = null;
  private isSynthesizerRunning = false;
  private synthLoopTimeout: number | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.4;
  private listeners: Array<() => void> = [];

  constructor() {
    // Check if user has saved mute preference
    const savedMute = localStorage.getItem('simpel_bgm_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('simpel_bgm_muted', String(muted));
    if (this.bgmAudioElement) {
      this.bgmAudioElement.muted = muted;
    }
    if (muted && this.isSynthesizerRunning) {
      this.stopSynthesizer();
    } else if (!muted && !this.bgmAudioElement?.src && !this.isSynthesizerRunning) {
      this.startSynthesizer();
    }
    this.notify();
  }

  public toggleMute() {
    this.setMuted(!this.isMuted);
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.bgmAudioElement) {
      this.bgmAudioElement.volume = this.volume;
    }
    this.notify();
  }

  public playCustomAudio(audioUrlOrBase64: string) {
    if (typeof window === 'undefined') return;
    this.stopSynthesizer();

    if (!this.bgmAudioElement) {
      this.bgmAudioElement = new Audio();
      this.bgmAudioElement.loop = true;
    }

    this.bgmAudioElement.src = audioUrlOrBase64;
    this.bgmAudioElement.volume = this.volume;
    this.bgmAudioElement.muted = this.isMuted;

    if (!this.isMuted) {
      this.bgmAudioElement.play().catch(() => {
        // Autoplay may be restricted until first user interaction
      });
    }
    this.notify();
  }

  public startGlobalBGM(preferredAudioUrl?: string) {
    if (typeof window === 'undefined') return;

    if (preferredAudioUrl && preferredAudioUrl.trim() !== '') {
      this.playCustomAudio(preferredAudioUrl);
      return;
    }

    // Otherwise use procedural soothing ambient synthesizer
    if (!this.isMuted) {
      this.startSynthesizer();
    }
    this.notify();
  }

  private startSynthesizer() {
    if (this.isSynthesizerRunning || this.isMuted) return;
    this.isSynthesizerRunning = true;
    this.playAmbientLoopPattern();
  }

  private stopSynthesizer() {
    this.isSynthesizerRunning = false;
    if (this.synthLoopTimeout) {
      window.clearTimeout(this.synthLoopTimeout);
      this.synthLoopTimeout = null;
    }
  }

  private playAmbientLoopPattern() {
    if (!this.isSynthesizerRunning || this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Harmonic pentatonic chords in royal G major/D major for festive prestigious feel
    const pentatonicNotes = [
      [392.00, 493.88, 587.33], // G Major
      [440.00, 554.37, 659.25], // A
      [329.63, 392.00, 493.88], // E minor
      [293.66, 369.99, 440.00], // D Major
    ];

    const randomChord = pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];
    
    randomChord.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const startTime = ctx.currentTime + idx * 0.35;
        const duration = 2.5;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.04 * this.volume, startTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      } catch {
        // audio context inactive
      }
    });

    this.synthLoopTimeout = window.setTimeout(() => {
      this.playAmbientLoopPattern();
    }, 4500);
  }

  // Interactive Sound Effects
  public playClick() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05 * this.volume, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  public playSuccessFanfare() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.12 * this.volume, ctx.currentTime + index * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.12 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.12);
        osc.stop(ctx.currentTime + index * 0.12 + 0.45);
      });
    } catch {}
  }

  public playTimerTick() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.02 * this.volume, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    } catch {}
  }

  public playVoteCoin() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
      gain.gain.setValueAtTime(0.1 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }
}

export const soundService = new SoundService();
