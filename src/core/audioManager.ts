class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = false;

  constructor() {}

  /** iOSの制約を回避するため、ユーザー操作（ボタンクリック等）で呼び出す必要がある */
  init(): void {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.enabled = true;
    
    // Resume context if suspended
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(v: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.01);
    }
  }

  /** 石を置く音: 短いポーンという音 */
  playPlaceStone(): void {
    this.playTone(440, 0.1, 'sine');
  }

  /** 石をひっくり返す音: カチッという高い音 */
  playFlipStone(): void {
    this.playTone(880, 0.05, 'square', 0.1);
  }

  /** スキル発動音: 上昇するピッチ */
  playSkill(): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.5);
    
    g.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.connect(g);
    g.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  /** ガチャ演出音 */
  playGacha(): void {
    this.playTone(523.25, 0.1, 'triangle');
    setTimeout(() => this.playTone(659.25, 0.1, 'triangle'), 100);
    setTimeout(() => this.playTone(783.99, 0.3, 'triangle'), 200);
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2): void {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(g);
    g.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

export const audioManager = new AudioManager();
