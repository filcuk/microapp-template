---
name: restore-component
description: >-
  Copy trimmed microapp-template components back into a fork (JS, CSS imports,
  vendor, icons via handle-assets, init wiring, markup). Use when adding back
  a component, restoring dropdown/dialog/table/etc., or expanding a trimmed app.
---

# Restore component

Add one or more catalogue features back into a fork that previously trimmed them. Use [../_shared/component-map.md](../_shared/component-map.md) and [../_shared/invariants.md](../_shared/invariants.md).

## 1. Choose features

Ask which component-map `id`(s) to restore (e.g. `dialog`, `code-block`, `tabular-input`). Confirm source:

- Prefer upstream **tag/commit matching** this fork’s `TEMPLATE_VERSION` in `app/version.js`.
- If mid-migrate to a newer template, use that newer revision instead (or run `migrate-template` first).

Default upstream: `filcuk/microapp-template` (or the remote the user specifies).

## 2. Copy from map

For each id, from the chosen upstream revision:

| Step | Action |
| ---- | ------ |
| JS | Copy `JS` paths from the map into the fork |
| CSS | Ensure the listed partial exists; add `@import` in `app/styles.css` if missing |
| Vendor | Copy vendor / extra CSS listed for that feature |
| Infra | Ensure infra deps exist (`menu`, `dom`, …) — restore those modules if trimmed |
| Icons | Required ids: reuse existing `ICONS` entries; missing artwork → **`handle-assets`** (stub + request; never invent paths) |

## 3. Wire the app

1. `import` + `initX` / `initXs` in the relevant page module (after `initShell()`).
2. Add minimal markup from `USAGE.md` / `demo.html` for that feature (adapt to the app’s UI).
3. Load vendor `<script>` tags on the page when required (Prism, Toast UI — see USAGE).

## 4. Finish

Run **`health-check`**. Note any pending icon stubs awaiting the user.
