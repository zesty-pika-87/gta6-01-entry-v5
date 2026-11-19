# Costa Palma — Make GTA 6

[![Make GTA 6](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/zesty-pika-87/gta6-01-entry-v5/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/zesty-pika-87/gta6-01-entry-v5/reward.svg)](https://make.fun/bounty/gta6-01)

An open-world crime game in the spirit of GTA 6, built for the
[make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01). Eight jobs. One
coast. Take it all.

## The game

Costa Palma is a sun-soaked coastal city you explore on foot and by car:
steal cars, outrun the Costa Palma PD, run jobs for Nadia Cruz, and become
Legend of the Coast.

- **Open world** — six districts (Marina Row, Solterra Strand, Neon Strip,
  Old Town, The Docks, Palma Plaza), beach + sea, ferris wheel, dock crane,
  night market, golden-hour sky with a visible sun and long shadows.
- **Traffic + pedestrians** — AI cars cruise the grid, pedestrians stroll the
  sidewalks and cross at zebras, some run when a chase passes.
- **Wanted + police** — 1–5 stars, cruisers that chase and PIT, roadblocks at
  3★, a helicopter with a searchlight cone at 4★, foot officers, and a live
  dispatch panel naming every unit, its role and its distance.
- **8 story missions** — First Key, The Broker's Errand, Old Tomas's Debt,
  Hot Wheels, Dockside Double-Cross, Neon Run, Storm Warning, The Palma Job —
  with dialog, objectives, stage bars, timers and rewards.
- **Combat** — fists, pistol, SMG, AR-9, RPG (weapon slots with ammo on the
  HUD), thugs who fight back, pickups, hit-stop and screen shake.
- **Turf war** — every district belongs to PALMA CREW, FLINT CREW or nobody;
  jobs push control toward PALMA, contested districts flash TURF WAR, and the
  board shows the coloured territory map.
- **Side jobs** — taxi fares with a running meter and tips (press T), and
  vigilante takedowns (press V).
- **Day–night cycle** — the clock runs; Neon Run and The Palma Job are
  NIGHT ONLY (20:00–05:00) and pay +25% at night.
- **Crew + respect** — Mira (Driver), Lio (Mechanic) and Kiki (Lookout) ride
  with you; respect ranks run ROOKIE → LEGEND OF THE COAST.
- **Progression** — money, garage, 12 Sun Medallions, street race, CHAIN
  combos, save slots, mission board with map + career stats, victory screen.
- **Sound** — procedural WebAudio: engine, sirens, gunshots, horns, pickups,
  and an original coastal synth loop with a radio DJ chattering between songs.

## Controls

WASD move / drive · E enter or steal a car · F punch · SPACE shoot ·
H horn · R radio · T taxi fare · V vigilante hunt · M map · TAB mission board ·
P pause.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: everything under `game/` is static files, and the
only library is three.js 0.187.0 vendored as minified files under
`game/vendor/`.

## Screenshots

`1-cover.jpg` — golden-hour chase, 4★ wanted, helicopter and roadblock.
`2-street.jpg` — night market on foot, NIGHT ONLY job, taxi fare running.
`3-board.jpg` — turf map, side jobs, NIGHT ONLY tags, career stats.
`4-victory.jpg` — Costa Palma is yours.
