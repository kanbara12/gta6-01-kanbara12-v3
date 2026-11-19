# SUNCOAST: HEATLINE

An original Three.js open-world crime game, built by an AI agent for make.fun's "Make GTA 6" bounty (gta6-01, $1,666 in USDC). It is a genre-inspired independent game. It uses no GTA assets, characters, logos, map data, or other proprietary content. All art, audio and code in this game are original.

## The game

You are a driver for hire in Suncoast, a coastal city at sunset. The fixer Rae has a package, the lookout Sable watches the roofs, and Marlo keeps the engine running. Run eight contracts, a meet, a pickup, a delivery, a yard sweep, a garage escape, a final run, a marina case swap and a north-beach run to the lighthouse, and end the loop with $22,450 in cash.

The city has 188 buildings of varied heights with lit windows and rooftop signs, plus a waterfront, beach, boardwalk kiosks with roofs and signs, pier, ferris wheel, lighthouse, animated ocean with foam, palms and a full road grid. 18 cars loop the avenues and 20 walkers use the sidewalks. The walkers scatter from speeding cars and gunfire.

Named patrol units SNOOK-10 through SNOOK-13 pursue, ram, lose you and fall back to SEARCH. Heli SKY-1 orbits with a searchlight at wanted 3 and up, its rotor disc spinning and its beam sweeping the road. Combat uses four weapons, PISTOL, SMG, SHOTGUN and BAT, with a $150 bounty per target down.

You start with $1,250. Stage rewards are $2,500, $2,500, $3,000, $3,500, $4,250, $2,000, $1,500 and $1,500. Street-cash stashes pay $250 each, drifts pay out, near misses pay $50, garage repaints drop heat and refuel the car, and the safehouse heals you.

Crew abilities: Z calls Rae (CLEAN SLATE, heat down), X calls Sable (EYES UP, patrols marked on the minimap for 12 s), C calls Marlo (PIT STOP, fuel full plus a speed boost). Each has a cooldown shown in the HUD panel with the crew portrait.

There is also a day cycle with golden hour, midday, dusk and night (press T), three original synth radio stations (SHORELINE 96.7, PIER 102.5, DUNE 89.9), save and load, a pause menu with statistics, a fuel gauge, and a screenshot mode (`?shot=start|play|chase|mission|end`).

## The hero car

The HEATLINE GT was rebuilt from scratch for this entry. It has a sharp sports silhouette with a low sloped hood, raked reflective windshield and rear glass, flared wheel arches with real tires and rims, rear spoiler, twin exhausts, glowing brake lights, and a driver visible through the glass. The chase camera sits low, close and slightly to the side, so the car fills the frame.

## Controls

WASD or arrows move on foot and drive in a car. E enters or exits a car (stealing a parked car adds 1 wanted), and repaints at the garage. Mouse click shoots. Keys 1 to 4 switch weapons. Space is the handbrake drift. Z, X and C call the crew abilities for Rae, Sable and Marlo. R changes the radio station, T cycles the time of day, P or Esc pauses, and M mutes.

## Play

Serve the repo root (`node serve.ts`, then open http://localhost:8080) and click **ENTER THE CITY**. The game is plain static files under `game/`. Three.js is vendored under `vendor/`, every sound is synthesised live with WebAudio, and it makes zero network requests.

## Screenshots

Four genuine 1280x720 captures from actual gameplay, in `screenshots/`:

1. `1-start.jpg`: hero open-world, the HEATLINE GT on the beach road, boardwalk, ferris wheel and skyline.
2. `2-play.jpg`: vehicle gameplay with traffic, driving west into the sunset at 130 KM/H.
3. `3-chase.jpg`: police chase with active police AI and heli SKY-1 overhead, spotlight sweeping the road.
4. `4-mission.jpg`: action and story mission, on-foot combat at the crew yard with crew dialogue.

A fifth scene, `?shot=end` (the north beach road to the lighthouse after the final job), is prepared in-game but not submitted. The kit caps `screenshots/` at 4 files.

## Source outline

- `game/src/core/`: `config` (constants, seeds, economy), `input` (keyboard/mouse), `main` (boot and loop), `rendering` (renderer, camera, time of day), `settings` (quality presets)
- `game/src/world/`: `world` (city, ocean, buildings, palms, ferris wheel, lighthouse), `constants` (districts, streets), `textures` (procedural canvas textures), `boardwalk` (kiosks), `garage` (repaint and refuel), `safehouse` (heal), `stash` (street cash)
- `game/src/vehicles/`: `models` (hero car, traffic, police, heli), `vehicles` (hero car and stealing), `driving` (arcade physics, drift), `traffic` (18 cars)
- `game/src/AI/`: `police` (wanted, pursuit, SEARCH, line-of-sight), `helicopter` (SKY-1 orbit and spotlight), `pedestrians` (walkers that scatter)
- `game/src/combat/`: `combat` (weapons, enemies, damage, bounties)
- `game/src/characters/`: `characters` (player, crew, yard enemies)
- `game/src/missions/`: `missions` (8 contracts, economy, loop reset)
- `game/src/UI/`: `hud` (panels, round minimap, score popups), `dialog` (crew lines), `pause` (menu and stats), `shots` (`?shot=` scenes), `abilities` (Z/X/C crew calls)
- `game/src/audio/`: `audio` (synth SFX), `radio` (3 original stations)
- `game/src/save/`: `save` (localStorage save/load)
