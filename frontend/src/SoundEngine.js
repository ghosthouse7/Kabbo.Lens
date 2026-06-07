// ─── Kabbo.Lens Web Audio Sound Engine ──────────────────────────────────────
// Drop-in replacement for the SOUND_LIBRARY + playSound approach
// Generates ambient sounds synthetically using Web Audio API — no CORS issues
import { createSoundEngine } from "./SoundEngine";
export function createSoundEngine() {
  let ctx = null;
  let activeNodes = [];

  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };

  const stopAll = () => {
    activeNodes.forEach(n => { try { n.stop(); } catch(_) {} });
    activeNodes = [];
  };

  // Tram bells — metallic sine bursts
  const tramBells = (ctx) => {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.18, ctx.currentTime);
    master.connect(ctx.destination);

    const ring = (time) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, time);
      osc.frequency.exponentialRampToValueAtTime(440, time + 0.8);
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(0.6, time + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
      osc.connect(env); env.connect(master);
      osc.start(time); osc.stop(time + 1.3);
      activeNodes.push(osc);

      // Harmonic
      const osc2 = ctx.createOscillator();
      const env2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, time);
      osc2.frequency.exponentialRampToValueAtTime(660, time + 0.6);
      env2.gain.setValueAtTime(0, time);
      env2.gain.linearRampToValueAtTime(0.3, time + 0.01);
      env2.gain.exponentialRampToValueAtTime(0.001, time + 0.9);
      osc2.connect(env2); env2.connect(master);
      osc2.start(time); osc2.stop(time + 1.0);
      activeNodes.push(osc2);
    };

    // Ring every 3-5 seconds
    let t = ctx.currentTime + 0.1;
    for (let i = 0; i < 20; i++) {
      ring(t);
      t += 3 + Math.random() * 2;
    }
    return master;
  };

  // Monsoon rain — filtered noise
  const monsoonRain = (ctx) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const hipass = ctx.createBiquadFilter();
    hipass.type = "highpass";
    hipass.frequency.value = 3000;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 8000;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    // Occasional heavy drops
    const dropGain = ctx.createGain();
    dropGain.gain.value = 1;

    source.connect(hipass);
    hipass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(dropGain);
    dropGain.connect(ctx.destination);

    source.start();
    activeNodes.push(source);

    // Intensity variations
    const vary = () => {
      if (!activeNodes.includes(source)) return;
      const now = ctx.currentTime;
      const intensity = 0.08 + Math.random() * 0.2;
      gain.gain.linearRampToValueAtTime(intensity, now + 1.5);
      setTimeout(vary, 1500 + Math.random() * 2000);
    };
    vary();
    return dropGain;
  };

  // Adda chatter — babbling voices simulation
  const addaChatter = (ctx) => {
    const master = ctx.createGain();
    master.gain.value = 0.12;
    master.connect(ctx.destination);

    const voice = (freq, time, duration) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 3;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * 0.5, time);
      osc.frequency.linearRampToValueAtTime(freq * 0.5 + (Math.random() - 0.5) * 50, time + duration);

      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(0.4, time + 0.05);
      env.gain.linearRampToValueAtTime(0.3, time + duration - 0.1);
      env.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(filter); filter.connect(env); env.connect(master);
      osc.start(time); osc.stop(time + duration);
      activeNodes.push(osc);
    };

    let t = ctx.currentTime;
    for (let i = 0; i < 40; i++) {
      const freq = 200 + Math.random() * 400;
      const dur = 0.2 + Math.random() * 0.8;
      voice(freq, t, dur);
      t += 0.1 + Math.random() * 0.4;
    }
    return master;
  };

  // Dhak drums — rhythmic percussion
  const dhakDrums = (ctx) => {
    const master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);

    const beat = (time, pitch, vol) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, time);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.3, time + 0.15);
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(vol, time + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(env); env.connect(master);
      osc.start(time); osc.stop(time + 0.2);
      activeNodes.push(osc);

      // Noise component
      const bufSize = Math.floor(ctx.sampleRate * 0.05);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
      const ns = ctx.createBufferSource();
      ns.buffer = buf;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(vol * 0.5, time);
      ng.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      ns.connect(ng); ng.connect(master);
      ns.start(time);
      activeNodes.push(ns);
    };

    // Dhak pattern: DHA DHA TIN TIN
    const pattern = [
      [0, 120, 0.8], [0.25, 120, 0.5],
      [0.5, 200, 0.6], [0.75, 200, 0.4],
      [1.0, 120, 0.9], [1.25, 120, 0.5],
      [1.5, 160, 0.5], [1.75, 200, 0.6],
    ];
    const tempo = 1.8;
    let t = ctx.currentTime;
    for (let rep = 0; rep < 12; rep++) {
      pattern.forEach(([offset, pitch, vol]) => {
        beat(t + offset, pitch, vol);
      });
      t += tempo;
    }
    return master;
  };

  // Street noise — layered urban ambience
  const streetNoise = (ctx) => {
    const master = ctx.createGain();
    master.gain.value = 0.1;
    master.connect(ctx.destination);

    // Low rumble
    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 400;
    const g = ctx.createGain(); g.gain.value = 0.3;
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start();
    activeNodes.push(src);

    // Horn honks
    const honk = (time) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 300 + Math.random() * 200;
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(0.15, time + 0.05);
      env.gain.setValueAtTime(0.15, time + 0.2 + Math.random() * 0.3);
      env.gain.linearRampToValueAtTime(0, time + 0.35 + Math.random() * 0.3);
      osc.connect(env); env.connect(master);
      osc.start(time); osc.stop(time + 0.7);
      activeNodes.push(osc);
    };
    let t = ctx.currentTime + 1;
    for (let i = 0; i < 15; i++) { honk(t); t += 1.5 + Math.random() * 3; }
    return master;
  };

  // Crow calls
  const crowCalls = (ctx) => {
    const master = ctx.createGain();
    master.gain.value = 0.2;
    master.connect(ctx.destination);

    const caw = (time) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass"; filter.frequency.value = 1200; filter.Q.value = 2;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.linearRampToValueAtTime(500, time + 0.15);
      osc.frequency.linearRampToValueAtTime(700, time + 0.25);
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(0.5, time + 0.02);
      env.gain.setValueAtTime(0.4, time + 0.2);
      env.gain.linearRampToValueAtTime(0, time + 0.3);
      osc.connect(filter); filter.connect(env); env.connect(master);
      osc.start(time); osc.stop(time + 0.35);
      activeNodes.push(osc);
    };

    let t = ctx.currentTime + 0.2;
    for (let i = 0; i < 8; i++) {
      const calls = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < calls; j++) { caw(t + j * 0.35); }
      t += 2 + Math.random() * 4;
    }
    return master;
  };

  const GENERATORS = {
    "tram bells":   tramBells,
    "monsoon rain": monsoonRain,
    "adda chatter": addaChatter,
    "dhak drums":   dhakDrums,
    "street noise": streetNoise,
    "crow calls":   crowCalls,
  };

  return {
    play(tag) {
      const gen = GENERATORS[tag.toLowerCase()];
      if (!gen) return false;
      stopAll();
      const c = getCtx();
      if (c.state === "suspended") c.resume();
      gen(c);
      return true;
    },
    stop() { stopAll(); },
    has(tag) { return !!GENERATORS[tag.toLowerCase()]; }
  };
}