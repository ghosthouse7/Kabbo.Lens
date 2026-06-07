export function createSoundEngine() {
  let ctx = null;
  let activeNodes = [];
  let masterGain = null;

  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  const stopAll = () => {
    activeNodes.forEach(n => { try { n.stop(); } catch(_) {} });
    activeNodes = [];
    if (masterGain) { masterGain.disconnect(); masterGain = null; }
  };

  const makeMaster = (c, vol = 0.7) => {
    masterGain = c.createGain();
    masterGain.gain.value = vol;
    masterGain.connect(c.destination);
    return masterGain;
  };

  // ── TRAM BELLS ──
  const playTramBells = (c, vol) => {
    const master = makeMaster(c, vol);
    const ring = (time) => {
      [880, 1320].forEach((freq, i) => {
        const osc = c.createOscillator();
        const env = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.9);
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(i === 0 ? 0.6 : 0.3, time + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, time + 1.1);
        osc.connect(env); env.connect(master);
        osc.start(time); osc.stop(time + 1.2);
        activeNodes.push(osc);
      });
    };
    let t = c.currentTime + 0.1;
    for (let i = 0; i < 20; i++) { ring(t); t += 2.5 + Math.random() * 2.5; }
  };

  // ── MONSOON RAIN ──
  const playMonsoonRain = (c, vol) => {
    const master = makeMaster(c, vol);
    const bufSize = c.sampleRate * 3;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true;
    const hi = c.createBiquadFilter(); hi.type = 'highpass'; hi.frequency.value = 2500;
    const lo = c.createBiquadFilter(); lo.type = 'lowpass'; lo.frequency.value = 9000;
    src.connect(hi); hi.connect(lo); lo.connect(master);
    src.start();
    activeNodes.push(src);
  };

  // ── ADDA CHATTER ──
  const playAddaChatter = (c, vol) => {
    const master = makeMaster(c, vol * 0.8);
    let t = c.currentTime;
    for (let i = 0; i < 50; i++) {
      const osc = c.createOscillator();
      const env = c.createGain();
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 200 + Math.random() * 500;
      filt.Q.value = 4;
      osc.type = 'sawtooth';
      osc.frequency.value = 100 + Math.random() * 200;
      const dur = 0.15 + Math.random() * 0.7;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.35, t + 0.04);
      env.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(filt); filt.connect(env); env.connect(master);
      osc.start(t); osc.stop(t + dur + 0.05);
      activeNodes.push(osc);
      t += 0.08 + Math.random() * 0.35;
    }
  };

  // ── DHAK DRUMS ──
  const playDhakDrums = (c, vol) => {
    const master = makeMaster(c, vol);
    const beat = (time, pitch, v) => {
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, time);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.25, time + 0.18);
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(v, time + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      osc.connect(env); env.connect(master);
      osc.start(time); osc.stop(time + 0.22);
      activeNodes.push(osc);
    };
    const pattern = [[0,0.9],[0.25,0.5],[0.5,0.7],[0.75,0.4],[1.0,0.95],[1.375,0.6],[1.625,0.5],[1.875,0.7]];
    const pitches = [110, 160, 200, 160];
    let t = c.currentTime;
    for (let r = 0; r < 15; r++) {
      pattern.forEach(([off, v], i) => {
        beat(t + off, pitches[i % pitches.length], v);
      });
      t += 2.0;
    }
  };

  // ── STREET NOISE ──
  const playStreetNoise = (c, vol) => {
    const master = makeMaster(c, vol * 0.9);
    // Rumble
    const bufSize = c.sampleRate * 2;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 350;
    const g = c.createGain(); g.gain.value = 0.25;
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(); activeNodes.push(src);
    // Honks
    let t = c.currentTime + 0.5;
    for (let i = 0; i < 12; i++) {
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = 'square';
      osc.frequency.value = 280 + Math.random() * 180;
      const dur = 0.15 + Math.random() * 0.35;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.12, t + 0.04);
      env.gain.setValueAtTime(0.12, t + dur);
      env.gain.linearRampToValueAtTime(0, t + dur + 0.08);
      osc.connect(env); env.connect(master);
      osc.start(t); osc.stop(t + dur + 0.1);
      activeNodes.push(osc);
      t += 1.2 + Math.random() * 3.5;
    }
  };

  // ── CROW CALLS ──
  const playCrowCalls = (c, vol) => {
    const master = makeMaster(c, vol);
    const caw = (time) => {
      const osc = c.createOscillator();
      const env = c.createGain();
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.value = 1100; filt.Q.value = 2.5;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, time);
      osc.frequency.linearRampToValueAtTime(480, time + 0.12);
      osc.frequency.linearRampToValueAtTime(650, time + 0.22);
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(0.5, time + 0.02);
      env.gain.setValueAtTime(0.4, time + 0.18);
      env.gain.linearRampToValueAtTime(0, time + 0.28);
      osc.connect(filt); filt.connect(env); env.connect(master);
      osc.start(time); osc.stop(time + 0.32);
      activeNodes.push(osc);
    };
    let t = c.currentTime + 0.2;
    for (let i = 0; i < 10; i++) {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < n; j++) caw(t + j * 0.38);
      t += 2.5 + Math.random() * 4;
    }
  };

  const SOUNDS = {
    'tram bells':   playTramBells,
    'monsoon rain': playMonsoonRain,
    'adda chatter': playAddaChatter,
    'dhak drums':   playDhakDrums,
    'street noise': playStreetNoise,
    'crow calls':   playCrowCalls,
  };

  return {
    play(tag, vol = 0.7) {
      stopAll();
      const fn = SOUNDS[tag];
      if (!fn) { console.warn('No sound for:', tag); return false; }
      const c = getCtx();
      fn(c, vol);
      return true;
    },
    stop() { stopAll(); },
    has(tag) { return !!SOUNDS[tag]; },
    setVolume(v) { if (masterGain) masterGain.gain.value = v; },
  };
}