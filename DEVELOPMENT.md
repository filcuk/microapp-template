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

Defaults: **dark** theme, viewport **1400×1200**, **50s** / **60 fps** capture (auto-boosts frame count if scroll steps would be too large), format **webp**.

WebP delivery defaults aim for **≤ ~10 MB**: start at quality≈52 / 24 fps (`-quality` for libwebp), then automatically ease quality → fps → width until under `--webp-max-mb` (default `10`; `0` disables). Capture stays dense so motion remains smooth after fps downsampling.

### Useful options

```bash
npm run capture:demo -- --help
npm run capture:demo -- --preview              # headed browser; inspect the carousel seam
npm run capture:demo -- --headed               # show Chromium while capturing frames
npm run capture:demo -- --theme light
npm run capture:demo -- --format webm          # often smoothest in desktop players
npm run capture:demo -- --format gif
npm run capture:demo -- --format webp,gif      # several at once
npm run capture:demo -- --webp-max-mb 10       # default size budget
npm run capture:demo -- --width 1400 --webp-width 900   # capture wide, export narrower
npm run capture:demo -- --reuse-frames                 # re-encode only (uses res/.demo-scroll-frames)
npm run capture:demo -- --reuse-frames --webp-width 800 --webp-quality 60
npm run capture:demo -- --clean-frames                 # delete frames after encode
npm run capture:demo -- --webp-quality 70 --webp-max-mb 0  # sharper, no size cap
npm run capture:demo -- --duration 16000 --fps 60 --width 900 --height 560
npm run capture:demo -- --basename demo-scroll-dark --theme dark
```

`--width` / `--height` are the **browser viewport** used while capturing. `--webp-width` only scales the encoded WebP (and size-budget passes may shrink it further). `--dpr` is unrelated: it multiplies screenshot resolution for sharper pixels (e.g. `2` = Retina), and usually makes files larger.

Frames are kept in `res/.demo-scroll-frames/` after capture (with `frames-meta.json`) so you can tweak encode settings via `--reuse-frames` without re-scrolling the demo. Pass `--clean-frames` to remove them when finished.

| Path | Role |
| ---- | ---- |
| [`scripts/capture-demo-scroll.mjs`](scripts/capture-demo-scroll.mjs) | CLI, frame capture, ffmpeg encode |
| [`scripts/lib/capture-demo-prepare.mjs`](scripts/lib/capture-demo-prepare.mjs) | Injected prep (strip chrome, clone `#main`) |

### Release habit

When the demo changed in a meaningful way, regenerate media before cutting a template release (`release-template` checklist includes this as optional).
