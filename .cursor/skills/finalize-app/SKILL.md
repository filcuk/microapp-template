---
name: finalize-app
description: >-
  Review a finished microapp fork and remove unused template components, CSS
  partials, vendor bundles, and demo files using the shared component map. Use
  when finalizing, trimming unused components, or cleaning up before ship.
---

# Finalize app

Remove unused catalogue pieces after the app’s feature set is stable. Read [../_shared/component-map.md](../_shared/component-map.md) and [../_shared/invariants.md](../_shared/invariants.md).

## Workflow

### 1. Discover used features

1. List root HTML entry points and their `type="module"` scripts.
2. Trace transitive imports under `app/`.
3. Scan markup for feature hooks (classes / `data-*`): e.g. `.tabs`, `.modal`, `.dropdown`, `.file-dropzone`, `.code-block`, `data-expandable-surface`, `.banner`, `.date-picker`, etc.
4. Mark each component-map `id` as **used** or **unused**. Shell-pulled `tooltip` and `banner` stay **used** while `initShell` remains.

### 2. Propose deletion plan

Present before deleting:

| Unused id | JS to remove | CSS / vendor impact |
| --------- | ------------ | ------------------- |
| … | … | … |

Also list:

- CSS partials safe to drop (no remaining consumer in the map)
- Vendor trees (`app/vendor/prism/`, Toast UI, …) if unused
- Demo: `demo.html` / `app/demo.js` if not intentionally kept
- `template.css` `@import` lines to remove
- `pages.yml` updates

**Never** remove Always keep paths, shell-required icons, or invariants.

### 3. Confirm, then delete

Get explicit user approval. Then:

1. Delete unused component JS (and exclusive vendor/CSS).
2. Drop unused `@import`s from `app/css/template.css`; delete orphaned partial files.
3. Update `pages.yml` if demo HTML was removed.
4. Remove stale demo links from `index.html` / docs if present.
5. Do not strip `ICONS` entries that shell or remaining features still need; optional cleanup of clearly unused icon ids is allowed if listed in the plan.

### 4. Finish

Run **`health-check`** (include optional unused scan — expect clean or only intentional leftovers).
