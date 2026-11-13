// Retro 8-bit Web Audio Synthesizer (Zero external file dependencies)
class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem('pixel_island_muted') === 'true';
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('pixel_island_muted', String(this.isMuted));
    return this.isMuted;
  }

  // Play a simple synthesized tone
  private playTone(freq: number, type: OscillatorType, duration: number, delay: number = 0, gainLevel: number = 0.1) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(gainLevel, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // AudioContext could fail if user hasn't interacted with DOM yet
    }
  }

  public playStep() {
    this.playTone(180, 'triangle', 0.04, 0, 0.05);
  }

  public playBump() {
    this.playTone(90, 'square', 0.08, 0, 0.08);
  }

  public playCoin() {
    this.playTone(987.77, 'square', 0.08, 0, 0.08); // B5
    this.playTone(1318.51, 'square', 0.25, 0.07, 0.09); // E6
  }

  public playBuy() {
    this.playTone(523.25, 'triangle', 0.08, 0, 0.1);
    this.playTone(659.25, 'triangle', 0.08, 0.08, 0.1);
    this.playTone(783.99, 'triangle', 0.08, 0.16, 0.1);
    this.playTone(1046.50, 'square', 0.2, 0.24, 0.12);
  }

  public playDoor() {
    this.playTone(300, 'sine', 0.08, 0, 0.1);
    this.playTone(450, 'sine', 0.08, 0.07, 0.1);
    this.playTone(600, 'sine', 0.15, 0.14, 0.1);
  }

  public playEmoji() {
    this.playTone(800, 'sine', 0.06, 0, 0.1);
    this.playTone(1200, 'sine', 0.1, 0.05, 0.1);
  }

  public playClick() {
    this.playTone(400, 'triangle', 0.04, 0, 0.05);
  }

  public playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'square', 0.15, idx * 0.1, 0.1);
    });
  }

  public playLose() {
    const notes = [400, 360, 320, 260];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sawtooth', 0.18, idx * 0.12, 0.08);
    });
  }
}

export const sound = new RetroAudioEngine();
