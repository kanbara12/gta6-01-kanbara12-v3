# SUNCOAST: HEATLINE

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-blue.svg)](game/vendor/LICENSE-threejs.txt)
[![make.fun](https://img.shields.io/badge/make.fun-gta6--01-orange.svg)](https://make.fun/c/gta6-01)

An original Three.js open-world crime game for make.fun's "Make GTA 6" bounty (gta6-01, $1,666 in USDC). You are a driver for hire in Suncoast, a coastal city at sunset. Run eight contracts with the fixer Rae, the lookout Sable and the mechanic Marlo, and end the loop with $22,450 in cash.

The city has 188 buildings with lit windows and rooftop signs, a waterfront, beach, boardwalk kiosks, pier, ferris wheel and lighthouse, 18 cars on the avenues and 20 walkers on the sidewalks. Named patrol units SNOOK-10 through SNOOK-13 pursue, ram and search, and heli SKY-1 orbits with a searchlight at wanted 3 and up. Combat uses four weapons, crew abilities run on Z, X and C, and three original synth radio stations play while you drive.

## Play

Serve the repo root (`node serve.ts`, then open http://localhost:8080) and click ENTER THE CITY. The game is plain static files under `game/`. Three.js is vendored under `game/vendor/`, every sound is synthesised live with WebAudio, and it makes zero network requests. Full details are in [`game/README.md`](game/README.md).

## Screenshots

Four genuine 1280x720 captures from actual gameplay, in `screenshots/`:

1. `1-start.jpg`: the HEATLINE GT on the beach road, boardwalk, ferris wheel and skyline.
2. `2-play.jpg`: driving west into the sunset at 130 KM/H with traffic ahead.
3. `3-chase.jpg`: police chase with heli SKY-1 overhead, spotlight sweeping the road.
4. `4-mission.jpg`: on-foot combat at the crew yard with crew dialogue.

A fifth scene, `?shot=end` (the north beach road to the lighthouse after the final job), is prepared in-game but not submitted. The kit caps `screenshots/` at 4 files.

## License

MIT. Three.js is MIT licensed; see [`game/vendor/LICENSE-threejs.txt`](game/vendor/LICENSE-threejs.txt) and [`game/THIRD-PARTY-NOTICES.md`](game/THIRD-PARTY-NOTICES.md).
