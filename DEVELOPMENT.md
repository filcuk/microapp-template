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

Behaviour:

- **Removes** site header, footer, and page-nav from the DOM (not just hidden)
- Turns off sticky section headers
- **Duplicates `#main`** so after the last section you overscroll into the first section again (infinite carousel)
- Captures **screenshots only while scrolling** — no frozen lead-in at the top or hold on the footer
- Encodes **animated WebP** by default (optional WebM / GIF via `--format`); looping the file should look endless

### Prerequisites

```bash
npm ci
npx playwright install chromium   # once per machine
```

Encoding uses system `ffmpeg` if on `PATH`, otherwise the bundled [`ffmpeg-static`](https://www.npmjs.com/package/ffmpeg-static) binary from `npm ci`.

### Record

```bash
npm run capture:demo
```

| File | Notes |
| ---- | ----- |
| `res/demo-scroll.webp` | Default — animated WebP, infinite loop |
| `res/demo-scroll.webm` | With `--format webm` |
| `res/demo-scroll.gif` | With `--format gif` |

### Useful options

```bash
npm run capture:demo -- --help
npm run capture:demo -- --preview              # headed browser; inspect the carousel seam
npm run capture:demo -- --headed               # show Chromium while capturing frames
npm run capture:demo -- --theme dark
npm run capture:demo -- --format webm
npm run capture:demo -- --format gif
npm run capture:demo -- --format webp,gif      # several at once
npm run capture:demo -- --duration 16000 --fps 20 --width 900 --height 560
npm run capture:demo -- --basename demo-scroll-dark --theme dark
```

| Path | Role |
| ---- | ---- |
| [`scripts/capture-demo-scroll.mjs`](scripts/capture-demo-scroll.mjs) | CLI, frame capture, ffmpeg encode |
| [`scripts/lib/capture-demo-prepare.mjs`](scripts/lib/capture-demo-prepare.mjs) | Injected prep (strip chrome, clone `#main`) |

### Release habit

When the demo changed in a meaningful way, regenerate media before cutting a template release (`release-template` checklist includes this as optional).
