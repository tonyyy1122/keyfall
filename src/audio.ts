export class Sfx {
  private ctx: AudioContext | null = null
  muted = false

  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      this.ctx = new Ctx()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, toFreq?: number): void {
    if (this.muted || !this.ctx) return
    const start = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const amp = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    if (toFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(40, toFreq), start + dur)
    amp.gain.setValueAtTime(0.0001, start)
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + 0.012)
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(amp)
    amp.connect(this.ctx.destination)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  tick(): void {
    this.tone(760, 0.04, 'sine', 0.04)
  }

  word(combo: number): void {
    const base = combo >= 10 ? 680 : 523
    this.tone(base, 0.07, 'triangle', 0.05)
    this.tone(base * 1.5, 0.09, 'sine', 0.04, 0.05)
  }

  error(): void {
    this.tone(118, 0.08, 'square', 0.025)
  }

  life(): void {
    this.tone(240, 0.18, 'triangle', 0.05, 0, 80)
  }

  combo(): void {
    this.tone(523, 0.07, 'triangle', 0.045)
    this.tone(659, 0.07, 'triangle', 0.045, 0.06)
    this.tone(784, 0.12, 'sine', 0.04, 0.12)
  }

  go(): void {
    this.tone(392, 0.08, 'sine', 0.04)
    this.tone(588, 0.12, 'sine', 0.045, 0.07)
  }

  over(): void {
    this.tone(330, 0.16, 'triangle', 0.045)
    this.tone(220, 0.26, 'sine', 0.04, 0.1)
  }

  ui(): void {
    this.tone(490, 0.035, 'sine', 0.03)
  }
}
