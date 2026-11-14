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
    this.playShojiDoor();
  }

  // Traditional Japanese Shoji sliding door (和風障子木門開闔聲)
  public playShojiDoor() {
    this.playTone(180, 'sine', 0.12, 0, 0.08);
    this.playTone(220, 'triangle', 0.10, 0.05, 0.06);
    this.playTone(140, 'triangle', 0.15, 0.12, 0.05);
  }

  // Japanese Summer Wind Chime (風鈴清脆鳴響)
  public playWindChime() {
    const chimes = [1760, 2093, 2637, 3135.96];
    chimes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.35, idx * 0.07, 0.04);
    });
  }

  // Japanese Festival Taiko Drum (和太鼓震撼重音)
  public playTaiko() {
    this.playTone(75, 'sine', 0.25, 0, 0.25);
    this.playTone(55, 'triangle', 0.35, 0.02, 0.2);
    this.playTone(90, 'square', 0.05, 0, 0.15);
  }

  // Bamboo water drop (鹿威し 竹筒落水敲石聲)
  public playShishiOdoshi() {
    this.playTone(1400, 'sine', 0.04, 0, 0.12);
    this.playTone(220, 'triangle', 0.15, 0.25, 0.18);
    this.playTone(130, 'square', 0.08, 0.27, 0.1);
  }

  // Retro Slot Machine Spinning click (拉霸旋轉滾動聲)
  public playSlotSpin() {
    this.playTone(600, 'square', 0.03, 0, 0.04);
  }

  // Grand 777 Slot Jackpot (大獎慶祝奏樂)
  public playSlotJackpot() {
    const fanfare = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51];
    fanfare.forEach((freq, idx) => {
      this.playTone(freq, 'square', 0.2, idx * 0.12, 0.15);
    });
  }

  // Warning / AFK chime (閒置警示鳴笛)
  public playAlert() {
    this.playTone(880, 'sine', 0.1, 0, 0.15);
    this.playTone(880, 'sine', 0.1, 0.15, 0.15);
    this.playTone(660, 'sine', 0.2, 0.3, 0.12);
  }

  // Wooden Geta clatter on pier/bridge (木棧橋下駄腳步聲)
  public playStepWood() {
    this.playTone(280, 'triangle', 0.04, 0, 0.06);
    this.playTone(380, 'sine', 0.02, 0.01, 0.04);
  }

  // Soft dirt step (泥土小路腳步聲)
  public playStepDirt() {
    this.playTone(140, 'triangle', 0.03, 0, 0.04);
  }

  public playEmoji() {
    this.playTone(800, 'sine', 0.06, 0, 0.1);
    this.playTone(1200, 'sine', 0.1, 0.05, 0.1);
  }

  public playSuccess() {
    this.playWin();
  }

  public playCloth() {
    this.playTone(320, 'triangle', 0.06, 0, 0.06);
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
