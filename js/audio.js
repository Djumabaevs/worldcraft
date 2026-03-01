// audio.js — Ambient city sounds via Web Audio API (procedural)
import Storage from './storage.js';

let audioCtx = null;
let masterGain = null;
let activeSources = [];
let isPlaying = false;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.1, delay = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.05);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
  return osc;
}

function noise(duration, volume = 0.02) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start();
  return source;
}

const Audio = {
  enabled: true,

  init() {
    this.enabled = Storage.getSettings().sound !== false;
  },

  toggle() {
    this.enabled = !this.enabled;
    const s = Storage.getSettings();
    s.sound = this.enabled;
    Storage.saveSettings(s);
    if (!this.enabled) this.stopAmbient();
  },

  resume() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  },

  playBuild() {
    if (!this.enabled) return;
    // Construction: ascending tones
    playTone(300, 0.15, 'square', 0.08, 0);
    playTone(400, 0.15, 'square', 0.08, 0.1);
    playTone(500, 0.2, 'square', 0.1, 0.2);
    playTone(600, 0.3, 'sine', 0.08, 0.35);
  },

  playCrumble() {
    if (!this.enabled) return;
    // Descending tones + noise
    playTone(400, 0.1, 'sawtooth', 0.06, 0);
    playTone(300, 0.1, 'sawtooth', 0.06, 0.08);
    playTone(200, 0.15, 'sawtooth', 0.06, 0.15);
    playTone(100, 0.3, 'sawtooth', 0.08, 0.22);
    noise(0.5, 0.03);
  },

  playAchievement() {
    if (!this.enabled) return;
    // Jingle: happy ascending
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => playTone(f, 0.25, 'sine', 0.1, i * 0.15));
  },

  playCheck() {
    if (!this.enabled) return;
    playTone(800, 0.1, 'sine', 0.06, 0);
    playTone(1200, 0.15, 'sine', 0.08, 0.08);
  },

  playAllComplete() {
    if (!this.enabled) return;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => playTone(f, 0.3, 'sine', 0.1, i * 0.12));
  },

  startAmbient(isNight = false) {
    if (!this.enabled || isPlaying) return;
    isPlaying = true;
    this._ambientLoop(isNight);
  },

  _ambientLoop(isNight) {
    if (!isPlaying || !this.enabled) return;
    // Occasional ambient sounds
    if (isNight) {
      // Cricket-like chirps
      const f = 4000 + Math.random() * 2000;
      playTone(f, 0.05, 'sine', 0.02, 0);
      playTone(f, 0.05, 'sine', 0.02, 0.1);
      playTone(f, 0.05, 'sine', 0.02, 0.2);
    } else {
      // Bird-like chirps
      const f = 1500 + Math.random() * 1500;
      playTone(f, 0.1, 'sine', 0.03, 0);
      playTone(f * 1.2, 0.08, 'sine', 0.03, 0.12);
      playTone(f * 0.9, 0.12, 'sine', 0.02, 0.22);
    }
    setTimeout(() => this._ambientLoop(isNight), 3000 + Math.random() * 7000);
  },

  stopAmbient() {
    isPlaying = false;
  }
};

export default Audio;
