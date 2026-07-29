---
name: health-check
description: >-
  Verify a microapp-template app or fork against boot conventions, Pages
  deploy config, versions, icons/assets hygiene, and optional lint/test.
  Use after init, migrate, sync, restore, finalize, or when the user asks to
  health-check / verify / sanity-check the template or app.
---

# Health check

Run after any lifecycle skill, or when the user asks to verify the app/template.

Read [../_shared/invariants.md](../_shared/invariants.md) and [../_shared/component-map.md](../_shared/component-map.md) as needed.

## Workflow

Copy and fill:

```
Health check:
- [ ] Boot (HTML + initShell)
- [ ] pages.yml vs HTML
- [ ] Demo refs
- [ ] config / version
- [ ] Assets / icons
- [ ] Lint / test (if node_modules)
- [ ] Unused scan (optional)
```

Report each item as **pass**, **fail**, or **skip** with a one-line reason. Fix only what the user asked for; otherwise list failures and stop.

### 1. Boot

For every root `*.html` entry:

- [ ] `app/theme-init.js` in `<head>` (blocking)
- [ ] `app/styles.css` linked
- [ ] Page module is `type="module"`
- [ ] If theme/icon keys differ from defaults: `__MICROAPP__` bridge **before** theme-init
- [ ] Page module calls `initShell()` first (before other inits)

Fail if footer / theme toggle / `#page-nav` are hand-duplicated in HTML instead of coming from `renderPageShell()`.

### 2. Pages workflow

Read `.github/workflows/pages.yml`:

- [ ] `cp` list matches published HTML (`index.html`; `demo.html` only if the file exists)
- [ ] `app/` is copied into `_site`

### 3. Demo refs

- [ ] If `demo.html` is gone: no links to it from `index.html` / README; `pages.yml` does not copy it
- [ ] If demo kept: `app/demo.js` exists and is wired

### 4. Config / version

- [ ] `app/config.js`: `repoUrl`, `appUrl` look intentional (not leftover template placeholders on a shipping fork, unless user kept them)
- [ ] `app/version.js`: valid SemVer for `APP_VERSION` and `TEMPLATE_VERSION`
- [ ] Theme storage key in `config.js` matches `__MICROAPP__.themeStorageKey` when overridden

### 5. Assets / icons

- [ ] No invented SVG paths added in this session (paths only in `app/utils/icons.js`)
- [ ] Shell-required icon ids present (see component-map)
- [ ] Brand files referenced by HTML / `APP_ICON_SRC` / `__MICROAPP__` exist under `app/res/`
- [ ] Blank `ICONS` stubs (`markup: \`\``) or missing brand files are listed as **fail** or explicit **TODO** agreed with the user — not silent

If assets are incomplete, point at the `handle-assets` skill.

### 6. Lint / test

If `node_modules` exists (or after `npm ci` if the user wants a full check):

```bash
npm run lint
npm test
```

Skip with reason if deps are not installed and the user did not ask to install.

### 7. Optional unused scan

When finalizing or on request: compare entry import graphs + markup hooks to [component-map.md](../_shared/component-map.md). Report unused catalogue ids / CSS partials / vendor — do not delete unless the user asked (`finalize-app`).

## Output format

```markdown
## Health check result

| Check | Status | Notes |
| ----- | ------ | ----- |
| Boot | pass / fail / skip | … |
| … | … | … |

**Blockers:** …
**Warnings:** …
```
