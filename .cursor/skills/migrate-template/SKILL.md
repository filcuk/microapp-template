---
name: migrate-template
description: >-
  Upgrade a microapp fork to a newer microapp-template version with partial
  (used components only) or full catalogue upgrade. Use when migrating,
  upgrading the template, syncing from upstream, or bumping TEMPLATE_VERSION.
---

# Migrate template

Bring a fork onto a newer template revision without clobbering app-specific work.

Read [../_shared/invariants.md](../_shared/invariants.md) and [../_shared/component-map.md](../_shared/component-map.md). Prefer `CHANGELOG.md` on upstream for the version range when it exists.

## 1. Required ask — upgrade style

Before changing files, ask:

- **Partial** — upgrade shell/infra/tokens **and** only components the app already uses (or the user lists). Prefer for production forks.
- **Full** — upgrade the entire template surface (all components, CSS, vendor, demo if present). Prefer when the fork still tracks the full catalogue.

Do not proceed until the user picks one.

## 2. Establish versions and source

1. Read fork `TEMPLATE_VERSION` and `APP_VERSION` from `app/version.js`.
2. Identify upstream (default `filcuk/microapp-template`, or user-specified remote/path).
3. Resolve target revision (tag, branch, or commit) and its `TEMPLATE_VERSION`.
4. Read upstream `CHANGELOG.md` for entries between fork version and target (if present).

## 3. Protect app-owned files

**Do not overwrite** with upstream copies wholesale:

- `index.html` / other app HTML content (merge boot/chrome fixes carefully)
- `app/main.js` (and other app page modules) business logic
- `app/config.js` fork URLs / also-see / theme keys
- `APP_VERSION` in `app/version.js`
- Custom files under `app/res/` supplied by the app
- Fork-owned `app/utils/icons-app.js` (never overwrite; never invent SVG)
- Fork-owned `app/styles.css` and `app/css/app.css` (regenerate `app/css/template.css` from upstream instead)

**Do upgrade** (subject to style):

- `app/shell/**`, `theme-init.js`, tokens, shared utils
- Matched components / CSS / vendor per style
- `TEMPLATE_VERSION` → set to upstream’s value when done

## 4. Apply upgrade

### Path moves

Map legacy flat paths to current layout (see component-map “Legacy path aliases”). Update imports in the fork when moving files.

### Partial

1. Trace used features (same discovery as `finalize-app`).
2. Pull upstream versions of Always keep + those features’ JS/CSS/vendor/infra.
3. Icons: replace `icons-template.js` (+ `icons.js` if needed); keep `icons-app.js`; blanks → `handle-assets`.
4. Skip unused catalogue files unless the user asks to add them (`restore-component`).

### Full

1. Replace/upgrade full `app/components/`, `app/css/` partials (not fork-owned `app.css` / `styles.css`), `app/vendor/`, shell, utils, tokens, and regenerate `css/template.css` from upstream.
2. Still preserve app-owned files listed above.
3. Reconcile demo: keep/update if the fork keeps demo; otherwise leave demo deleted.

### Both styles

- Re-wire broken imports after path moves.
- Preserve `__MICROAPP__` / theme key renames the fork already made.
- Do **not** bump `APP_VERSION` unless the user asks.

## 5. Finish

1. Set fork `TEMPLATE_VERSION` to match upstream target.
2. Summarize what changed and any manual merge conflicts for the user.
3. Run **`health-check`**.
