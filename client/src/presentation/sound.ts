type OscillatorWave = OscillatorType;

const DTMF: Record<string, readonly [number, number]> = {
  "1": [697, 1209],
  "2": [697, 1336],
  "3": [697, 1477],
  "4": [770, 1209],
  "5": [770, 1336],
  "6": [770, 1477],
  "7": [852, 1209],
  "8": [852, 1336],
  "9": [852, 1477],
  "*": [941, 1209],
  "0": [941, 1336],
  "#": [941, 1477]
};

export class SoundEngine {
  private context: AudioContext | null = null;
  enabled = true;

  activate(): void {
    if (!this.enabled) return;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") void this.context.resume();
  }

  private scheduleTone(
    frequency: number,
    startOffsetMs: number,
    durationMs: number,
    gainValue: number,
    wave: OscillatorWave = "sine"
  ): void {
    if (!this.enabled || !this.context) return;

    const start = this.context.currentTime + startOffsetMs / 1000;
    const stop = start + durationMs / 1000;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainValue, start + 0.008);
    gain.gain.setValueAtTime(gainValue, Math.max(start + 0.009, stop - 0.018));
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(stop + 0.01);
  }

  private dualTone(
    first: number,
    second: number,
    durationMs: number,
    gainValue: number,
    startOffsetMs = 0
  ): void {
    this.scheduleTone(first, startOffsetMs, durationMs, gainValue / 2, "sine");
    this.scheduleTone(second, startOffsetMs, durationMs, gainValue / 2, "sine");
  }

  private noise(startOffsetMs: number, durationMs: number, gainValue: number): void {
    if (!this.enabled || !this.context) return;

    const sampleRate = this.context.sampleRate;
    const frameCount = Math.ceil(sampleRate * durationMs / 1000);
    const buffer = this.context.createBuffer(1, frameCount, sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < frameCount; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const start = this.context.currentTime + startOffsetMs / 1000;
    const stop = start + durationMs / 1000;

    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 1700;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainValue, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    source.start(start);
    source.stop(stop);
  }

  key(): void {
    this.scheduleTone(720, 0, 18, 0.006, "square");
  }

  dialTone(durationMs = 260): void {
    this.dualTone(350, 440, durationMs, 0.024);
  }

  dtmf(digit: string, durationMs = 92): void {
    const frequencies = DTMF[digit];
    if (!frequencies) return;
    this.dualTone(frequencies[0], frequencies[1], durationMs, 0.035);
  }

  ring(durationMs = 360): void {
    // North American ringback is traditionally a 440/480 Hz combination.
    this.dualTone(440, 480, durationMs, 0.028);
  }

  busy(): void {
    // Compressed 480/620 Hz busy cadence for game pacing.
    this.dualTone(480, 620, 230, 0.026, 0);
    this.dualTone(480, 620, 230, 0.026, 430);
  }

  handshake(): void {
    if (!this.enabled || !this.context) return;

    // Not a recording: this is a synthesized, modem-inspired answer/negotiation
    // sequence built from classic telephone/modem frequencies and filtered noise.
    this.scheduleTone(2100, 0, 330, 0.026, "sine");
    this.scheduleTone(1300, 390, 105, 0.018, "square");
    this.scheduleTone(1800, 505, 105, 0.016, "square");
    this.scheduleTone(2400, 620, 115, 0.014, "square");
    this.scheduleTone(1200, 750, 90, 0.016, "sine");
    this.scheduleTone(2200, 850, 95, 0.014, "sine");
    this.scheduleTone(1650, 960, 120, 0.014, "square");
    this.noise(390, 930, 0.012);

    const start = this.context.currentTime + 1.08;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(700, start);
    oscillator.frequency.exponentialRampToValueAtTime(2600, start + 0.28);
    oscillator.frequency.exponentialRampToValueAtTime(950, start + 0.52);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.009, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.56);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.58);
  }
}
