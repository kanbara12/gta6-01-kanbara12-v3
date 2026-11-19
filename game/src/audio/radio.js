// Original synth radio for SUNCOAST: HEATLINE.
// One clear job: three radio stations, each a tiny step sequencer of
// original melodies played with WebAudio — no recordings, no files.
// SHORELINE 96.7 (sunset drive), PIER 102.5 (night cruise), DUNE 89.9
// (desert wind). R switches station; the HUD shows station + song.

const SONGS = {
  'SHORELINE 96.7': [
    { title: 'Sunset Run', notes: [57, 60, 64, 67, 69, 67, 64, 60], bpm: 96, wave: 'triangle' },
    { title: 'Boardwalk Lights', notes: [55, 59, 62, 65, 62, 59, 55, 52], bpm: 104, wave: 'triangle' },
  ],
  'PIER 102.5': [
    { title: 'Midnight Tide', notes: [48, 51, 55, 58, 55, 51, 48, 46], bpm: 84, wave: 'sine' },
    { title: 'Harbor Static', notes: [50, 53, 57, 60, 57, 53, 50, 47], bpm: 90, wave: 'sine' },
  ],
  'DUNE 89.9': [
    { title: 'Dry Heat', notes: [52, 55, 57, 62, 64, 62, 57, 55], bpm: 112, wave: 'square' },
    { title: 'Dust Road', notes: [54, 57, 60, 64, 60, 57, 54, 50], bpm: 120, wave: 'square' },
  ],
};

export function createRadio(audio) {
  const stations = Object.keys(SONGS);
  const R = {
    stationIndex: 0,
    songIndex: 0,
    step: 0,
    timer: 0,
    playing: false,
    station() { return stations[R.stationIndex]; },
    currentSong() { return SONGS[R.station()][R.songIndex]; },
    nextStation() {
      R.stationIndex = (R.stationIndex + 1) % stations.length;
      R.songIndex = 0; R.step = 0;
    },
    update(dt) {
      if (!R.playing || audio.muted) return;
      const song = R.currentSong();
      const stepDur = 60 / song.bpm / 2;
      R.timer += dt;
      if (R.timer >= stepDur) {
        R.timer -= stepDur;
        const note = song.notes[R.step % song.notes.length];
        const freq = 440 * Math.pow(2, (note - 69) / 12);
        audio.tone(freq, stepDur * 1.8, song.wave, 0.06);
        if (R.step % 4 === 0) audio.tone(freq / 2, stepDur * 2, 'sine', 0.08);
        R.step += 1;
        if (R.step >= song.notes.length * 4) {
          R.step = 0;
          R.songIndex = (R.songIndex + 1) % SONGS[R.station()].length;
        }
      }
    },
  };
  return R;
}
