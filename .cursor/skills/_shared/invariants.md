# Template invariants

Rules that lifecycle skills must not violate. Read alongside [component-map.md](component-map.md).

## Vanilla stack

- Plain HTML, CSS, and JavaScript ES modules.
- No new npm runtime deps, bundlers, or parallel styling systems unless the user explicitly approves.
- Dev-only: `npm ci` → `npm run lint` / `npm test` (ESLint).

## Page boot

Every HTML entry point:

1. Optional `window.__MICROAPP__` bridge **before** theme-init (theme key, app icons).
2. Blocking `app/theme-init.js` in `<head>`.
3. `app/styles.css` (imports `tokens.css` + `app/css/*.css` partials — edit partials, not a monolith).
4. Page module calls `initShell()` from `app/shell/shell.js` **first**, then app-specific inits.

Do not duplicate footer, theme toggle, or `#page-nav` markup in HTML — `renderPageShell()` owns that chrome.

## Visibility and listeners

- Show/hide with `setHidden()` from `app/utils/dom.js` (class **and** `hidden` attribute).
- Use `app/utils/document-listeners.js` for click-outside and Escape — do not add per-instance `document` listeners for those. Escape priorities: dialogs `100`, expandable surfaces `90`, menus `50`.

## Icons and brand assets

- Inline UI icons: template catalogue in `app/utils/icons-template.js`, fork additions in `app/utils/icons-app.js`, merged API in `app/utils/icons.js` (`data-icon` / `createIcon()`).
- **Never invent or generate** SVG path data or image bytes. Use existing ids, `{ ref: "…" }` aliases, or blank stubs — then ask the user (see `handle-assets` skill).
- Brand rasters/SVGs live under `app/res/`. Same rule: wire paths; do not invent artwork.
- Source UI icons from [Icônes — Material Icons Round](https://icones.js.org/collection/ic?s=info&variant=Round) when the user supplies markup; set `name` / `attribution` when required.

## Design system

- Tokens from `app/tokens.css` (`--bg`, `--surface`, `--input-bg`, `--accent`, …).
- Existing classes: `.btn`, `.btn-primary`, `.modal`, `.banner`, `.section-panel`, `.code-block`, `.theme-toggle`, etc.
- Respect `prefers-reduced-motion` (tokens + `prefersReducedMotion()` in JS).
- **Demo isolation:** showcase-only helpers may use `demo-*` in `demo.html` / `app/demo.js`. Shared shell, utils, and layout APIs must use generic class names (e.g. `.content-section`, `.content-tier`) — never hardcode `demo-*` selectors. See [`.cursor/rules/demo-isolation.mdc`](../../rules/demo-isolation.mdc).

## Language (technical vs docs)

- **American English** for technical identifiers: file names, CSS classes/custom properties, JS APIs, `data-*` attributes, form `name` values (align with web platform APIs — e.g. `color`, not `colour`).
- **British English** is fine in prose docs (`USAGE.md`, `README.md`, `CHANGELOG.md`, `DESIGN.md`) and user-visible copy.

## Versions

| Constant | File | Who bumps |
| -------- | ---- | --------- |
| `TEMPLATE_VERSION` | `app/version.js` | Template maintainers / migrate skill after upstream sync |
| `APP_VERSION` | `app/version.js` | App authors on the fork |

Do not bump the other constant unless the user asks.

## GitHub Pages

- Entry HTML at repo root; shared assets under `app/`.
- `.github/workflows/pages.yml` `cp` list must match published HTML (`index.html`, optional `demo.html`).
- No backend-only APIs.

## Docs when changing the template catalogue

- Reusable feature added/changed → update `USAGE.md` (and `AGENTS.md` / `demo.html` as needed) per `.cursor/rules/usage-docs.mdc`.
- Update [component-map.md](component-map.md) in the same change.
- Fork app-only logic in `main.js` does not require USAGE updates.

## Confirm before complexity

Ask the user before adding external dependencies, build tools, or non-trivial architecture (routers, state managers, SSR).
