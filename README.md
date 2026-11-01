# Alex’s Guitar

A personal guitar exercise library built with Astro 7, strict TypeScript, and plain CSS. Exercises live in Markdown and generate static pages. No database or frontend framework is needed.

## Get started

Use Node **22.23.4 or newer** (the minimum required by the current Astro starter). If you use nvm:

```sh
nvm install
nvm use
npm install
npm run dev
```

Open the local URL printed by Astro, normally http://localhost:4321.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run check` | Check Astro and TypeScript files |
| `npm run build` | Generate the static site in `dist/` |
| `npm run preview` | Preview a production build locally |

## Add an exercise

Create a Markdown file in `src/content/exercises/`, for example `alternate-picking.md`:

```md
---
title: Alternate picking
description: Build a relaxed, consistent picking motion.
category: Technique
level: Beginner
minutes: 5
bpm: 60
---

## The exercise

Write your instructions, tablature, and practice notes here.
```

The file automatically appears in the library and gets a page at `/exercises/alternate-picking/`. The schema in `src/content.config.ts` validates metadata. Levels are `Beginner`, `Intermediate`, or `Advanced`; `bpm` is optional. Use fenced code blocks for plain-text tablature. Put any media in `public/` and link to it with an absolute URL path such as `/audio/example.mp3`.

The included chromatic warm-up is sample content you can replace.

## Project structure

- `src/content/exercises/`: exercise Markdown files
- `src/content.config.ts`: collection schema and loader
- `src/pages/index.astro`: library
- `src/pages/exercises/[...id].astro`: generated exercise pages
- `src/layouts/Layout.astro`: shared page layout
- `src/styles/global.css`: responsive site styles
- `public/`: static assets

## Hosting

The project is configured for static hosting on Netlify. `npm run build` produces `dist/`. No deployment has been created yet. Personal use does not automatically make a deployment private; access control depends on the host settings.

## Astro documentation and AI tools

