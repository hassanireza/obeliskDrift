# Obelisk Drift

A gravity physics ritual across a submerged ruin, built for the Obsidian Game
Store. Guide a single fragment through ten chambers, each with its own field
of gravity wells, drag currents, and obstacles, until it comes to rest in the
socket that calls it home.

Built with React 19, TypeScript in strict mode, and Vite. No backend, no
external game assets, no dependencies at runtime beyond the browser.

## Concept

Obelisk Drift is a slingshot puzzle built on a real two dimensional physics
simulation rather than grid movement. Draw the fragment back and release it.
From there the chamber decides what happens: gravity wells pull and repel,
drag zones sap momentum, obstacles rebound it off course, and the socket
only accepts the fragment if it arrives slow enough to settle. Every chamber
is solvable in a small number of launches, but the path is never the direct
one.

## Art direction

The palette and mood follow the Abyssal Liturgy brief: near black
backgrounds, a single soft directional light, bone white and cold charcoal
tones, no saturated color. Wells render as faint ripples in the dark rather
than glowing orbs, obstacles read like pale, water worn stone, and a fine
grain overlay sits across the whole screen the way it does across the rest
of the store.

## Controls

- Press and drag the fragment away from where you want it to travel, then
  release. This is a slingshot: pulling further increases power, up to a
  cap.
- Works identically with a mouse or a finger. There is no separate mobile
  mode, the same pointer events drive both.

## Project structure

```
src/
  physics/      vector math, chamber and fragment types, the simulation step
  data/         the ten chamber definitions
  game/         the canvas renderer and input loop
  components/   screens: start, chamber select, HUD, outcome overlay
  lib/          localStorage progress tracking, small WebAudio cues
  styles/       design tokens and layout, matching the store's palette
```

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Deploying

A GitHub Actions workflow at `.github/workflows/deploy.yml` builds and
publishes `dist` to GitHub Pages on every push to `main`.

1. Push this repository to GitHub as `obeliskDrift`.
2. In the repo, go to Settings, then Pages, and set Source to
   "GitHub Actions".
3. Push to `main`. The workflow sets the Vite base path automatically from
   the repository name, so the site works whether the repo is named
   `obeliskDrift` or anything else.

If you ever build locally for a specific repo name, pass it explicitly:

```bash
VITE_BASE_PATH=/your-repo-name/ npm run build
```

## Adding this to the store catalog

Add an entry to the Obsidian Game Store's `src/data/games.ts`:

```ts
{
  slug: "obelisk-drift",
  name: "Obelisk Drift",
  tagline: "Every stone remembers its fall.",
  description:
    "A gravity physics ritual across a submerged ruin. Draw the fragment back, release it into the dark, and let each chamber's wells and currents carry it to the socket that calls it home.",
  genre: "arcade",
  developer: "Obsidian Originals",
  plays: 0,
  rating: 5,
  reviewCount: 0,
  colorFrom: "#0c0e12",
  colorTo: "#8b8f94",
  thumbnail: `${import.meta.env.BASE_URL}covers/obelisk-drift.webp`,
  releaseDate: "2026-07-09",
  repoUrl: "https://github.com/hassanireza/obeliskDrift",
  playUrl: "https://hassanireza.github.io/obeliskDrift/",
  isEditorsChoice: true,
}
```
