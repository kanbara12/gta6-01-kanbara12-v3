// Synthesised sound effects for SUNCOAST: HEATLINE.
// One clear job: every sound the game makes, built live with WebAudio —
// engine hum, gunshots, crashes, pickups, sirens. No audio files, no
// network. All original.

export function createAudio() {
  let ctx = null;
  let engineOsc = null, engineGain = null;
  const A = {
    muted: false,
    driftPlaying: false,
    ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    },
    tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null) {
      if (A.muted) return;
      const c = A.ensure(); if (!c) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + dur);
    },
    noise(dur, vol = 0.25, low = 400) {
      if (A.muted) return;
      const c = A.ensure(); if (!c) return;
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = low;
      const g = c.createGain(); g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(c.destination);
      src.start();
    },
    playShot(name) {
      if (name === 'BAT') { A.playSwing(); return; }
      if (name === 'SHOTGUN') { A.noise(0.28, 0.4, 900); A.tone(90, 0.15, 'square', 0.2, 40); return; }
      if (name === 'SMG') { A.noise(0.08, 0.22, 2400); return; }
      A.noise(0.14, 0.3, 1800); A.tone(220, 0.1, 'square', 0.12, 60);
    },
    playSwing() { A.noise(0.12, 0.12, 1200); },
    playHit() { A.tone(520, 0.08, 'square', 0.12, 300); },
    playCrash() { A.noise(0.3, 0.35, 500); A.tone(70, 0.25, 'sawtooth', 0.2, 35); },
    playPickup() { A.tone(660, 0.09, 'sine', 0.2); setTimeout(() => A.tone(990, 0.14, 'sine', 0.2), 90); },
    playDoor() { A.noise(0.1, 0.15, 700); },
    playSirenBlip() { A.tone(880, 0.12, 'square', 0.1, 1170); setTimeout(() => A.tone(1170, 0.12, 'square', 0.1, 880), 130); },
    playAbility() { A.tone(440, 0.12, 'sine', 0.18, 880); setTimeout(() => A.tone(880, 0.18, 'sine', 0.18), 110); },
    playDrift() {
      A.driftPlaying = true;
      A.noise(0.5, 0.1, 1400);
      setTimeout(() => { A.driftPlaying = false; }, 500);
    },
    /** Engine hum follows speed; call every frame while driving. */
    setEngine(speed01, on) {
      const c = A.ensure(); if (!c) return;
      if (A.muted || !on) {
        if (engineGain) engineGain.gain.value = 0;
        return;
      }
      if (!engineOsc) {
        engineOsc = c.createOscillator();
        engineOsc.type = 'sawtooth';
        engineGain = c.createGain();
        engineGain.gain.value = 0;
        const f = c.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 500;
        engineOsc.connect(f); f.connect(engineGain); engineGain.connect(c.destination);
        engineOsc.start();
      }
      engineOsc.frequency.setTargetAtTime(60 + speed01 * 180, c.currentTime, 0.1);
      engineGain.gain.setTargetAtTime(0.03 + speed01 * 0.05, c.currentTime, 0.1);
    },
    setMuted(m) {
      A.muted = m;
      if (engineGain) engineGain.gain.value = 0;
    },
  };
  return A;
}
