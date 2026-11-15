/**
 * Pure Web Audio API synthesizer + Haptic vibration driver for Aegis Watch OS.
 * Works 100% offline with zero external audio MP3/WAV dependencies.
 */

let sharedCtx: AudioContext | null = null;
let musicInterval: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) {
    sharedCtx = new Ctor();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function triggerHaptic(pattern: number | number[] = 40): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore if browser blocks vibration prior to interaction
    }
  }
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.09,
  delaySec = 0
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.03);
}

export function playTapClick(muted = false): void {
  if (muted) return;
  playTone(720, 0.045, 'triangle', 0.04);
}

export function playCountdownTick(go = false, muted = false): void {
  if (muted) return;
  if (go) {
    playTone(880, 0.14, 'triangle', 0.12, 0);
    playTone(1174.66, 0.24, 'sine', 0.12, 0.1);
    triggerHaptic([60, 40, 120]);
  } else {
    playTone(523.25, 0.1, 'sine', 0.08);
    triggerHaptic(35);
  }
}

export function playBuffVictory(muted = false): void {
  if (muted) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, idx) => playTone(n, 0.22, 'triangle', 0.08, idx * 0.08));
  triggerHaptic([35, 30, 75]);
}

export function playWarningChime(muted = false): void {
  if (muted) return;
  playTone(587.33, 0.16, 'triangle', 0.1, 0);
  playTone(440, 0.22, 'triangle', 0.1, 0.18);
  triggerHaptic([90, 50, 90]);
}

export function playCriticalKlaxon(muted = false): void {
  if (muted) return;
  playTone(880, 0.18, 'sawtooth', 0.1, 0);
  playTone(622.25, 0.2, 'sawtooth', 0.1, 0.2);
  playTone(880, 0.18, 'sawtooth', 0.1, 0.42);
  triggerHaptic([160, 80, 160, 80, 220]);
}

export function playPeerEmergencyAlert(muted = false): void {
  if (muted) return;
  playTone(987.77, 0.14, 'square', 0.08, 0);
  playTone(1318.51, 0.14, 'square', 0.08, 0.16);
  playTone(987.77, 0.14, 'square', 0.08, 0.34);
  playTone(1318.51, 0.22, 'square', 0.08, 0.5);
  triggerHaptic([120, 60, 120, 60, 200]);
}

export function playAlarmRing(muted = false): void {
  if (muted) return;
  [0, 0.25, 0.5, 0.75].forEach((offset) => {
    playTone(1046.5, 0.15, 'triangle', 0.11, offset);
  });
  triggerHaptic([200, 100, 200]);
}

export function playGameNote(freq: number, muted = false): void {
  if (muted) return;
  playTone(freq, 0.19, 'sine', 0.09);
}

export interface OfflineTrack {
  id: string;
  title: string;
  subtitle: string;
  bpm: number;
  notes: number[];
  waveform: OscillatorType;
}

export const OFFLINE_MUSIC_TRACKS: OfflineTrack[] = [
  {
    id: 'track-orbit',
    title: 'Orbital Sunrise Drift',
    subtitle: 'Calm UTC-0 Melatonin Synth',
    bpm: 72,
    notes: [261.63, 329.63, 392.0, 493.88, 392.0, 329.63],
    waveform: 'sine',
  },
  {
    id: 'track-ared',
    title: 'ARED Pulse Cadence',
    subtitle: 'Resistive Squat Focus Tempo',
    bpm: 124,
    notes: [220, 261.63, 329.63, 440, 329.63, 392],
    waveform: 'triangle',
  },
  {
    id: 'track-cupola',
    title: 'Cupola Earthglow Pad',
    subtitle: 'Deep Sleep Slow Wave Aid',
    bpm: 60,
    notes: [196, 246.94, 293.66, 392, 293.66, 246.94],
    waveform: 'sine',
  },
  {
    id: 'track-lunar',
    title: 'Lunar Rover Lo-Fi',
    subtitle: 'EVA Routine Chime',
    bpm: 96,
    notes: [293.66, 349.23, 440, 523.25, 440, 349.23],
    waveform: 'triangle',
  },
];

export function stopOfflineMusic(): void {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

export function startOfflineMusic(track: OfflineTrack, onStep?: (stepIdx: number) => void): void {
  stopOfflineMusic();
  let idx = 0;
  const stepMs = Math.round((60 / track.bpm) * 1000);
  const tick = () => {
    const freq = track.notes[idx % track.notes.length];
    playTone(freq, Math.min(0.65, stepMs / 1050), track.waveform, 0.06);
    onStep?.(idx % track.notes.length);
    idx += 1;
  };
  tick();
  musicInterval = setInterval(tick, stepMs);
}
