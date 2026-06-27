# microapp-template

A reusable starter for small static microapps: vanilla HTML/CSS/JS, GitHub Pages deployment, and a design system inspired by [pqm-stepper](https://github.com/filcuk/pqm-stepper).

**Live demo:** after enabling GitHub Pages, open `demo.html` on your site (e.g. `https://<user>.github.io/<repo>/demo.html`).

## Quick start

1. Click **Use this template** on GitHub to create a new repo.
2. Rename the app in `index.html` (title, heading, tagline).
3. Build your UI in the `<main>` area and wire logic in [`app/main.js`](app/main.js).
4. Push to `main` — the included workflow deploys to GitHub Pages.

## Available features and components

| Feature | Description |
| -------- | ----------- |
| **Design tokens** | CSS custom properties in [`app/tokens.css`](app/tokens.css) for background, surface, text, borders, accent, banners, and code blocks. Light and dark values via `[data-theme="dark"]`. Component styles in [`app/components.css`](app/components.css). |
| **Theme toggle** | Footer control (injected by `initShell()`): light, dark, or system (`auto`). Stored in `localStorage` under `microapp-theme`. `app/theme-init.js` runs in `<head>` to avoid flash of wrong theme. |
| **Layout shell** | Semantic `header` / `main` / `footer` (footer rendered by JS), max-width 1200px, flex column page. |
| **Buttons** | `.btn` (default), `.btn-primary`, `.btn-icon` (with `aria-pressed` for toggles), `.btn-link`, disabled state. |
| **Inputs** | `.field` / `.field-label` with `.input` (single line) and `.textarea` (multi-line). |
| **Combo button** | Split `.combo-btn` with main action + chevron menu; behaviour from [`app/combo.js`](app/combo.js). |
| **Dropdown** | `.dropdown` with `.dropdown-trigger` and `.dropdown-menu`; behaviour from [`app/dropdown.js`](app/dropdown.js). |
| **Expand** | `.expand` disclosure with notch + label trigger and collapsible `.expand-panel`; behaviour from [`app/expand.js`](app/expand.js). |
| **Tabs** | `.tabs` block with `.tabs-list` / `.tabs-tab` and `.tabs-panel` content; behaviour from [`app/tabs.js`](app/tabs.js). |
| **Page navigation** | Fixed `#page-nav`: always-visible jump up/down (shared progress ring), section links on hover. [`app/page-nav.js`](app/page-nav.js). |
| **Dialogs** | Accessible modal: backdrop, focus trap, Escape, focus restore. Markup uses `.modal` / `.modal-panel`; behaviour from [`app/dialog.js`](app/dialog.js). |
| **External links** | Outgoing `http(s)` links get an arrow-outward icon via `initShell()` / [`app/external-link.js`](app/external-link.js). Opt out with `data-no-external-icon`. |
| **Tooltips** | Instant custom tooltips — no native `title` delay. Add `data-tooltip="…"` and optional `data-tooltip-position="top\|bottom\|left\|right"`. See [`app/tooltip.js`](app/tooltip.js). |
| **Banners** | `.banner.banner-important`, `.banner-info`, `.banner-success`, `.banner-note`, `.banner-warning`, `.banner-error` with left icon via `data-icon` (`important`, `info`, `success`, `note`, `warning`, `error`). |
| **Icons** | Inline SVGs in [`app/icons.js`](app/icons.js) (`light-mode`, `dark-mode`, `auto-mode`, `lines`, …); use `data-icon` in HTML or `createIcon()` in JS. Source from [Icônes — Material Icons (Round)](https://icones.js.org/collection/ic?s=info&variant=Round). Logo files stay in `app/res/`. |
| **Toolbar helper** | `.toolbar` flex row for button groups. |
| **Demo page** | [`demo.html`](demo.html) showcases all components. |
| **Code highlighting** | Optional [Prism.js](https://prismjs.com/) example on the demo page with line numbers; see [`app/prism.js`](app/prism.js) and [`app/vendor/prism/`](app/vendor/prism/). |
| **GitHub Pages** | [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes `index.html`, `demo.html`, and `app/`. |

## Project structure

```
index.html          # Starter homepage
demo.html           # Component showcase
.nojekyll           # Skip Jekyll on GitHub Pages
app/
  styles.css            # Imports tokens.css + components.css
  tokens.css            # Design tokens, base typography, reduced motion
  components.css        # Layout shell and UI components
  theme-init.js         # Theme before first paint
  theme.js              # Theme preference module
  render-shell.js       # Injects footer + page navigation markup
  shell.js              # Shared page boot (render, icons, theme, page nav)
  document-listeners.js # Single document click / Escape registry
  dom.js                # setHidden(), resolveElements(), prefersReducedMotion()
  menu.js               # Shared popup menu logic (combo, dropdown)
  dialog.js         # Modal controller
  combo.js          # Combo button controller
  dropdown.js       # Dropdown menu controller
  expand.js         # Expand / disclosure controller
  tabs.js           # Tabbed section controller
  page-nav.js        # In-page heading nav + jump up/down
  jump-up.js         # Re-exports page-nav (deprecated alias)
  icons.js          # Inline SVG icon registry
  tooltip.js        # Instant tooltips
  external-link.js  # Arrow icon on outgoing links
  main.js           # index.html entry
  demo.js           # demo.html entry
  prism.css            # Prism token colours + line numbers (optional)
  prism.js             # initPrism() helper
  code-block.js        # Code block toggles + copy button
  vendor/prism/        # Vendored Prism core, languages, plugins
  res/app-light.svg    # App logo (light theme) — header, favicon
  res/app-dark.svg     # App logo (dark theme)
  res/sig-light.svg    # Signature mark (light theme) — footer brand
  res/sig-dark.svg     # Signature mark (dark theme)
```

## Local preview

ES modules require a local server (opening `index.html` directly may block imports):

```bash
npx serve .
```

Then open `http://localhost:3000` and `http://localhost:3000/demo.html`.

## GitHub Pages setup

1. Push to `main` (includes the workflow).
2. In the repo **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. After the workflow runs, the site is at `https://<username>.github.io/<repo>/`.

The workflow copies only publishable files into `_site/` (`index.html`, `demo.html`, `.nojekyll`, `app/`). README and other repo files are not published.

## Using components

### Theme

```html
<script src="app/theme-init.js"></script>
<link rel="stylesheet" href="app/styles.css" />
<script type="module" src="app/main.js"></script>
```

```javascript
import { initShell } from "./shell.js";

initShell(); // footer + page nav + icons + theme in one call
```

Or wire individually:

```javascript
import { initTheme, initThemeToggle } from "./theme.js";
initTheme();
initThemeToggle(document.getElementById("theme-toggle"));
```

### Dialog

```javascript
import { initDialog } from "./dialog.js";

const dialog = initDialog({
  dialogEl: document.getElementById("my-dialog"),
  openTriggers: "#open-my-dialog",
});
// dialog.openDialog(), dialog.closeDialog(), dialog.isDialogOpen()
```

Close controls use `data-dialog-close` on backdrop, × button, or footer buttons.

### Tooltip

```html
<button type="button" data-tooltip="Help text" data-tooltip-position="top">?</button>
```

```javascript
import { initTooltips } from "./tooltip.js";
initTooltips(document);
```

### External links

Enabled by `initShell()`. Any `http(s)` link to another origin gets an arrow-outward icon appended automatically. Opt out on a specific link:

```html
<a href="https://example.com" data-no-external-icon>Stay plain</a>
```

### Inputs

```html
<label class="field" for="name">
  <span class="field-label">Name</span>
  <input type="text" id="name" class="input" placeholder="Enter text…" />
</label>

<label class="field" for="notes">
  <span class="field-label">Notes</span>
  <textarea id="notes" class="textarea" rows="4"></textarea>
</label>
```

### Combo button

```javascript
import { initCombo } from "./combo.js";

initCombo(document.getElementById("my-combo"), {
  onMainClick: () => { /* primary action */ },
  onSelect: ({ value, label }) => { /* menu item chosen */ },
});
```

Markup: `.combo-btn` > `.combo-btn-main` + `.combo-btn-toggle` + `ul.combo-menu` with `.combo-menu-item` buttons.

### Dropdown

```javascript
import { initDropdown } from "./dropdown.js";

initDropdown(document.getElementById("my-dropdown"), {
  onSelect: ({ value, label }) => { /* item chosen */ },
});
```

Markup: `.dropdown` > `.dropdown-trigger` + `ul.dropdown-menu` with `.dropdown-menu-item` buttons.

### Expand

```html
<div class="expand">
  <button type="button" class="expand-trigger" aria-expanded="false" aria-controls="my-expand-panel">
    <span class="expand-notch" aria-hidden="true"></span>
    <span class="expand-label">Advanced options</span>
  </button>
  <div id="my-expand-panel" class="expand-panel hidden" hidden>
    <div class="expand-body">More content here.</div>
  </div>
</div>
```

```javascript
import { initExpand, initExpands } from "./expand.js";

initExpands(document); // all .expand blocks

// or one instance:
const expand = initExpand(document.getElementById("my-expand"));
// expand.open(), expand.close(), expand.toggle(), expand.isOpen()
```

### Tabs

```html
<div class="tabs">
  <div class="tabs-list" role="tablist" aria-label="Sections">
    <button type="button" class="tabs-tab" role="tab" id="tab-a" aria-selected="true" aria-controls="panel-a">Overview</button>
    <button type="button" class="tabs-tab" role="tab" id="tab-b" aria-selected="false" aria-controls="panel-b" tabindex="-1">Details</button>
  </div>
  <div id="panel-a" class="tabs-panel" role="tabpanel" aria-labelledby="tab-a">
    <div class="tabs-body">Overview content</div>
  </div>
  <div id="panel-b" class="tabs-panel hidden" role="tabpanel" aria-labelledby="tab-b" hidden>
    <div class="tabs-body">Details content</div>
  </div>
</div>
```

```javascript
import { initTabs, initTabsBlocks } from "./tabs.js";

initTabsBlocks(document); // all .tabs blocks

// or one instance:
const tabs = initTabs(document.getElementById("my-tabs"));
// tabs.selectTab(1), tabs.getActiveIndex()
```

Arrow keys move between tabs when the tab list is focused.

### Page navigation

Injected by `initShell()` via [`app/render-shell.js`](app/render-shell.js). Collects `main h2[id]` headings automatically and shows plain section-title links (same weight and colour as `.section-heading`). Give each section heading a unique `id` and optional `.section-heading` class (`scroll-margin-top` is included).

```javascript
import { initShell } from "./shell.js";

initShell(); // default: main h2[id]

// Custom heading scan (e.g. h3 under a docs root):
initShell({
  pageNav: {
    headingSelector: "main h3[id]",
    headingRoot: document.getElementById("docs"),
  },
});
```

Standalone use without the full shell — insert markup from `PAGE_NAV_MARKUP` in `render-shell.js`, then:

```javascript
import { initPageNavPanel } from "./page-nav.js";

const nav = initPageNavPanel(); // defaults to #page-nav
nav?.rebuild(); // call after adding/removing headings dynamically
nav?.destroy(); // remove listeners when tearing down
```

Jump up scrolls to the top; jump down scrolls to the bottom. Jump buttons are always visible at the bottom-right; the section list appears when you hover anywhere along the right-edge trigger strip (or focus it via keyboard). On touch devices, focus the trigger area to open the section list. The blue ring shows scroll progress. If no matching headings exist, the section list is hidden and only the jump buttons remain.

### Code highlighting (Prism)

Optional syntax highlighting for docs or demos. See [`demo.html`](demo.html) for a Python example with line numbers, highlight toggle, and copy-on-hover.

```html
<link rel="stylesheet" href="app/prism.css" />
<script defer src="app/vendor/prism/prism.min.js"></script>
<script defer src="app/vendor/prism/prism-python.min.js"></script>
<script defer src="app/vendor/prism/prism-line-numbers.min.js"></script>
```

```html
<div class="code-block" data-code-copy="true">
  <div class="code-block-toolbar" role="group" aria-label="Code block options">
    <button type="button" class="btn code-block-toggle" data-code-toggle="line-numbers" aria-pressed="true">Line numbers</button>
    <button type="button" class="btn code-block-toggle" data-code-toggle="highlight" aria-pressed="true">Highlight</button>
  </div>
  <div class="code-block-body">
    <button type="button" class="code-block-copy btn" aria-label="Copy code">Copy</button>
    <pre class="line-numbers language-python"><code class="language-python">def greet(name: str) -> str:
    return f"Hello, {name}!"
</code></pre>
  </div>
</div>
```

```javascript
import { initCodeBlocks } from "./code-block.js";

initCodeBlocks(document);
```

Set `data-code-copy="false"` on `.code-block` to disable the copy button. Line numbers require highlighting to be on.

Add other language components under `app/vendor/prism/` as needed from [Prism](https://prismjs.com/).

### Icons

All inline UI icons live in [`app/icons.js`](app/icons.js). Edit paths there once; pages mount them at load via `initIcons()`.

Browse and copy SVG paths from [Icônes — Google Material Icons (Round variant)](https://icones.js.org/collection/ic?s=info&variant=Round) (`ic` collection, `variant=Round`).

HTML:

```html
<button type="button" data-icon="light-mode" data-icon-class="theme-icon" aria-label="Light"></button>
```

JavaScript:

```javascript
import { createIcon, initIcons } from "./icons.js";

initIcons(document); // mounts every [data-icon] in the page

const svg = createIcon("lines", { className: "btn-icon-svg" });
button.append(svg);
```

Add new icons to the `ICONS` object in `app/icons.js`. App logo (`app/res/app-light.svg`, `app/res/app-dark.svg`) and signature (`app/res/sig-light.svg`, `app/res/sig-dark.svg`) swap by theme via CSS; favicon syncs in `app/brand-icon.js`.

Licensed icon sets (e.g. Material Icons) can use optional metadata on each entry:

```javascript
import { ICON_ATTRIBUTIONS } from "./icons.js";

export const ICONS = {
  info: {
    viewBox: "0 0 24 24",
    markup: `<path fill="currentColor" d="…"/>`,
    attribution: ICON_ATTRIBUTIONS.materialIcons,
    name: "round-info", // source collection id (Icônes / Material Icons)
  },
};
```

- `name` — original icon name in the source collection (metadata only; not used at runtime)
- `attribution` — license notice, inserted as an HTML comment inside the SVG
- `ref` — alias to another `ICONS` key (e.g. `lines: { ref: "note" }`)

Pass `includeAttribution: false` to `createIcon()` if you need the SVG without the comment.

## Agent guidelines

See [`AGENTS.md`](AGENTS.md) for rules when using AI assistants in this repo (confirm before external deps, stay vanilla, reuse components).

## License

MIT — see [LICENSE](LICENSE).
