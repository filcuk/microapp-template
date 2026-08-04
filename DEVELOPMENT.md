# Development

Local checks, preview, and maintainer tooling for this template repository.

## Setup

```bash
npm ci
npx serve .     # http://localhost:3000 — ES modules need a local server
```

## Quality checks

```bash
npm run lint
npm test
npm run manifest:template   # regenerate template-manifest.json after catalogue changes
npm run verify:template     # check tree vs template.lock.json + manifest hashes
```

See [USAGE.md](USAGE.md) for forking, Pages deploy, and the component catalogue.

## README demo scroll capture

Regenerate a looping scroll of [`demo.html`](demo.html) for README media. This is **dev-only** tooling under `scripts/` — it does not ship in `app/` or change the demo page for users.

The Playwright script injects capture layout at runtime: hides site header / footer / page-nav, **always turns off sticky headers** (site + section/tier), and duplicates `#main` so one full scroll height loops seamlessly.

### Prerequisites

```bash
npm ci
npx playwright install chromium   # once per machine
```

Optional: install [ffmpeg](https://ffmpeg.org/) on `PATH` to also write a GIF (e.g. `winget install ffmpeg` on Windows). Without ffmpeg the script still writes WebM and prints a conversion command.

### Record

```bash
npm run capture:demo
```

Default output:

| File | Notes |
| ---- | ----- |
| `res/demo-scroll.webm` | Always written |
| `res/demo-scroll.gif` | When ffmpeg is available |

Defaults: light theme, viewport **900×560**, **14s** scroll for one loop pass.

### Useful options

```bash
npm run capture:demo -- --help
npm run capture:demo -- --preview              # headed browser for OBS / manual capture
npm run capture:demo -- --headed               # show Chromium while recording
npm run capture:demo -- --theme dark
npm run capture:demo -- --duration 16000 --width 900 --height 560
npm run capture:demo -- --no-loop              # skip duplicating #main
npm run capture:demo -- --no-gif               # WebM only
npm run capture:demo -- --basename demo-scroll-dark --theme dark
```

| Path | Role |
| ---- | ---- |
| [`scripts/capture-demo-scroll.mjs`](scripts/capture-demo-scroll.mjs) | CLI, server, Playwright record, ffmpeg GIF |
| [`scripts/lib/capture-demo-prepare.mjs`](scripts/lib/capture-demo-prepare.mjs) | Injected browser prep (hide chrome, clone `#main`) |

### Release habit

When the demo changed in a meaningful way, regenerate media before cutting a template release (`release-template` checklist includes this as optional).