- [Getting started](https://docs.astro.build/en/getting-started/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Official Astro Docs MCP](https://docs.astro.build/en/guides/build-with-ai/), endpoint: `https://mcp.docs.astro.build/mcp`

The official docs MCP was available and used during setup. No additional Astro skill is required to work on this project.

## Fretboard note trainer

Open `/exercises/fretboard-notes/` from the library. The trainer uses standard tuning and frets 0–11:

- All 12 pitch classes in shuffled sets, with each accidental randomly spelled as a sharp or flat and no consecutive repeats.
- Four preparation clicks, then six progress lights and six beats per note: low E → A → D → G → B → high E.
- Adjustable 20–180 BPM, timed sessions (1–30 minutes) or endless practice.
- An audible Web Audio metronome, accented on the first count-in beat and each new note. Sound starts after pressing Start; there is no mute control.
- Pause/resume holds the notes, adds a fresh count-in, and restarts the current note on low E. Speed can change while paused. End a session to change its mode or duration.
- The timer excludes preparation and pauses. Completed notes count only full six-beat rounds. Backgrounding the page or interrupting audio pauses practice.

The trainer does not listen to the guitar or score playing. `src/lib/fretboard.ts` handles note selection and beat mapping; `src/scripts/fretboard.ts` schedules audio ahead on the audio clock and updates the practice display.

Run `npm test` for note coverage, repetition, beat sequencing, and timer formatting checks.

## Install as an app (PWA)

The production build includes a web app manifest, pick icons (including the iOS touch icon and Android maskable icon), and a versioned offline cache. No external fonts, audio downloads, or network services are required for the note trainer.

1. Deploy `dist/` to an **HTTPS** static host.
2. On iPhone/iPad, open the deployed address in Safari, tap **Share → Add to Home Screen**, enable **Open as Web App** if shown, and tap **Add**.
3. On Android or desktop, use the browser’s **Install app / Add to Home screen** menu when available.

Visit once online and let the page finish loading before going offline. The library and exercise are precached together. Updates download and activate in the background without reloading an active practice session. An update notice lets you choose when to reload. Online navigations revalidate HTML; cached pages remain available offline. Sound still requires pressing Start. The device/browser can clear offline data, so reopen online if needed.

Offline support runs only in production builds, not `npm run dev`. To test locally, run `npm run build` and `npm run preview`. Localhost is valid for desktop testing; an iPhone cannot reach your computer through `127.0.0.1`, and an ordinary HTTP LAN address will not provide service-worker support. Use a phone-accessible HTTPS deployment for installation and offline use.

`integrations/pwa.mjs` generates `dist/sw.js` from `scripts/service-worker.template.js`, hashing the built assets for each cache version. The app assumes hosting at the domain root. Serve `sw.js` and `manifest.webmanifest` with revalidation (for example `Cache-Control: no-cache`); hashed `_astro/` assets can use long immutable caching. Offline files are stored on the device: this is not an authentication or private-hosting mechanism.


## Deploy to Netlify

`netlify.toml` configures Node 22.23.4, validation followed by the Astro build, and the `dist` publish directory. No server adapter, functions, secrets, or environment variables are needed.

### Connect a repository

1. Push this project, including `package-lock.json`, to your Git provider.
2. In Netlify, choose **Add new project → Import an existing project** and select the repository.
3. Keep the base directory at the repository root. Netlify reads the build command and publish directory from `netlify.toml`.
4. Deploy, then open the generated HTTPS address. Future repository pushes trigger builds.

### Manual upload

With the Node version in `.nvmrc`, run:

```sh
npm ci
npm run check
npm test
npm run build
```

Upload the **dist folder** to Netlify’s manual deploy area. Include its `_headers` file and `sw.js`; uploading the source folder will not build the site.

### Verify the deployed app

- Open `/` and `/exercises/fretboard-notes/` directly.
- Confirm `/sw.js`, `/manifest.webmanifest`, and `/icons/apple-touch-icon.png` load successfully.
- Visit online once, wait for the initial page to finish loading, then check the exercise offline.
- Install from Safari’s Share menu on iPhone, or the install menu in other supported browsers.

`public/_headers` is copied into `dist/` and tells Netlify to revalidate the service worker, manifest, and named icons. Only fingerprinted `_astro/` assets receive immutable caching. There is no catch-all SPA rewrite, so missing files return normal 404s. The offline cache is rebuilt automatically whenever the site content changes. PWA updates activate in the background; use the update notice or an ordinary reload to load the latest interface.

A custom domain can be added later without changing the manifest; all app URLs are relative to the domain root.

## Know your chords

Open `/exercises/know-your-chords/` from the library. This silent, untimed exercise uses 10-question sessions, a touch-friendly note/quality keypad, feedback, chord-tone explanations, and a scale reference after each answer.

All seven triads in all 15 conventional major key signatures and all 15 natural-minor key signatures are available immediately. Enharmonic keys are included separately to teach correct key spelling. Equivalent pitches are accepted, with the conventional spelling explained. Minor always uses the natural-minor pattern, including minor `v`.

Choose single chords, short progressions, or both. Reverse questions (chord name → Roman numeral) are optional. In a progression, answer one chord at a time; the full progression counts as correct only when all its chords are correct without revealing an answer.

Review records and preferences are stored on this device under `guitar-workout:harmony:v1`. Missed questions return after three intervening questions when there is room in the session and remain due for later sessions. Correct reviews are scheduled after 1, 3, 7, 14, 30, then 60 days; errors reset the interval. Due questions take priority over unseen questions. These intervals are a simple practice heuristic, not a calibrated model of individual memory. Progress does not sync across devices or browsers, and clearing site data removes it. If storage is blocked, the exercise still works for the visit.

The generated PWA cache includes this exercise and its assets automatically. Existing installations receive it after downloading the new version; reload when ready.

## Know your intervals

Open `/exercises/know-your-intervals/`. Each round chooses one ascending interval and keeps it fixed while all 12 pitch classes appear as tonics exactly once, in shuffled order. The ten intervals are minor/major 2nds, 3rds, 6ths and 7ths, plus perfect 4ths and 5ths. Unison and tritone are excluded. New rounds choose a different interval from the previous round.

Tap one of twelve chromatic note buttons. Correct answers show for 0.9 seconds; wrong answers highlight the correct pitch and show its theoretical spelling for 1.5 seconds, then advance automatically. Equivalent pitches are accepted, including answers whose theoretical spelling requires a double accidental. The interval and changing tonic are displayed separately. At the end, see a score out of 12 and start another round. Automatic advancement pauses while the page is hidden. This exercise is silent, works offline after the production PWA cache is installed, and does not store round scores.
