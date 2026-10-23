/**
 * Procedural Web Audio API sound synthesizer
 * Zero external audio files required, instant low-latency playback.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastWarningTime = 0;

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

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public playDotCollect() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 780 + Math.random() * 80;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playProximityWarning(proximityRatio: number) {
    if (this.muted || proximityRatio <= 0.1) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Faster beeps when closer (between 0.15s and 0.6s)
    const interval = Math.max(0.14, 0.6 - proximityRatio * 0.45);
    if (now - this.lastWarningTime < interval) return;
    this.lastWarningTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Frequency rises from 380Hz to 620Hz as proximity reaches 1.0
    const freq = 360 + proximityRatio * 260;
    osc.frequency.setValueAtTime(freq, now);

    const vol = Math.min(0.12, 0.03 + proximityRatio * 0.08);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playCameraFlash() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Shutter mechanical click (burst of filtered noise)
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // 2. High flash charge & alarm dissonance
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, now + 0.04);
    osc1.frequency.exponentialRampToValueAtTime(220, now + 0.35);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(920, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(230, now + 0.35);

    toneGain.gain.setValueAtTime(0.18, now + 0.04);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(toneGain);
    osc2.connect(toneGain);
    toneGain.connect(this.ctx.destination);

    osc1.start(now + 0.04);
    osc2.start(now + 0.04);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  }

  public playVictory() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.12, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }

  public playMenuClick() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  private invulnerabilityOscs: OscillatorNode[] = [];
  private invulnerabilityGain: GainNode | null = null;

  public playPowerUpCollect() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.14, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.28);
    });
  }

  public startInvulnerabilityMusic() {
    if (this.muted) return;
    this.stopInvulnerabilityMusic();
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.connect(this.ctx.destination);
    this.invulnerabilityGain = gain;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(440, now);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(880, now);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(8, now); // 8Hz synth pulse
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(25, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    osc1.connect(gain);
    osc2.connect(gain);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    this.invulnerabilityOscs = [osc1, osc2, lfo];
  }

  public stopInvulnerabilityMusic() {
    if (this.invulnerabilityOscs.length > 0) {
      this.invulnerabilityOscs.forEach((o) => {
        try { o.stop(); o.disconnect(); } catch {}
      });
      this.invulnerabilityOscs = [];
    }
    if (this.invulnerabilityGain) {
      try { this.invulnerabilityGain.disconnect(); } catch {}
      this.invulnerabilityGain = null;
    }
  }
}

export const sounds = new SoundSystem();
